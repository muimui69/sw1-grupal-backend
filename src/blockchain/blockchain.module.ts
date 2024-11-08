import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElectionService, TenantService } from './services';
import { ElectionController, TenantController } from './controllers';

@Module({
  imports: [ConfigModule],
  providers: [ElectionService, TenantService],
  controllers: [ElectionController, TenantController],
  exports: [ElectionService, TenantService],
})
export class BlockchainModule { }
