import { PartialType } from '@nestjs/mapped-types';
import { CreateHeliaDto } from './create-helia.dto';

export class UpdateHeliaDto extends PartialType(CreateHeliaDto) {}
