import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthService } from '../auth.service';
import { AuthRequest } from '../interfaces/auth-request.interface';

@Injectable()
export class OptionalAuthenticatedGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers.authorization;

    if (!header) {
      request.auth = undefined;
      return true;
    }

    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Bearer token is required.');
    }

    request.auth = this.authService.verifyAccessToken(token);
    return true;
  }
}
