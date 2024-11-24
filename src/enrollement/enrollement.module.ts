import { Module } from '@nestjs/common';
import { EnrollementService } from './services/enrollement.service';
import { EnrollementController } from './controllers/enrollement.controller';

@Module({
  controllers: [EnrollementController],
  providers: [EnrollementService],
})
export class EnrollementModule { }
