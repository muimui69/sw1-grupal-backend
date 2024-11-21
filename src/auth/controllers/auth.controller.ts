import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SignInDto } from '../dto';
import { AuthService } from '../services';

/**
 * Controlador para manejar la autenticación de usuarios.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * Maneja el inicio de sesión de los usuarios.
   * @param body Objeto que contiene las credenciales de inicio de sesión (SignInDto).
   * @returns Un objeto con el token de autenticación y los datos del usuario.
   */
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  public async signIn(@Body() body: SignInDto) {
    const signInResult = await this.authService.signIn(body);

    return {
      statusCode: HttpStatus.OK,
      message: 'Inicio de sesión exitoso.',
      data: signInResult,
    };
  }
}
