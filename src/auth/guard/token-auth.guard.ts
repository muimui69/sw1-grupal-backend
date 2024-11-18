import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/services';
import { AuthService } from '../services';
import { Request } from 'express';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.headers["auth-token"];

    if (!token || Array.isArray(token)) {
      throw new BadRequestException("El token de autenticación es inválido o no se proporcionó.");
    }

    const manageToken = this.authService.decodeJwt(token);
    if (typeof manageToken === "string")
      throw new UnauthorizedException(manageToken);

    if (manageToken.isExpired)
      throw new UnauthorizedException('Token expiro');

    const findUser = await this.userService.findIdUser(manageToken.userId);

    if (!findUser)
      throw new UnauthorizedException("user no encontrado")

    req.userId = findUser._id as string;
    return true;
  }
}
