import { BadRequestException, Body, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Configuration, MemberTenant, Tenant } from '../entity';
import { FilterQuery, isValidObjectId, Model, Types } from 'mongoose';
import { ICreateMember, ICreateTenant } from '../interface';
import * as jwt from 'jsonwebtoken';
import { Plan } from 'src/constant';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ITenantToken, TenantTokenResult } from '../interface/IToken-tenant.interface';

@Injectable()
export class TenantService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(Configuration.name) private configurationModel: Model<Configuration>,
    @InjectModel(MemberTenant.name) private memberModel: Model<MemberTenant>
  ) { }

  /**
   * Crea un nuevo tenant.
   * @param body - Datos del nuevo tenant.
   * @returns El tenant creado.
   * @throws BadRequestException si ya existe un tenant con las mismas características.
   */
  public async createTenant(body: ICreateTenant): Promise<Tenant> {
    const findTenant = await this.findOrTenant([
      {
        name: body.name
      },
      {
        domain: body.subdomain
      }
    ])

    if (findTenant.length > 0)
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


  /**
   * Busca un tenant con los filtros proporcionados.
   * @param OR - Condiciones de búsqueda.
   * @returns Los tenants encontrados.
   */
  public async findOrTenant(OR: FilterQuery<Tenant>[]): Promise<Tenant[]> {
    const findTenant = await this.tenantModel.find({
      $or: OR
    }).exec();
    return findTenant;
  }

  /**
  * Busca un tenant por su subdominio.
  * @param subdomain - Subdominio del tenant.
  * @returns El tenant encontrado.
  * @throws NotFoundException si el tenant no existe.
  */
  public async findTenant(subdomain: string): Promise<Tenant> {
    const findTenant = await this.tenantModel.findOne({
      domain: subdomain
    });
    if (!findTenant)
      throw new NotFoundException("El subdmonio no pertenece a ningun tenant")
    return findTenant;
  }

  /**
   * Crea un nuevo member tenant.
   * @param createMember - Datos del nuevo member tenant.
   * @param role - Rol del usuario dentro del tenant.
   * @returns El member tenant creado.
   * @throws BadRequestException si el usuario ya está en el área de trabajo.
   */
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

  /**
   * Busca un member tenant por usuario y tenant.
   * @param createMember - Datos del usuario y tenant.
   * @returns El member tenant encontrado.
   */
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

  /**
   * Obtiene un tenant para un usuario basado en el subdominio.
   * @param subdomain - Subdominio del tenant.
   * @param userId - ID del usuario.
   * @returns El tenant del usuario.
   * @throws NotFoundException si no se encuentra el tenant o el usuario no es propietario.
   */
  public async findTenantUser(subdomain: string, userId: string): Promise<Tenant> {
    if (!isValidObjectId(userId)) {
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

  /**
   * Obtiene todos los tenants asociados a un usuario.
   * @param userId - ID del usuario.
   * @returns Lista de tenants con sus respectivos tokens.
   * @throws BadRequestException si el ID del usuario no es válido.
   */
  public async findAllTenantsForUser(userId: string): Promise<any> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`The value ${userId} is not a valid ObjectId.`);
    }

    const memberTenants = await this.memberModel.find({ user: userId }).populate('tenant');

    const tenantsWithTokens = await Promise.all(memberTenants.map(async (memberTenant) => {
      const tenant = memberTenant.tenant;

      const tokenPayload = {
        memberTenantId: memberTenant._id,
        tenantId: tenant._id,
      };

      const tenantToken = this.generateJwt({
        payload: tokenPayload,
        expires: 10 * 24 * 60 * 60, // Token expira en 10 días
      });

      return {
        tenant,
        token: tenantToken,
      };
    }));

    return tenantsWithTokens;
  }

  /**
   * Busca un tenant por su ID.
   * @param tenantId - ID del tenant.
   * @returns El tenant encontrado o null si no se encuentra.
   */
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

  /**
   * Verifica si un usuario es miembro de un tenant.
   * @param userId - ID del usuario.
   * @param tenantId - ID del tenant.
   * @returns true si el usuario es miembro, false si no lo es.
   */
  async isUserMemberOfTenant(userId: string, tenantId: string): Promise<boolean> {
    const member = await this.memberModel.findOne({
      user: new Types.ObjectId(userId),
      tenant: new Types.ObjectId(tenantId),
    }).exec();
    return !!member;
  }

  /**
   * Obtiene el ID de un member tenant.
   * @param userId - ID del usuario.
   * @param tenantId - ID del tenant.
   * @returns El ID del member tenant si existe, null si no.
   * @throws BadRequestException si el ID del usuario o tenant no es válido.
   */
  async getMemberTenantId(userId: string, tenantId: string): Promise<string | null> {

    if (!isValidObjectId(userId)) {
      throw new BadRequestException("El ID de usuario proporcionado no es válido.");
    }
    if (!isValidObjectId(tenantId)) {
      throw new BadRequestException("El ID del tenant proporcionado no es válido.");
    }

    const member = await this.memberModel.findOne({
      user: new Types.ObjectId(userId),
      tenant: new Types.ObjectId(tenantId),
    }).exec();

    return member ? member._id.toString() : null;
  }


  /**
  * Genera un token JWT.
  * @param options.payload - Información que se incluirá en el token.
  * @param options.expires - Tiempo de expiración del token en segundos o como cadena de texto.
  * @returns El token JWT firmado.
  */
  public generateJwt({
    payload,
    expires,
  }: {
    payload: jwt.JwtPayload;
    expires: number | string;
  }): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('secret_key_jwt'),
      expiresIn: expires,
    });
  }


  /**
   * Decodifica un token JWT y verifica si ha expirado.
   * @param token - Token JWT a decodificar.
   * @returns ITenantToken con el tenantId,memberTenantId y el estado de expiración o una cadena indicando un token inválido.
   */
  public decodeJwt(token: string): ITenantToken | string {
    try {
      const decodedToken = jwt.decode(token) as TenantTokenResult;

      if (!decodedToken) {
        throw new Error('El token no se puede decodificar');
      }

      // Verificación de los datos esperados
      const { tenantId, memberTenantId, exp } = decodedToken;

      if (!tenantId || !memberTenantId) {
        throw new Error('El token no contiene tenantId o memberTenantId válidos');
      }

      const currentDate = new Date().getTime() / 1000;
      const isExpired = exp <= currentDate;

      return {
        tenantId: decodedToken.tenantId,
        memberTenantId: decodedToken.memberTenantId,
        isExpired,
      };
    } catch (error) {
      console.error('Error al decodificar el JWT de tenant:', error);
      return 'Token inválido';
    }
  }

}
