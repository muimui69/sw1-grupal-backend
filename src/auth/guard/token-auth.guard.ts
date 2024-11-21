import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { UserService } from 'src/user/services';
import { AuthService } from '../services';
import { Request } from 'express';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) { }

  /**
   * Valida si una solicitud contiene un token de autenticación válido y un usuario asociado.
   * @param context - El contexto de ejecución de la solicitud.
   * @returns Un valor booleano que indica si la solicitud está autenticada.
   * @throws BadRequestException si el token no se proporciona o es inválido.
   * @throws UnauthorizedException si el token ha expirado o el usuario no existe.
   */
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    // Paso 1: Extraer y validar el token de autenticación
    const token = req.headers['auth-token'];
    if (!token || Array.isArray(token)) {
      throw new BadRequestException(
        'El token de autenticación es inválido o no se proporcionó.',
      );
    }

    // Paso 2: Decodificar y validar el token
    const decodedToken = this.authService.decodeJwt(token);
    if (typeof decodedToken === 'string') {
      throw new UnauthorizedException(decodedToken);
    }

    if (decodedToken.isExpired) {
      throw new UnauthorizedException('El token ha expirado.');
    }

    // Paso 3: Verificar el usuario asociado al token
    const user = await this.userService.findIdUser(decodedToken.userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    // Paso 4: Adjuntar el userId al objeto de la solicitud para su procesamiento posterior
    req.userId = user._id.toString();
    return true;
  }
}
