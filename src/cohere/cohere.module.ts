import { Module } from '@nestjs/common';
import { CohereService } from './services/cohere.service';

@Module({
  providers: [CohereService],
})
export class CohereModule { }
