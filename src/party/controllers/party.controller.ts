import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, UploadedFile, UseInterceptors, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PartyService } from '../services/party.service';
import { CreatePartyDto } from '../dto/create-party.dto';
import { UpdatePartyDto } from '../dto/update-party.dto';
import { Multer } from 'multer';

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
    return this.partyService.findAllParties({ filter: { tenant_id: tenantId } });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('tenant-id') tenantId: string) {
    return this.partyService.findOne(id, tenantId);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('logo')) // Interceptor para manejar el archivo 'logo' en el formulario de actualización
  async update(
    @Param('id') id: string,
    @Headers('tenant-id') tenantId: string,
    @Body() updatePartyDto: UpdatePartyDto,
    @UploadedFile() file: Multer.File, // Recibe el archivo 'logo' cargado si está presente
  ) {
    if (file) {
      updatePartyDto.logo = file; // Asigna el archivo al DTO si está presente
    }
    return this.partyService.update(id, tenantId, updatePartyDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('tenant-id') tenantId: string) {
    return this.partyService.remove(id, tenantId);
  }
}
