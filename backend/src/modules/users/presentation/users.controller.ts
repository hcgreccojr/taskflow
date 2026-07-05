import { Controller, Get, Inject, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/infrastructure/decorators/current-user.decorator';
import { TokenPayload } from '../../auth/application/ports/token.service.port';
import { USER_REPOSITORY, UserRepository } from '../application/ports/user-repository.port';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  @Get('me')
  async me(@CurrentUser() user: TokenPayload): Promise<UserResponseDto> {
    const found = await this.userRepository.findById(user.sub);
    if (!found) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return UserResponseDto.fromDomain(found);
  }
}
