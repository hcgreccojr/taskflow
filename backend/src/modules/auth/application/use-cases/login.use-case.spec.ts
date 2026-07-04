import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { User } from '../../../users/domain/user.entity';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: { findByEmail: jest.Mock };
  let passwordHasher: { compare: jest.Mock };
  let tokenService: { generateAccessToken: jest.Mock; generateRefreshToken: jest.Mock };

  beforeEach(() => {
    userRepository = { findByEmail: jest.fn() };
    passwordHasher = { compare: jest.fn() };
    tokenService = { generateAccessToken: jest.fn(), generateRefreshToken: jest.fn() };
    useCase = new LoginUseCase(userRepository as any, passwordHasher as any, tokenService as any);
  });

  it('throws UnauthorizedException when the user does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'ana@example.com', password: 'senha1234' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when the password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue(
      new User('1', 'Ana', 'ana@example.com', 'hash', new Date()),
    );
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'ana@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns access and refresh tokens on valid credentials', async () => {
    userRepository.findByEmail.mockResolvedValue(
      new User('1', 'Ana', 'ana@example.com', 'hash', new Date()),
    );
    passwordHasher.compare.mockResolvedValue(true);
    tokenService.generateAccessToken.mockReturnValue('access-token');
    tokenService.generateRefreshToken.mockReturnValue('refresh-token');

    const result = await useCase.execute({ email: 'ana@example.com', password: 'senha1234' });

    expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
      sub: '1',
      email: 'ana@example.com',
    });
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });
});
