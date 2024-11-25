import { PartialType } from '@nestjs/mapped-types';
import { CreateEnrollementDto } from './create-enrollement.dto';

export class UpdateEnrollementDto extends PartialType(CreateEnrollementDto) {}
