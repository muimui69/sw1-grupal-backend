import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateUserDto } from '../dto';
import { UserService } from '../service/user.service';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService
  ) {}

  @Get()
  usefind(){
    return "hello word";
  }

  @Post("created")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  async userCreate(@Body() createUserDto: CreateUserDto) {
    const statusCode = HttpStatus.CREATED;
    const userCreate = await this.userService.createUser(createUserDto);
    return {
      statusCode,
      message: "Usuario creado",
      data:{
        user: userCreate
      }
    }
  }

}
