import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, HttpStatus, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PartyService } from '../services/party.service';
import { CreatePartyDto } from '../dto/create-party.dto';
import { UpdatePartyDto } from '../dto/update-party.dto';
import { Multer } from 'multer';
import { Types } from 'mongoose';
import { TokenAuthGuard } from 'src/auth/guard';
import { TenantIdGuard } from 'src/tenant/guard';
import { Request } from 'express';
import { ValidateObjectIdPipe } from 'src/common/pipes';

@Controller('party')
export class PartyController {
  constructor(private readonly partyService: PartyService) { }

  @Post()
  @UseGuards(TokenAuthGuard, TenantIdGuard)
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @Req() req: Request,
    @Body() createPartyDto: CreatePartyDto,
    @UploadedFile() file: Multer.File,
  ) {

    if (file) {
      createPartyDto.logo = file;
    }
    const statusCode = HttpStatus.CREATED;

    const userId = req.userId;
    const tenantId = req.tenantId;

    const partyCreate = await this.partyService.createParty(userId, tenantId, createPartyDto);
    return {
      statusCode,
      message: "Partido creado",
      data: {
        party: partyCreate,
      },
    };
  }

  @Get()
  @UseGuards(TokenAuthGuard, TenantIdGuard)
  async findAll(
    @Req() req: Request
  ) {
    const statusCode = HttpStatus.OK;
    const userId = req.userId;
    const tenantId = req.tenantId;

    const partyList = await this.partyService.findAllParties(userId, tenantId, {
      filter: {
        tenant: new Types.ObjectId(tenantId),
        user: new Types.ObjectId(userId)
      },
    });

    return {
      statusCode,
      message: "Lista de partidos",
      data: {
        parties: partyList,
      },
    };
  }


  @Get(':id')
  @UseGuards(TokenAuthGuard, TenantIdGuard)
  async findOne(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Req() req: Request
  ) {
    const statusCode = HttpStatus.OK;

    const userId = req.userId;
    const tenantId = req.tenantId;

    const party = await this.partyService.findOne(id, userId, tenantId);
    return {
      statusCode,
      message: "Partido encontrado",
      data: {
        party,
      },
    };
  }

  @Patch(':id')
  @UseGuards(TokenAuthGuard, TenantIdGuard)
  @UseInterceptors(FileInterceptor('logo'))
  async patch(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Req() req: Request,
    @Body() updatePartyDto: UpdatePartyDto,
    @UploadedFile() file: Multer.File,
  ) {

    if (file) {
      updatePartyDto.logo = file;
    }

    const statusCode = HttpStatus.OK;
    const userId = req.userId;
    const tenantId = req.tenantId;

    const partyUpdate = await this.partyService.patchParty(id, userId, tenantId, updatePartyDto);
    return {
      statusCode,
      message: "Partido actualizado",
      data: {
        party: partyUpdate,
      },
    };
  }

  @Delete(':id')
  @UseGuards(TokenAuthGuard, TenantIdGuard)
  async remove(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Req() req: Request
  ) {
    const statusCode = HttpStatus.OK;
    const userId = req.userId;
    const tenantId = req.tenantId;
    await this.partyService.removeParty(id, userId, tenantId);
    return {
      statusCode,
      message: "Partido eliminado",
    };
  }
}
