import { Module } from '@nestjs/common';
import { StatisticService } from './services/statistic.service';
import { StatisticGateway } from './gateway/statistic.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberTenant, MemberTenantSchema } from 'src/tenant/entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MemberTenant.name,
        schema: MemberTenantSchema
      },
    ]),
  ],
  providers: [StatisticGateway, StatisticService],
  exports: [StatisticGateway, StatisticService],
})
export class StatisticModule { }
