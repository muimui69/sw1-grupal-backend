import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Configuration, configurationSchema, MemberTenant, MemberTenantSchema, Tenant, tenantSchema } from './entity';
import { User, userSchema } from 'src/user/entity';
import { SuscriptionService } from './services';
import { TenantService } from './services/tenant.service';
import { SuscriptionController, TenantController } from './controllers';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { Party, PartySchema } from 'src/party/entity';
import { ElectionContractService, TenantContractService } from 'src/blockchain/services';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { StatisticModule } from 'src/statistic/statistic.module';

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
        schema: MemberTenantSchema
      },
      {
        name: Configuration.name,
        schema: configurationSchema
      },
      {
        name: Party.name,
        schema: PartySchema,
      },
    ]),
    JwtModule,
    UserModule,
    HttpModule,
    StatisticModule,
    forwardRef(() => AuthModule),
  ],
  exports: [
    TenantService
  ],
  providers: [SuscriptionService, TenantService, ElectionContractService, TenantContractService],
  controllers: [SuscriptionController, TenantController]
})
export class TenantModule { }
