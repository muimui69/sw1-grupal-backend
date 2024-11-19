import { BadRequestException, Injectable, NotFoundException, Param, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types, isValidObjectId } from 'mongoose';
import { Party } from '../entity';
import { IPartyOptions } from '../interface';
import { CreatePartyDto } from '../dto/create-party.dto';
import { UpdatePartyDto } from '../dto/update-party.dto';
import { CloudinaryService } from 'src/cloudinary/services';
import { TenantService } from 'src/tenant/services/tenant.service';

@Injectable()
export class PartyService {
  constructor(
    @InjectModel(Party.name) private readonly partyModel: Model<Party>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly tenantService: TenantService
  ) { }

  async findAllParties(userId: string, tenantId: string, query: IPartyOptions): Promise<Party[]> {
    try {

      if (!isValidObjectId(userId)) {
        throw new BadRequestException(`The value ${userId} is not a valid ObjectId.`);
      }

      if (!isValidObjectId(tenantId)) {
        throw new BadRequestException(`The value ${tenantId} is not a valid ObjectId.`);
      }

      const { skip = 0, limit = 10, filter = {} } = query;

      const isMember = await this.tenantService.isUserMemberOfTenant(userId, tenantId);
      if (!isMember) {
        throw new UnauthorizedException('No tienes permiso para ver los partidos de este tenant.');
      }

      console.log(filter)
      const parties = await this.partyModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .exec();
      return parties;
    } catch (error) {
      throw new BadRequestException('Failed to retrieve parties.');
    }
  }

  async countParties(query: IPartyOptions): Promise<number> {
    try {
      return await this.partyModel.countDocuments(query.filter);
    } catch (error) {
      throw new BadRequestException('Failed to count parties.');
    }
  }

  async findOrParty(OR: FilterQuery<Party>[]): Promise<Party[]> {
    try {
      return await this.partyModel.find({ $or: OR }).exec();
    } catch (error) {
      throw new BadRequestException('Error while searching for parties.');
    }
  }

  async createParty(userId: string, tenantId: string, createPartyDto: CreatePartyDto): Promise<Party> {
    try {
      if (!isValidObjectId(userId)) {
        throw new BadRequestException(`The value ${userId} is not a valid ObjectId.`);
      }

      if (!isValidObjectId(tenantId)) {
        throw new BadRequestException(`The value ${tenantId} is not a valid ObjectId.`);
      }

      const isMember = await this.tenantService.isUserMemberOfTenant(userId, tenantId);
      if (!isMember) {
        throw new UnauthorizedException('No tienes permiso para ver los partidos de este tenant.');
      }

      const existingParties = await this.findOrParty([
        { tenant: tenantId, name: createPartyDto.name },
      ]);

      if (existingParties.length) {
        throw new BadRequestException('A party with this name already exists for this tenant.');
      }

      let logo = '';
      if (createPartyDto.logo) {
        const result = await this.cloudinaryService.uploadImage(createPartyDto.logo);
        logo = result.secure_url;
      }

      const userObjectId = new Types.ObjectId(userId);
      const tenantObjectId = new Types.ObjectId(tenantId);

      const createdParty = new this.partyModel({
        ...createPartyDto,
        tenant: tenantObjectId,
        user: userObjectId,
        logo,
      });

      return await createdParty.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('A party with this name already exists for this tenant.');
      }
      throw error;
    }
  }

  async findOne(id: string, userId: string, tenantId: string): Promise<Party> {
    try {

      if (!isValidObjectId(userId)) {
        throw new BadRequestException(`The value ${userId} is not a valid ObjectId.`);
      }

      if (!isValidObjectId(tenantId)) {
        throw new BadRequestException(`The value ${tenantId} is not a valid ObjectId.`);
      }

      const isMember = await this.tenantService.isUserMemberOfTenant(userId, tenantId);
      if (!isMember) {
        throw new UnauthorizedException('No tienes permiso para ver los partidos de este tenant.');
      }


      const party = await this.partyModel.findOne({ _id: id, tenant: tenantId, user: userId }).exec();
      if (!party) {
        throw new NotFoundException(`Party with ID ${id} not found for tenant ${tenantId}`);
      }
      return party;
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve party with ID ${id}.`);
    }
  }

  async update(id: string, userId: string, tenantId: string, updatePartyDto: UpdatePartyDto): Promise<Party> {
    try {


      if (!isValidObjectId(userId)) {
        throw new BadRequestException(`The value ${userId} is not a valid ObjectId.`);
      }

      if (!isValidObjectId(tenantId)) {
        throw new BadRequestException(`The value ${tenantId} is not a valid ObjectId.`);
      }

      const isMember = await this.tenantService.isUserMemberOfTenant(userId, tenantId);
      if (!isMember) {
        throw new UnauthorizedException('No tienes permiso para ver los partidos de este tenant.');
      }

      if (updatePartyDto.name) {
        const existingParty = await this.partyModel.findOne({
          tenant: tenantId,
          user: userId,
          name: updatePartyDto.name,
          _id: { $ne: id },
        });
        if (existingParty) {
          throw new BadRequestException('A party with this name already exists for this tenant.');
        }
      }

      let logo = '';
      if (updatePartyDto.logo) {
        const result = await this.cloudinaryService.uploadImage(updatePartyDto.logo);
        logo = result.secure_url;
      }

      const updatedParty = await this.partyModel.findOneAndUpdate(
        { _id: id, tenant: tenantId },
        {
          ...updatePartyDto,
          ...(logo && { logo }),
        },
        { new: true },
      ).exec();

      if (!updatedParty) {
        throw new NotFoundException(`Party with ID ${id} not found for tenant ${tenantId}`);
      }
      return updatedParty;
    } catch (error) {
      throw new BadRequestException(`Failed to update party with ID ${id}.`);
    }
  }

  async remove(id: string, userId: string, tenantId: string): Promise<Party> {
    try {
      if (!isValidObjectId(userId)) {
        throw new BadRequestException(`The value ${userId} is not a valid ObjectId.`);
      }

      if (!isValidObjectId(tenantId)) {
        throw new BadRequestException(`The value ${tenantId} is not a valid ObjectId.`);
      }

      const isMember = await this.tenantService.isUserMemberOfTenant(userId, tenantId);
      if (!isMember) {
        throw new UnauthorizedException('No tienes permiso para ver los partidos de este tenant.');
      }

      const deletedParty = await this.partyModel.findOneAndDelete({ _id: id, tenant: tenantId, user: userId }).exec();
      if (!deletedParty) {
        throw new NotFoundException(`Party with ID ${id} not found for tenant ${tenantId}`);
      }
      return deletedParty;
    } catch (error) {
      throw new BadRequestException(`Failed to delete party with ID ${id}.`);
    }
  }
}
