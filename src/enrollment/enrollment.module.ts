import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { EnrollmentService, EnrollmentConfigurationService } from './services';
import { EnrollmentController, EnrollmentConfigurationController } from './controllers';
import { Enrollment, EnrollmentSchema, EnrollmentConfiguration, EnrollmentConfigurationSchema } from './entities';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Enrollment.name,
        schema: EnrollmentSchema,
      },
      {
        name: EnrollmentConfiguration.name,
        schema: EnrollmentConfigurationSchema,
      },
    ]),
    JwtModule,
    AuthModule,
    TenantModule,
    forwardRef(() => UserModule),
  ],
  controllers: [EnrollmentController, EnrollmentConfigurationController],
  providers: [EnrollmentService, EnrollmentConfigurationService],
  exports: [EnrollmentService],
})
export class EnrollmentModule { }
