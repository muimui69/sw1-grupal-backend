import { Module } from '@nestjs/common';
import { AwsController } from './controllers';
import { AwsService } from './services';
import { CohereService } from 'src/cohere/services/cohere.service';
import { CohereModule } from 'src/cohere/cohere.module';
import { Enrollment, EnrollmentSchema } from 'src/enrollment/entities/enrollment.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { EnrollmentService } from 'src/enrollment/services/enrollment.service';
import { JwtModule } from '@nestjs/jwt';

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
    CohereModule,
    JwtModule,
  ],
  controllers: [AwsController],
  providers: [AwsService, CohereService, EnrollmentService],
})
export class AwsModule { }
