import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';


import { Configuration, configurationSchema, MemberTenant, memberTenantSchema, Tenant, tenantSchema } from './entity';
import { User, userSchema } from 'src/user/entity';
import { SuscriptionService } from './services';
import { TenantService } from './services/tenant.service';
import { SuscriptionController } from './controllers/suscription.controller';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Tenant.name,
        schema: tenantSchema
      },
      {
        name: User.name,
        schema: userSchema
      },
      {
        name: MemberTenant.name,
        schema: memberTenantSchema
      },
      {
        name: Configuration.name,
        schema: configurationSchema
      }
    ]),
    UserModule,
    AuthModule
  ],
  exports: [
    TenantService
  ],
  providers: [SuscriptionService, TenantService],
  controllers: [SuscriptionController]
})
export class TenantModule {}
