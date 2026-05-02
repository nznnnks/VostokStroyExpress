import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ADMIN_ROLES_KEY } from '../constants/auth.constants';
import { AuthRequest } from '../interfaces/auth-request.interface';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<string[]>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();

    if (request.auth?.type !== 'admin') {
      throw new ForbiddenException('Admin access is required.');
    }

    if (!roles.includes(request.auth.role)) {
      throw new ForbiddenException(
        `Insufficient admin permissions. Required: ${roles.join(', ')}. Current: ${request.auth.role ?? 'unknown'}.`,
      );
    }

    return true;
  }
}
