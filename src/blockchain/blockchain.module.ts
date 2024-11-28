import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElectionContractService, TenantContractService } from './services';
import { ElectionContractController, TenantContractController } from './controllers';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberTenant, MemberTenantSchema } from 'src/tenant/entity';
import { HttpModule } from '@nestjs/axios';
import { BlockchainService } from './services/blockchain/blockchain.service';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MemberTenant.name,
        schema: MemberTenantSchema
      },
    ]),
    ConfigModule,
    HttpModule,
    EnrollmentModule,
    TenantModule,
  ],
  controllers: [ElectionContractController, TenantContractController],
  providers: [BlockchainService, ElectionContractService, TenantContractService],
  exports: [BlockchainService, ElectionContractService, TenantContractService],
})
export class BlockchainModule { }
