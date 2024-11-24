import { Module } from '@nestjs/common';
import { EnrollementService } from './services/enrollement.service';
import { EnrollementController } from './controllers/enrollement.controller';
import { FileService } from './services/file.service';
import { FileController } from './controllers/file.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Enrollment, EnrollmentSchema } from './entities/enrollement.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Enrollment.name,
        schema: EnrollmentSchema,
      },
    ]),
  ],
  controllers: [EnrollementController, FileController],
  providers: [EnrollementService, FileService],
})
export class EnrollementModule { }
