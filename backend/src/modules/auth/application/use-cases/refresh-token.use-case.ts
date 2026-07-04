import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService, TOKEN_SERVICE } from '../ports/token.service.port';

export interface RefreshTokenOutput {
  accessToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokenService: TokenService) {}

  execute(refreshToken: string): RefreshTokenOutput {
    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    return {
      accessToken: this.tokenService.generateAccessToken({ sub: payload.sub, email: payload.email }),
    };
  }
}
