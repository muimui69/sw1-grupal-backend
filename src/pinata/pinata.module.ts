import { Module } from '@nestjs/common';
import { PinataController } from './controllers';
import { PinataService } from './services';

@Module({
  controllers: [PinataController],
  providers: [PinataService],
  exports: [PinataService],
})
export class PinataModule { }
