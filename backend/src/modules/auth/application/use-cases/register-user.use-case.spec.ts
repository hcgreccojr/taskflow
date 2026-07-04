import { ConflictException } from '@nestjs/common';
import { RegisterUserUseCase } from './register-user.use-case';
import { User } from '../../../users/domain/user.entity';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepository: { findByEmail: jest.Mock; create: jest.Mock };
  let passwordHasher: { hash: jest.Mock };

  beforeEach(() => {
    userRepository = { findByEmail: jest.fn(), create: jest.fn() };
    passwordHasher = { hash: jest.fn() };
    useCase = new RegisterUserUseCase(userRepository as any, passwordHasher as any);
  });

  it('throws ConflictException when the e-mail is already taken', async () => {
    userRepository.findByEmail.mockResolvedValue(
      new User('1', 'Ana', 'ana@example.com', 'hash', new Date()),
    );

    await expect(
      useCase.execute({ name: 'Ana', email: 'ana@example.com', password: 'senha1234' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('hashes the password and creates the user when the e-mail is free', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-password');
    const created = new User('1', 'Ana', 'ana@example.com', 'hashed-password', new Date());
    userRepository.create.mockResolvedValue(created);

    const result = await useCase.execute({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'senha1234',
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('senha1234');
    expect(userRepository.create).toHaveBeenCalledWith({
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'hashed-password',
    });
    expect(result).toBe(created);
  });
});
