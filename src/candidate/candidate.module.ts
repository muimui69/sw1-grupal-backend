import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Candidate, candidateSchema } from './entity';
import { CandidateService } from './services/candidate.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Candidate.name,
        schema: candidateSchema
      }
    ])
  ],
  providers: [CandidateService]
})
export class CandidateModule {}
