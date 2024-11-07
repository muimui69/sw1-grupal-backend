import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';

import { User } from 'src/user/entity';
import { SignInDto } from '../dto';
import { AuthTokenResult, ISignInResponse, IUseToken } from '../interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>
  ){}

  public async SignIn(body: SignInDto): Promise<ISignInResponse>{
    const findUser = await this.userModel.findOne({
      email: body.email
    })

    if(!findUser)
      throw new NotFoundException("El usuario no se encuentra o no existe")

    const passwordValidate = bcrypt.compareSync(body.password,findUser.password);

    if(!passwordValidate)
      throw new BadRequestException("Contraseña incorrecta");
    
    const payload = {
      userId: findUser._id
    }

    const token = this.signJWT({
      payload,
      expires: 10 * 24 * 60 * 60
    })

    return {
      token,
      user: findUser
    }
  }



  public signJWT({
    payload,
    expires,
  }: {
    payload: jwt.JwtPayload;
    expires: number | string;
  }): string {
    return this.jwtService.sign(
      payload, 
      {
        secret: this.configService.get<string>("secret_key_jwt"), 
        expiresIn: expires 
      }
    );
  }
  public decodeJwt(token: string): IUseToken | string{
    try {
      const decode = jwt.decode(token) as AuthTokenResult;
      const currentDate = new Date();
      const expiresDate = new Date(decode.exp);
      return {
        userId: decode.userId,
        isExpired: +expiresDate <= +currentDate / 1000 
      };
    } catch (err) {
      console.log(err);
      return "Token invalido";
    }
  }
  
}
