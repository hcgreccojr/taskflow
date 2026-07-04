import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from '../../application/ports/token.service.port';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
