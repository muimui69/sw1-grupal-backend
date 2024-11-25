import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Enrollment, EnrollmentSchema } from './entities/enrollment.entity';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { UserModule } from 'src/user/user.module';
import { EnrollmentController } from './controllers/enrollement.controller';
import { EnrollmentService } from './services/enrollment.service';
import { EnrollmentConfigurationController } from './controllers/enrollment-configuration.controller';
import { EnrollmentConfigurationService } from './services/enrollment-configuration.service';
import { EnrollmentConfiguration, EnrollmentConfigurationSchema } from './entities/enrollment-confiuration.entity';

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
    AuthModule,
    TenantModule,
    forwardRef(() => UserModule),
  ],
  controllers: [EnrollmentController, EnrollmentConfigurationController],
  providers: [EnrollmentService, EnrollmentConfigurationService],
})
export class EnrollmentModule { }
