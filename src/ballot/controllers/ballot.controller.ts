import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BallotService } from '../service/ballot.service';
import { CreateBallotDto } from '../dto/create-ballot.dto';
import { UpdateBallotDto } from '../dto/update-ballot.dto';

@Controller('ballot')
export class BallotController {
  constructor(private readonly ballotService: BallotService) { }

  @Post()
  create(@Body() createBallotDto: CreateBallotDto) {
    return this.ballotService.create(createBallotDto);
  }

  @Get()
  findAll() {
    return this.ballotService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ballotService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBallotDto: UpdateBallotDto) {
    return this.ballotService.update(+id, updateBallotDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ballotService.remove(+id);
  }
}
