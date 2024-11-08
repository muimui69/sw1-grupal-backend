import { PartialType } from '@nestjs/mapped-types';
import { CreateBallotDto } from './create-ballot.dto';

export class UpdateBallotDto extends PartialType(CreateBallotDto) {}
