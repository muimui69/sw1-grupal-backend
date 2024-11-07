import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Party } from '../entity';
import { IPartyOptions } from '../interface';
import { CreatePartyDto } from '../dto/create-party.dto';
import { UpdatePartyDto } from '../dto/update-party.dto';
import { CloudinaryService } from 'src/cloudinary/services';

@Injectable()
export class PartyService {
  constructor(
    @InjectModel(Party.name) private readonly partyModel: Model<Party>,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async findAllParties(query: IPartyOptions): Promise<Party[]> {
    try {
      const { filter, skip = 0, limit = 10 } = query;
      return await this.partyModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .exec();
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

  async createParty(tenant_id: string, createPartyDto: CreatePartyDto): Promise<Party> {
    try {
      // Check for existing party with the same name for the tenant
      const existingParties = await this.findOrParty([
        { tenant: tenant_id, name: createPartyDto.name },
      ]);

      if (existingParties.length) {
        throw new BadRequestException('A party with this name already exists for this tenant.');
      }

      // Upload logo to Cloudinary if provided
      let logo = '';
      if (createPartyDto.logo) {
        const result = await this.cloudinaryService.uploadImage(createPartyDto.logo);
        logo = result.secure_url;
      }

      const createdParty = new this.partyModel({
        ...createPartyDto,
        tenant: tenant_id,
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

  async findOne(id: string, tenant_id: string): Promise<Party> {
    try {
      const party = await this.partyModel.findOne({ _id: id, tenant: tenant_id }).exec();
      if (!party) {
        throw new NotFoundException(`Party with ID ${id} not found for tenant ${tenant_id}`);
      }
      return party;
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve party with ID ${id}.`);
    }
  }

  async update(id: string, tenant_id: string, updatePartyDto: UpdatePartyDto): Promise<Party> {
    try {
      // Ensure the party name is unique for the tenant if name is updated
      if (updatePartyDto.name) {
        const existingParty = await this.partyModel.findOne({
          tenant: tenant_id,
          name: updatePartyDto.name,
          _id: { $ne: id },
        });
        if (existingParty) {
          throw new BadRequestException('A party with this name already exists for this tenant.');
        }
      }

      // Upload new logo to Cloudinary if provided
      let logo = '';
      if (updatePartyDto.logo) {
        const result = await this.cloudinaryService.uploadImage(updatePartyDto.logo);
        logo = result.secure_url;
      }

      const updatedParty = await this.partyModel.findOneAndUpdate(
        { _id: id, tenant: tenant_id },
        {
          ...updatePartyDto,
          ...(logo && { logo }), // Only update logo if a new file is provided
        },
        { new: true },
      ).exec();

      if (!updatedParty) {
        throw new NotFoundException(`Party with ID ${id} not found for tenant ${tenant_id}`);
      }
      return updatedParty;
    } catch (error) {
      throw new BadRequestException(`Failed to update party with ID ${id}.`);
    }
  }

  async remove(id: string, tenant_id: string): Promise<Party> {
    try {
      const deletedParty = await this.partyModel.findOneAndDelete({ _id: id, tenant: tenant_id }).exec();
      if (!deletedParty) {
        throw new NotFoundException(`Party with ID ${id} not found for tenant ${tenant_id}`);
      }
      return deletedParty;
    } catch (error) {
      throw new BadRequestException(`Failed to delete party with ID ${id}.`);
    }
  }
}
