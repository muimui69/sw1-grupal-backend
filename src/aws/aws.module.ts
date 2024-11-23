import { Module } from '@nestjs/common';
import { AwsService } from './services/aws.service';
import { AwsController } from './controllers/aws.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [AwsController],
  providers: [AwsService],
})
export class AwsModule { }
