import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, UploadedFile, UseInterceptors, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PartyService } from '../services/party.service';
import { CreatePartyDto } from '../dto/create-party.dto';
import { UpdatePartyDto } from '../dto/update-party.dto';
import { Multer } from 'multer';
import { Types } from 'mongoose';

@Controller('party')
export class PartyController {
  constructor(private readonly partyService: PartyService) { }

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @Headers('tenant-id') tenantId: string,
    @Body() createPartyDto: CreatePartyDto,
    @UploadedFile() file: Multer.File,
  ) {
    if (file) {
      createPartyDto.logo = file;
    }

    const statusCode = HttpStatus.CREATED;
    const partyCreate = await this.partyService.createParty(tenantId, createPartyDto)
    return {
      statusCode,
      message: "Partido creado",
      data: {
        party: partyCreate
      }
    }
  }

  @Get()
  async findAll(@Headers('tenant-id') tenantId: string) {
    const statusCode = HttpStatus.OK;
    const partyList = await this.partyService.findAllParties({
      filter: { tenant_id: new Types.ObjectId(tenantId) }
    });
    console.log(partyList)
    return {
      statusCode,
      message: "Lista de partidos",
      data: {
        parties: partyList
      }
    };
  }


  @Get(':id')
  async findOne(@Param('id') id: string, @Headers('tenant-id') tenantId: string) {
    const statusCode = HttpStatus.OK;
    const partyId = await this.partyService.findOne(id, tenantId);
    return {
      statusCode,
      message: "Partido encontrado",
      data: {
        party: partyId
      }
    };
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @Param('id') id: string,
    @Headers('tenant-id') tenantId: string,
    @Body() updatePartyDto: UpdatePartyDto,
    @UploadedFile() file: Multer.File,
  ) {
    if (file) {
      updatePartyDto.logo = file;
    }
    const statusCode = HttpStatus.OK;
    const partyUpdate = await this.partyService.update(id, tenantId, updatePartyDto);
    return {
      statusCode,
      message: "Partido actualizado",
      data: {
        party: partyUpdate
      }
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('tenant-id') tenantId: string) {
    return this.partyService.remove(id, tenantId);
  }
}
