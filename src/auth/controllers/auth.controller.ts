import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SignInDto } from '../dto';
import { AuthService } from '../services';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService:AuthService
  ){}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  public async signInController(@Body() body: SignInDto){
    const statusCode = HttpStatus.OK;
    const signIn = await  this.authService.SignIn(body);
    return{
      statusCode,
      message: "loggeado correctamente",
      data: signIn
    }
  }
}
