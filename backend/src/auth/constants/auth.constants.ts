import { UserRole } from '@prisma/client';

export const ADMIN_ROLES_KEY = 'admin_roles';

export const ADMIN_USER_ROLES = [
  UserRole.SUPERADMIN,
  UserRole.MANAGER,
  UserRole.EDITOR,
] as const;

export const CLIENT_LIST_EXCLUDED_ROLES = [
  UserRole.SUPERADMIN,
  UserRole.MANAGER,
] as const;

export function isAdminUserRole(role: string | null | undefined) {
  return (
    role === UserRole.SUPERADMIN ||
    role === UserRole.MANAGER ||
    role === UserRole.EDITOR
  );
}

export function isClientListExcludedRole(role: string | null | undefined) {
  return role === UserRole.SUPERADMIN || role === UserRole.MANAGER;
}
