import { BadRequestException, Body, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Configuration, MemberTenant, Tenant } from '../entity';
import { ClientSession, FilterQuery, Model, Types } from 'mongoose';
import { ICreateMember, ICreateTenant } from '../interface';
import { Plan } from 'src/constant';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(Configuration.name) private configurationModel: Model<Configuration>,
    @InjectModel(MemberTenant.name) private memberModel: Model<MemberTenant>
  ) { }


  public async createTenant(body: ICreateTenant): Promise<Tenant> {
    const findTenant = await this.findOrTenant([
      {
        name: body.name
      },
      {
        domain: body.subdomain
      }
    ])

    if (findTenant.length)
      throw new BadRequestException("Ya existe un tenant con estas caracteristicas")

    const tenantCreate = await this.tenantModel.create({
      name: body.name,
      domain: body.subdomain,
      logo_url: body.logoUrl ?? undefined,
      configuration: await this.configurationModel.create({
        plan: (body.plan === Plan.Basic) ? Plan.Basic : Plan.Gold,
        limit_voting: body.limit_voting,
        document_recognition: (body.plan === Plan.Basic) ? false : true,
        firewall: (body.plan === Plan.Basic) ? false : true,
      })
    })
    return tenantCreate;
  }


  public async findOrTenant(OR: FilterQuery<Tenant>[]): Promise<Tenant[]> {
    const findTenant = await this.tenantModel.find({
      $or: OR
    })
    return findTenant;
  }

  public async findTenant(subdomain: string): Promise<Tenant> {
    const findTenant = await this.tenantModel.findOne({
      domain: subdomain
    });
    if (!findTenant)
      throw new NotFoundException("El subdmonio no pertenece a ningun tenant")
    return findTenant;
  }

  public async createMemberTenant(createMember: ICreateMember, role: string = "member"): Promise<MemberTenant> {
    const findMember = await this.findAndMember(createMember);

    if (findMember)
      throw new BadRequestException("El usuario ya esta en el area de trabajo")

    const createMembers = await this.memberModel.create({
      user: createMember.userId,
      tenant: createMember.tenantId,
      role,
    });

    return createMembers;
  }

  public async findAndMember(createMember: ICreateMember): Promise<MemberTenant> {
    const findMember = await this.memberModel.findOne({
      $and: [
        {
          user: createMember.userId
        },
        {
          tenant: createMember.tenantId
        }
      ]
    })

    return findMember;
  }

  public async findTenantUser(subdomain: string, userId: string): Promise<Tenant> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException("El ID de usuario proporcionado no es válido.");
    }

    const tenant = await this.tenantModel.findOne({ domain: subdomain });

    if (!tenant) {
      throw new NotFoundException("No se encontró un tenant con el subdominio proporcionado.");
    }

    const memberTenant = await this.memberModel.findOne({
      tenant: tenant._id,
      user: userId,
      role: 'owner',
    }).populate('tenant');

    if (!memberTenant) {
      throw new NotFoundException("El subdominio no pertenece a ningún tenant o el usuario no es propietario.");
    }

    return memberTenant.tenant;
  }


  public async findAllTenantsForUser(userId: string): Promise<Tenant[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException("El ID de usuario proporcionado no es válido.");
    }

    const memberTenants = await this.memberModel.find({
      user: userId,
    }).populate('tenant');

    return memberTenants.map(memberTenant => memberTenant.tenant);
  }

  async findTenantById(tenantId: string): Promise<Tenant | null> {
    try {
      const tenant = await this.tenantModel.findById(tenantId).exec();
      if (!tenant) {
        return null;
      }
      return tenant;
    } catch (error) {
      throw new NotFoundException(`Error finding tenant with ID ${tenantId}`);
    }
  }

  async isUserMemberOfTenant(userId: string, tenantId: string): Promise<boolean> {
    const member = await this.memberModel.findOne({
      user: new Types.ObjectId(userId),
      tenant: new Types.ObjectId(tenantId),
    }).exec();
    return !!member;
  }



}
