import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElectionContractService, TenantContractService } from './services';
import { ElectionContractController, TenantContractController } from './controllers';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberTenant, MemberTenantSchema } from 'src/tenant/entity';
import { HttpModule } from '@nestjs/axios';
import { BlockchainService } from './services/blockchain.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    MongooseModule.forFeature([
      {
        name: MemberTenant.name,
        schema: MemberTenantSchema
      },
    ]),
  ],
  providers: [BlockchainService, ElectionContractService, TenantContractService],
  controllers: [ElectionContractController, TenantContractController],
  exports: [BlockchainService, ElectionContractService, TenantContractService],
})
export class BlockchainModule { }
