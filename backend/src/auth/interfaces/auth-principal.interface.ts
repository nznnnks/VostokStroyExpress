import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  type: 'user';
  userId: string;
  role: UserRole;
  email: string;
}

export interface AuthenticatedAdmin {
  type: 'admin';
  adminId: string;
  role: UserRole;
  email: string;
}

export type AuthPrincipal = AuthenticatedUser | AuthenticatedAdmin;
export type OptionalAuthPrincipal = AuthPrincipal | undefined;

export interface AuthTokenPayload {
  sub: string;
  type: AuthPrincipal['type'];
  role: UserRole;
  email: string;
}
