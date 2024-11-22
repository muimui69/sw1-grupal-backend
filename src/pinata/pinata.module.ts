import { Module } from '@nestjs/common';
import { PinataController } from './controllers/pinata.controller';
import { PinataService } from './services/pinata.service';

@Module({
  controllers: [PinataController],
  providers: [PinataService],
  exports: [PinataService],
})
export class PinataModule { }
