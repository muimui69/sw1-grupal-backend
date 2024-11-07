import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt'

import { User } from '../entity';
import { CreateUserDto } from '../dto';

@Injectable()
export class UserService {
  constructor (
    @InjectModel(User.name) private userModel: Model<User> 
  ){}


  public async createUser(createUserDto:CreateUserDto): Promise<User>{
    const findUsers = await this.userModel.find({
      $or:[
        {
          username: createUserDto.username
        },
        {
          email: createUserDto.email
        }
      ]
    })

    if(findUsers.length){
      throw new BadRequestException("bad request user")
    }
    const salts = bcrypt.genSaltSync(10);
    const userCreate = await this.userModel.create({
      ...createUserDto,
      password: bcrypt.hashSync(createUserDto.password, salts),
      img_url: createUserDto.photo?.originalName,
    });


    return userCreate;
  }

  public async findIdUser(_id: string): Promise<User>{

    const findUser = this.userModel.findById(_id);

    if(!findUser)
      throw new NotFoundException("Usuario no encontrado")

    return findUser;
  }
}
