import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let tokenService: { verifyAccessToken: jest.Mock };

  function contextWith(authorization?: string): ExecutionContext {
    const request: any = { headers: { authorization } };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    tokenService = { verifyAccessToken: jest.fn() };
    guard = new JwtAuthGuard(reflector as unknown as Reflector, tokenService as any);
  });

  it('allows the request when the route is marked @Public()', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(guard.canActivate(contextWith(undefined))).toBe(true);
    expect(tokenService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when there is no Authorization header', () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    expect(() => guard.canActivate(contextWith(undefined))).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the token is invalid', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    tokenService.verifyAccessToken.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    expect(() => guard.canActivate(contextWith('Bearer bad-token'))).toThrow(UnauthorizedException);
  });

  it('allows the request and attaches the user when the token is valid', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    tokenService.verifyAccessToken.mockReturnValue({ sub: '1', email: 'ana@example.com' });
    const context = contextWith('Bearer good-token');

    expect(guard.canActivate(context)).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({ sub: '1', email: 'ana@example.com' });
  });
});
