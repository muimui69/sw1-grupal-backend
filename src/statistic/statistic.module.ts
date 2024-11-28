import { Module } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { StatisticGateway } from './statistic.gateway';

@Module({
  providers: [StatisticGateway, StatisticService],
})
export class StatisticModule {}
