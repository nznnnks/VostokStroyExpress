import { apiRequest } from "./api-client";

export type StoredAuthType = "user" | "admin";

export type UserSessionPayload = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
};

export type AdminSessionPayload = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
};

export type StoredAuthSession = {
  type: StoredAuthType;
  accessToken: string;
  tokenType: string;
  expiresIn?: string | number;
  user?: UserSessionPayload | null;
  admin?: AdminSessionPayload | null;
};

type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: string | number;
  user?: {
    id: string;
    email: string;
    role: string;
    clientProfile?: {
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  };
  admin?: {
    id: string;
    email: string;
    role: string;
    firstName?: string | null;
    lastName?: string | null;
  };
};

const AUTH_STORAGE_KEY = "vostokstroyexpert-auth";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredAuthSession(): StoredAuthSession | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function setStoredAuthSession(session: StoredAuthSession) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuthSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getStoredAccessToken(expectedType?: StoredAuthType) {
  const session = getStoredAuthSession();

  if (!session) {
    return null;
  }

  if (expectedType && session.type !== expectedType) {
    return null;
  }

  return session.accessToken;
}

export function getStoredDisplayName() {
  const session = getStoredAuthSession();

  if (!session) {
    return null;
  }

  const person = session.type === "admin" ? session.admin : session.user;
  const fullName = [person?.firstName, person?.lastName].filter(Boolean).join(" ").trim();

  return fullName || person?.email || null;
}

export async function loginUser(email: string, password: string) {
  const response = await apiRequest<LoginResponse>("/api/auth/user/login", {
    method: "POST",
    body: { email, password },
  });

  const session: StoredAuthSession = {
    type: "user",
    accessToken: response.accessToken,
    tokenType: response.tokenType,
    expiresIn: response.expiresIn,
    user: response.user
      ? {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role,
          firstName: response.user.clientProfile?.firstName ?? null,
          lastName: response.user.clientProfile?.lastName ?? null,
        }
      : null,
  };

  setStoredAuthSession(session);
  return session;
}

export async function loginAdmin(email: string, password: string) {
  const response = await apiRequest<LoginResponse>("/api/auth/admin/login", {
    method: "POST",
    body: { email, password },
  });

  const session: StoredAuthSession = {
    type: "admin",
    accessToken: response.accessToken,
    tokenType: response.tokenType,
    expiresIn: response.expiresIn,
    admin: response.admin
      ? {
          id: response.admin.id,
          email: response.admin.email,
          role: response.admin.role,
          firstName: response.admin.firstName ?? null,
          lastName: response.admin.lastName ?? null,
        }
      : null,
  };

  setStoredAuthSession(session);
  return session;
}
