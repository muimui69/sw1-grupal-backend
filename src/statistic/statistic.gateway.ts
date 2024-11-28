import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { StatisticService } from './statistic.service';
import { CreateStatisticDto } from './dto/create-statistic.dto';
import { UpdateStatisticDto } from './dto/update-statistic.dto';

@WebSocketGateway()
export class StatisticGateway {
  constructor(private readonly statisticService: StatisticService) {}

  @SubscribeMessage('createStatistic')
  create(@MessageBody() createStatisticDto: CreateStatisticDto) {
    return this.statisticService.create(createStatisticDto);
  }

  @SubscribeMessage('findAllStatistic')
  findAll() {
    return this.statisticService.findAll();
  }

  @SubscribeMessage('findOneStatistic')
  findOne(@MessageBody() id: number) {
    return this.statisticService.findOne(id);
  }

  @SubscribeMessage('updateStatistic')
  update(@MessageBody() updateStatisticDto: UpdateStatisticDto) {
    return this.statisticService.update(updateStatisticDto.id, updateStatisticDto);
  }

  @SubscribeMessage('removeStatistic')
  remove(@MessageBody() id: number) {
    return this.statisticService.remove(id);
  }
}
