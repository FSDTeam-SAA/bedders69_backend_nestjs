import { ExecutionContext, HttpException } from '@nestjs/common';
import AuthGuard from './auth.guard';

const buildExecutionContext = (authorization?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authorization ? { authorization } : {},
      }),
    }),
  }) as unknown as ExecutionContext;

const buildJwtService = (payload: Record<string, unknown>) => ({
  verify: jest.fn().mockReturnValue(payload),
});

describe('AuthGuard', () => {
  it('allows authenticated users with an allowed role', () => {
    const GuardClass = AuthGuard('admin', 'care_company');
    const jwtService = buildJwtService({
      id: 'user-id',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
    });
    const guard = new GuardClass(jwtService as any);

    const result = guard.canActivate(
      buildExecutionContext('Bearer access-token'),
    );

    expect(result).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith(
      'access-token',
      expect.objectContaining({ secret: expect.any(String) }),
    );
  });

  it('rejects requests without a bearer token', () => {
    const GuardClass = AuthGuard('admin');
    const guard = new GuardClass(buildJwtService({}) as any);

    expect(() => guard.canActivate(buildExecutionContext())).toThrow(
      new HttpException('Unauthorized', 401),
    );
  });

  it('rejects authenticated users with a forbidden role', () => {
    const GuardClass = AuthGuard('admin');
    const guard = new GuardClass(
      buildJwtService({
        id: 'user-id',
        email: 'carer@example.com',
        role: 'carer',
        status: 'active',
      }) as any,
    );

    expect(() =>
      guard.canActivate(buildExecutionContext('Bearer access-token')),
    ).toThrow(new HttpException('Forbidden', 403));
  });

  it('rejects token payloads for inactive accounts', () => {
    const GuardClass = AuthGuard('care_company');
    const guard = new GuardClass(
      buildJwtService({
        id: 'user-id',
        email: 'company@example.com',
        role: 'care_company',
        status: 'suspended',
      }) as any,
    );

    expect(() =>
      guard.canActivate(buildExecutionContext('Bearer access-token')),
    ).toThrow(new HttpException('Account is not active', 403));
  });
});
