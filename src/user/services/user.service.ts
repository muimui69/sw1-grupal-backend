import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User } from '../entity';
import { CreateUserDto } from '../dto';

/**
 * Servicio para gestionar operaciones relacionadas con los usuarios.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>
  ) { }

  /**
   * Crea un nuevo usuario.
   * @param createUserDto DTO con los datos del usuario a crear.
   * @returns El usuario creado.
   */
  public async createUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUsers = await this.userModel.find({
      $or: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existingUsers.length) {
      throw new BadRequestException('El usuario o correo ya están en uso.');
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(createUserDto.password, salt);

    const newUser = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
      img_url: createUserDto.photo?.originalName,
    });

    return newUser;
  }

  /**
   * Encuentra un usuario por su ID.
   * @param _id ID del usuario a buscar.
   * @returns El usuario encontrado.
   */
  public async findIdUser(_id: string): Promise<User> {
    if (!isValidObjectId(_id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    const user = await this.userModel.findById(_id).exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return user;
  }
}
