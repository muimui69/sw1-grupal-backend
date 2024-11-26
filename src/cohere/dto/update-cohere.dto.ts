import { PartialType } from '@nestjs/mapped-types';
import { CreateCohereDto } from './create-cohere.dto';

export class UpdateCohereDto extends PartialType(CreateCohereDto) {}
