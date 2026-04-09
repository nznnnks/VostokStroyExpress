type QueryValue = string | number | boolean | null | undefined;

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  authToken?: string | null;
  body?: BodyInit | Record<string, unknown> | null;
  query?: Record<string, QueryValue>;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function getApiBaseUrl() {
  return (import.meta.env.PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function buildApiUrl(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${getApiBaseUrl()}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { authToken, body, headers, query, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (authToken) {
    requestHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  let requestBody: BodyInit | undefined;

  if (body !== undefined && body !== null) {
    const isNativeBody =
      typeof body === "string" ||
      body instanceof FormData ||
      body instanceof URLSearchParams ||
      body instanceof Blob ||
      body instanceof ArrayBuffer;

    if (isNativeBody) {
      requestBody = body as BodyInit;
    } else {
      if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json");
      }

      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(buildApiUrl(path, query), {
    ...rest,
    headers: requestHeaders,
    body: requestBody,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : `API request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
