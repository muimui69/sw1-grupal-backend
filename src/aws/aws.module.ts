import { Module } from '@nestjs/common';
import { AwsService } from './services/aws.service';
import { AwsController } from './controllers/aws.controller';
import { CohereService } from 'src/cohere/services/cohere.service';
import { CohereModule } from 'src/cohere/cohere.module';
import { Enrollment, EnrollmentSchema } from 'src/enrollment/entities/enrollment.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Enrollment.name,
        schema: EnrollmentSchema,
      },
    ]),
    UserModule,
    AuthModule,
    TenantModule,
    CohereModule
  ],
  controllers: [AwsController],
  providers: [AwsService, CohereService],
})
export class AwsModule { }
