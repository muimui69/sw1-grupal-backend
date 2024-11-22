import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElectionContractService, TenantContractService } from './services';
import { ElectionContractController, TenantContractController } from './controllers';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberTenant, MemberTenantSchema } from 'src/tenant/entity';
import { HttpModule } from '@nestjs/axios';
import { BlockchainService } from './services/blockchain.service';
import { CandidateService } from './services/candidate.service';
import { PinataModule } from 'src/pinata/pinata.module';
import { CandidateController } from './controllers/candidate.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    PinataModule,
    MongooseModule.forFeature([
      {
        name: MemberTenant.name,
        schema: MemberTenantSchema
      },
    ]),
  ],
  providers: [BlockchainService, ElectionContractService, TenantContractService, CandidateService],
  controllers: [ElectionContractController, TenantContractController, CandidateController],
  exports: [BlockchainService, ElectionContractService, TenantContractService, CandidateService],
})
export class BlockchainModule { }
