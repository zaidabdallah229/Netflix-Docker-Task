import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/** Validates the JWT issued by auth-service and requires role=ADMIN. */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly secret = process.env.JWT_SECRET ?? 'change-me-this-is-a-dev-secret-at-least-32-bytes';

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const header: string = req.headers['authorization'] ?? '';
    if (!header.startsWith('Bearer ')) throw new UnauthorizedException('Missing token');
    let claims: any;
    try {
      claims = jwt.verify(header.slice(7), this.secret, { issuer: 'auth-service', algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    if (claims.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    req.user = claims;
    return true;
  }
}
