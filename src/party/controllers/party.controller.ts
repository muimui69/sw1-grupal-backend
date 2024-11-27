import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PartyService } from '../services/party.service';
import { CreatePartyDto } from '../dto/create-party.dto';
import { UpdatePartyDto } from '../dto/update-party.dto';
import { Multer } from 'multer';
import { Types } from 'mongoose';
import { TokenAuthGuard } from 'src/auth/guard';
import { Request } from 'express';
import { ValidateObjectIdPipe } from 'src/common/pipes';
import { TokenTenantGuard } from 'src/tenant/guard/token-tenant.guard';

@Controller('party')
export class PartyController {
  constructor(private readonly partyService: PartyService) { }

  /**
   * Crea un nuevo partido asociado a un tenant.
   * @param req - Solicitud que contiene el userId y tenantId.
   * @param createPartyDto - DTO para la creación del partido.
   * @param file - Archivo opcional para el logo.
   * @returns Información del partido creado.
   */
  @Post()
  @UseGuards(TokenAuthGuard, TokenTenantGuard)
  @UseInterceptors(FileInterceptor('logo'))
  @HttpCode(HttpStatus.CREATED)
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
    const party = await this.partyService.createParty(userId, tenantId, createPartyDto);

    return {
      statusCode,
      message: 'Partido creado',
      data: { party },
    };
  }

  /**
   * Obtiene todos los partidos asociados a un tenant.
   * @param req - Solicitud que contiene el userId y tenantId.
   * @returns Lista de partidos.
   */
  @Get()
  @UseGuards(TokenAuthGuard, TokenTenantGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: Request) {

    const statusCode = HttpStatus.OK;
    const userId = req.userId;
    const tenantId = req.tenantId;

    const parties = await this.partyService.findAllParties(userId, tenantId, {
      filter: {
        tenant: new Types.ObjectId(tenantId),
        user: new Types.ObjectId(userId),
      },
    });

    return {
      statusCode,
      message: 'Lista de partidos',
      data: { parties },
    };
  }

  /**
   * Obtiene un partido específico por su ID.
   * @param id - ID del partido.
   * @param req - Solicitud que contiene el userId y tenantId.
   * @returns Información del partido.
   */
  @Get(':id')
  @UseGuards(TokenAuthGuard, TokenTenantGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Req() req: Request,
  ) {

    const statusCode = HttpStatus.OK;
    const userId = req.userId;
    const tenantId = req.tenantId;

    const party = await this.partyService.findOne(id, userId, tenantId);

    return {
      statusCode,
      message: 'Partido encontrado',
      data: { party },
    };
  }

  /**
   * Actualiza un partido existente.
   * @param id - ID del partido.
   * @param req - Solicitud que contiene el userId y tenantId.
   * @param updatePartyDto - DTO con los datos a actualizar.
   * @param file - Archivo opcional para el logo.
   * @returns Información del partido actualizado.
   */
  @Patch(':id')
  @UseGuards(TokenAuthGuard, TokenTenantGuard)
  @UseInterceptors(FileInterceptor('logo'))
  @HttpCode(HttpStatus.OK)
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

    const party = await this.partyService.patchParty(id, userId, tenantId, updatePartyDto);

    return {
      statusCode,
      message: 'Partido actualizado',
      data: { party },
    };
  }

  /**
   * Elimina un partido existente.
   * @param id - ID del partido.
   * @param req - Solicitud que contiene el userId y tenantId.
   * @returns Mensaje de confirmación.
   */
  @Delete(':id')
  @UseGuards(TokenAuthGuard, TokenTenantGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Req() req: Request,
  ) {

    const statusCode = HttpStatus.OK;
    const userId = req.userId;
    const tenantId = req.tenantId;

    await this.partyService.removeParty(id, userId, tenantId);

    return {
      statusCode,
      message: 'Partido eliminado',
    };
  }
}
