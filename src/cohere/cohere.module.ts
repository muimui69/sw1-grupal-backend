import { Module } from '@nestjs/common';
import { CohereService } from './services/cohere.service';

@Module({
  controllers: [],
  providers: [CohereService],
})
export class CohereModule { }
