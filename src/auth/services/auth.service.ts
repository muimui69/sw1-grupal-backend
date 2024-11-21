import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { User } from 'src/user/entity';
import { SignInDto } from '../dto';
import { AuthTokenResult, ISignInResponse, IUseToken } from '../interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) { }

  /**
   * Inicia sesión para un usuario y genera un token JWT.
   * @param body - Objeto DTO que contiene el correo electrónico y la contraseña.
   * @returns ISignInResponse con el token JWT y la información del usuario.
   * @throws NotFoundException si el usuario no existe.
   * @throws BadRequestException si la contraseña es incorrecta.
   */
  public async signIn(body: SignInDto): Promise<ISignInResponse> {
    const user = await this.userModel.findOne({ email: body.email }).exec();

    if (!user) {
      throw new NotFoundException('El usuario no se encuentra o no existe');
    }

    const isPasswordValid = bcrypt.compareSync(body.password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('La contraseña es incorrecta');
    }

    const tokenPayload = {
      userId: user._id,
    };

    const token = this.generateJwt({
      payload: tokenPayload,
      expires: 10 * 24 * 60 * 60, // 10 días en segundos
    });

    return {
      token,
      user,
    };
  }

  /**
   * Genera un token JWT.
   * @param options.payload - Información que se incluirá en el token.
   * @param options.expires - Tiempo de expiración del token en segundos o como cadena de texto.
   * @returns El token JWT firmado.
   */
  public generateJwt({
    payload,
    expires,
  }: {
    payload: jwt.JwtPayload;
    expires: number | string;
  }): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('secret_key_jwt'),
      expiresIn: expires,
    });
  }

  /**
   * Decodifica un token JWT y verifica si ha expirado.
   * @param token - Token JWT a decodificar.
   * @returns IUseToken con el userId y el estado de expiración o una cadena indicando un token inválido.
   */
  public decodeJwt(token: string): IUseToken | string {
    try {
      const decodedToken = jwt.decode(token) as AuthTokenResult;
      if (!decodedToken) {
        throw new Error('El token no se puede decodificar');
      }

      const currentDate = new Date().getTime() / 1000; // Convertir a segundos
      const isExpired = decodedToken.exp <= currentDate;

      return {
        userId: decodedToken.userId,
        isExpired,
      };
    } catch (error) {
      console.error('Error al decodificar el JWT:', error);
      return 'Token inválido';
    }
  }
}
