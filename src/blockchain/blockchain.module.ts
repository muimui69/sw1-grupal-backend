import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElectionContractService, TenantContractService } from './services';
import { ElectionContractController, TenantContractController } from './controllers';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberTenant, MemberTenantSchema } from 'src/tenant/entity';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: MemberTenant.name,
        schema: MemberTenantSchema
      },
    ]),
  ],
  providers: [ElectionContractService, TenantContractService],
  controllers: [ElectionContractController, TenantContractController],
  exports: [ElectionContractService, TenantContractService],
})
export class BlockchainModule { }
