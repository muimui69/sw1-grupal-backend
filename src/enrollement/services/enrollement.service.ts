import { Injectable } from '@nestjs/common';
import { CreateEnrollementDto } from '../dto/create-enrollement.dto';
import { UpdateEnrollementDto } from '../dto/update-enrollement.dto';

@Injectable()
export class EnrollementService {
  create(createEnrollementDto: CreateEnrollementDto) {
    return 'This action adds a new enrollement';
  }

  findAll() {
    return `This action returns all enrollement`;
  }

  findOne(id: number) {
    return `This action returns a #${id} enrollement`;
  }

  update(id: number, updateEnrollementDto: UpdateEnrollementDto) {
    return `This action updates a #${id} enrollement`;
  }

  remove(id: number) {
    return `This action removes a #${id} enrollement`;
  }
}
