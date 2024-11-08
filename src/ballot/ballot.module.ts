import { Module } from '@nestjs/common';
import { BallotService } from './service/ballot.service';
import { BallotController } from './controllers/ballot.controller';

@Module({
  controllers: [BallotController],
  providers: [BallotService],
})
export class BallotModule { }
