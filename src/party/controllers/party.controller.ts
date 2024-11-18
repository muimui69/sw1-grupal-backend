import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, HttpStatus, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PartyService } from '../services/party.service';
import { CreatePartyDto } from '../dto/create-party.dto';
import { UpdatePartyDto } from '../dto/update-party.dto';
import { Multer } from 'multer';
import { isValidObjectId, Types } from 'mongoose';
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

    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`The value ${userId} is not a valid ObjectId.`);
    }

    if (!isValidObjectId(tenantId)) {
      throw new BadRequestException(`The value ${tenantId} is not a valid ObjectId.`);
    }

    const partyCreate = await this.partyService.createParty(tenantId, userId, createPartyDto);
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
  async findAll(@Req() req: Request) {

    const statusCode = HttpStatus.OK;
    const userId = req.userId;
    const tenantId = req.tenantId;

    if (!isValidObjectId(userId) || !isValidObjectId(tenantId)) {
      throw new BadRequestException(`One or both ObjectIds are invalid: userId (${userId}) or tenantId (${tenantId})`);
    }

    const partyList = await this.partyService.findAllParties(tenantId, userId, {
      filter: { tenant: new Types.ObjectId(tenantId) },
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


    if (!isValidObjectId(userId) || !isValidObjectId(tenantId)) {
      throw new BadRequestException(`One or both ObjectIds are invalid: userId (${userId}) or tenantId (${tenantId})`);
    }

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
  async update(
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


    if (!isValidObjectId(userId) || !isValidObjectId(tenantId)) {
      throw new BadRequestException(`One or both ObjectIds are invalid: userId (${userId}) or tenantId (${tenantId})`);
    }

    const partyUpdate = await this.partyService.update(id, userId, tenantId, updatePartyDto);
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
    const userId = req.userId;
    const tenantId = req.tenantId;
    if (!isValidObjectId(userId) || !isValidObjectId(tenantId)) {
      throw new BadRequestException(`One or both ObjectIds are invalid: userId (${userId}) or tenantId (${tenantId})`);
    }
    await this.partyService.remove(id, userId, tenantId);
    return {
      statusCode: 200,
      message: "Partido eliminado",
    };
  }
}
