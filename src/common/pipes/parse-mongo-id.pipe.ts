import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

@Injectable()
export class ValidateObjectIdPipe implements PipeTransform {
  transform(value: string) {
    if (!isValidObjectId(value)) {
      throw new BadRequestException(`The value ${value} is not a valid ObjectId.`);
    }
    return new Types.ObjectId(value);
  }
}
