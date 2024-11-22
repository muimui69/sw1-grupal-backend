import { Module } from '@nestjs/common';
import { HeliaService } from './services/helia.service';

@Module({
  providers: [HeliaService],
})
export class HeliaModule { }
