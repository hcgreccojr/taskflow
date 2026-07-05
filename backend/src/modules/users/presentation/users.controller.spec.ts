import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { USER_REPOSITORY, UserRepository } from '../application/ports/user-repository.port';
import { User } from '../domain/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: USER_REPOSITORY, useValue: userRepository }],
    }).compile();

    controller = moduleRef.get(UsersController);
  });

  it('returns the current user profile', async () => {
    const user = new User('user-1', 'Ana', 'ana@example.com', 'hash', new Date());
    userRepository.findById.mockResolvedValue(user);

    const result = await controller.me({ sub: 'user-1', email: 'ana@example.com' });

    expect(result).toEqual({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      createdAt: user.createdAt,
    });
    expect(userRepository.findById).toHaveBeenCalledWith('user-1');
  });

  it('throws NotFoundException when the user no longer exists', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(controller.me({ sub: 'ghost', email: 'ghost@example.com' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
