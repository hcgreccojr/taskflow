import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let tokenService: {
    verifyRefreshToken: jest.Mock;
    generateAccessToken: jest.Mock;
  };

  beforeEach(() => {
    tokenService = { verifyRefreshToken: jest.fn(), generateAccessToken: jest.fn() };
    useCase = new RefreshTokenUseCase(tokenService as any);
  });

  it('throws UnauthorizedException when the refresh token is invalid or expired', () => {
    tokenService.verifyRefreshToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    expect(() => useCase.execute('bad-token')).toThrow(UnauthorizedException);
  });

  it('issues a new access token when the refresh token is valid', () => {
    tokenService.verifyRefreshToken.mockReturnValue({ sub: '1', email: 'ana@example.com' });
    tokenService.generateAccessToken.mockReturnValue('new-access-token');

    const result = useCase.execute('valid-refresh-token');

    expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
      sub: '1',
      email: 'ana@example.com',
    });
    expect(result).toEqual({ accessToken: 'new-access-token' });
  });
});
