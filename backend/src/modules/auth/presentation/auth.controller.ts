import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiCreatedResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../infrastructure/decorators/public.decorator';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthResponseDto, RefreshResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from './dto/user-response.dto';

const AUTH_THROTTLE_LIMIT = Number(process.env.AUTH_THROTTLE_LIMIT ?? 5);

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Cadastrar novo usuário' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos (e-mail inválido, senha < 8 caracteres)' })
  async register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.registerUserUseCase.execute(dto);
    return UserResponseDto.fromDomain(user);
  }

  @Public()
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuário' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.loginUseCase.execute(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token usando um refresh token válido' })
  @ApiCreatedResponse({ type: RefreshResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado' })
  refresh(@Body() dto: RefreshDto): RefreshResponseDto {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }
}
