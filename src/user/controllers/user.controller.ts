import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post
} from '@nestjs/common';
import { CreateUserDto } from '../dto';
import { UserService } from '../services/user.service';
import { FormDataRequest } from 'nestjs-form-data';

/**
 * Controlador para gestionar operaciones relacionadas con los usuarios.
 */
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService
  ) { }

  /**
   * Endpoint de prueba.
   * @returns Mensaje de prueba.
   */
  @Get()
  useFind(): string {
    return "Hello world";
  }

  /**
   * Crea un nuevo usuario.
   * @param createUserDto DTO con los datos del usuario a crear.
   * @returns Respuesta con el usuario creado.
   */
  @Post('create')
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    const statusCode = HttpStatus.CREATED;
    const userCreate = await this.userService.createUser(createUserDto);

    return {
      statusCode,
      message: "Usuario creado exitosamente.",
      data: {
        user: userCreate,
      },
    };
  }
}
