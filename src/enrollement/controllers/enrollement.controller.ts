import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreateEnrollementDto } from '../dto/create-enrollement.dto';
import { UpdateEnrollementDto } from '../dto/update-enrollement.dto';
import { EnrollementService } from '../services/enrollement.service';

@Controller('enrollement')
export class EnrollementController {
  constructor(private readonly enrollementService: EnrollementService) { }

  @Post()
  create(@Body() createEnrollementDto: CreateEnrollementDto) {
    return this.enrollementService.create(createEnrollementDto);
  }

  @Get()
  findAll() {
    return this.enrollementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollementService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnrollementDto: UpdateEnrollementDto) {
    return this.enrollementService.update(+id, updateEnrollementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enrollementService.remove(+id);
  }
}
