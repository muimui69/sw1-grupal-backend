import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types, isValidObjectId } from 'mongoose';
import { Party } from '../entity';
import { IPartyOptions } from '../interface';
import { CreatePartyDto } from '../dto/create-party.dto';
import { UpdatePartyDto } from '../dto/update-party.dto';
import { CloudinaryService } from 'src/cloudinary/services';
import { TenantService } from 'src/tenant/services/tenant.service';

/**
 * Servicio para gestionar operaciones relacionadas con los partidos.
 */
@Injectable()
export class PartyService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly tenantService: TenantService,
    @InjectModel(Party.name) private readonly partyModel: Model<Party>,
  ) { }

  /**
   * Valida si un usuario es miembro del tenant.
   * @param userId ID del usuario.
   * @param tenantId ID del tenant.
   */
  private async validateUserMembership(userId: string, tenantId: string): Promise<void> {
    const isMember = await this.tenantService.isUserMemberOfTenant(userId, tenantId);
    if (!isMember) {
      throw new UnauthorizedException('No tienes permiso para acceder a este tenant.');
    }
  }

  /**
   * Obtiene una lista de partidos según los filtros especificados.
   * @param userId ID del usuario.
   * @param tenantId ID del tenant.
   * @param query Opciones de consulta.
   * @returns Lista de partidos.
   */
  async findAllParties(userId: string, tenantId: string, query: IPartyOptions): Promise<Party[]> {
    if (!isValidObjectId(userId) || !isValidObjectId(tenantId)) {
      throw new BadRequestException('IDs inválidos proporcionados.');
    }

    await this.validateUserMembership(userId, tenantId);

    const { skip = 0, limit = 10, filter = {} } = query;
    return await this.partyModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  /**
   * Cuenta la cantidad de partidos según los filtros especificados.
   * @param query Opciones de consulta.
   * @returns Número total de partidos.
   */
  async countParties(query: IPartyOptions): Promise<number> {
    return await this.partyModel.countDocuments(query.filter);
  }

  /**
   * Busca partidos que cumplan con las condiciones especificadas.
   * @param OR Filtros de búsqueda.
   * @returns Lista de partidos encontrados.
   */
  async findOrParty(OR: FilterQuery<Party>[]): Promise<Party[]> {
    return await this.partyModel.find({ $or: OR }).exec();
  }

  /**
   * Crea un nuevo partido.
   * @param userId ID del usuario.
   * @param tenantId ID del tenant.
   * @param createPartyDto Datos del partido a crear.
   * @returns Partido creado.
   */
  async createParty(userId: string, tenantId: string, createPartyDto: CreatePartyDto): Promise<Party> {
    if (!isValidObjectId(userId) || !isValidObjectId(tenantId)) {
      throw new BadRequestException('IDs inválidos proporcionados.');
    }

    await this.validateUserMembership(userId, tenantId);

    const existingParties = await this.findOrParty([
      { tenant: new Types.ObjectId(tenantId), user: new Types.ObjectId(userId), name: createPartyDto.name },
    ]);

    if (existingParties.length) {
      throw new BadRequestException('Ya existe un partido con este nombre en el tenant.');
    }

    const logo = createPartyDto.logo
      ? (await this.cloudinaryService.uploadImage(createPartyDto.logo)).secure_url
      : '';

    const createdParty = new this.partyModel({
      ...createPartyDto,
      tenant: new Types.ObjectId(tenantId),
      user: new Types.ObjectId(userId),
      logo,
    });

    return await createdParty.save();
  }

  /**
   * Obtiene un partido por su ID.
   * @param id ID del partido.
   * @param userId ID del usuario.
   * @param tenantId ID del tenant.
   * @returns Partido encontrado.
   */
  async findOne(id: string, userId: string, tenantId: string): Promise<Party> {
    if (!isValidObjectId(id) || !isValidObjectId(userId) || !isValidObjectId(tenantId)) {
      throw new BadRequestException('IDs inválidos proporcionados.');
    }

    await this.validateUserMembership(userId, tenantId);

    const party = await this.partyModel.findOne({
      _id: id,
      tenant: new Types.ObjectId(tenantId),
      user: new Types.ObjectId(userId),
    }).exec();

    if (!party) {
      throw new NotFoundException(`No se encontró el partido con ID ${id} para este tenant.`);
    }

    return party;
  }

  /**
   * Actualiza un partido existente.
   * @param id ID del partido.
   * @param userId ID del usuario.
   * @param tenantId ID del tenant.
   * @param updatePartyDto Datos del partido a actualizar.
   * @returns Partido actualizado.
   */
  async patchParty(id: string, userId: string, tenantId: string, updatePartyDto: UpdatePartyDto): Promise<Party> {
    if (!isValidObjectId(id) || !isValidObjectId(userId) || !isValidObjectId(tenantId)) {
      throw new BadRequestException('IDs inválidos proporcionados.');
    }

    await this.validateUserMembership(userId, tenantId);

    if (updatePartyDto.name) {
      const existingParty = await this.partyModel.findOne({
        tenant: new Types.ObjectId(tenantId),
        user: new Types.ObjectId(userId),
        name: updatePartyDto.name,
        _id: { $ne: id },
      });

      if (existingParty) {
        throw new BadRequestException('Ya existe un partido con este nombre en el tenant.');
      }
    }

    const logo = updatePartyDto.logo
      ? (await this.cloudinaryService.uploadImage(updatePartyDto.logo)).secure_url
      : '';

    const updatedParty = await this.partyModel.findOneAndUpdate(
      { _id: id, tenant: new Types.ObjectId(tenantId), user: new Types.ObjectId(userId) },
      { ...updatePartyDto, ...(logo && { logo }) },
      { new: true },
    ).exec();

    if (!updatedParty) {
      throw new NotFoundException(`No se encontró el partido con ID ${id} para este tenant.`);
    }

    return updatedParty;
  }

  /**
   * Elimina un partido por su ID.
   * @param id ID del partido.
   * @param userId ID del usuario.
   * @param tenantId ID del tenant.
   * @returns Partido eliminado.
   */
  async removeParty(id: string, userId: string, tenantId: string): Promise<Party> {
    if (!isValidObjectId(id) || !isValidObjectId(userId) || !isValidObjectId(tenantId)) {
      throw new BadRequestException('IDs inválidos proporcionados.');
    }

    await this.validateUserMembership(userId, tenantId);

    const deletedParty = await this.partyModel.findOneAndDelete({
      _id: id,
      tenant: new Types.ObjectId(tenantId),
      user: new Types.ObjectId(userId),
    }).exec();

    if (!deletedParty) {
      throw new NotFoundException(`No se encontró el partido con ID ${id} para este tenant.`);
    }

    return deletedParty;
  }
}
