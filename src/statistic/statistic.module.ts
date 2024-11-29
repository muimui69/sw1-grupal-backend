import { forwardRef, Module } from '@nestjs/common';
import { StatisticService } from './services';
import { StatisticGateway } from './gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberTenant, MemberTenantSchema } from 'src/tenant/entity';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MemberTenant.name,
        schema: MemberTenantSchema
      },
    ]),
    forwardRef(() => TenantModule),
  ],
  providers: [StatisticGateway, StatisticService],
  exports: [StatisticGateway, StatisticService],
})
export class StatisticModule { }
