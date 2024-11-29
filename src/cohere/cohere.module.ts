import { Module } from '@nestjs/common';
import { CohereService } from './services';

@Module({
  providers: [CohereService],
})
export class CohereModule { }
