import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user.entity';
import { UserRepository, USER_REPOSITORY } from '../../../users/application/ports/user-repository.port';
import { PasswordHasher, PASSWORD_HASHER } from '../ports/password-hasher.port';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    return this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
  }
}
