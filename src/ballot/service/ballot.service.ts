import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Party } from 'src/party/entity/party.entity';
import { CandidateWithId } from 'src/blockchain/interfaces/election-create';
import { TenantService } from 'src/tenant/services/tenant.service';
import { CandidateService } from 'src/blockchain/services/candidate.service';
import { PinataService } from 'src/pinata/services/pinata.service';

/**
 * Servicio para generar boletas electorales, combinando candidatos del blockchain
 * con partidos almacenados en la base de datos.
 */
@Injectable()
export class BallotService {
  constructor(
    private readonly tenantService: TenantService,
    private readonly candidateService: CandidateService,
    private pinataService: PinataService,
    @InjectModel(Party.name) private readonly partyModel: Model<Party>,
  ) { }

  /**
   * Genera la boleta electoral combinando candidatos del blockchain y partidos del tenant.
   *
   * @param memberTenantId ID del MemberTenant asociado.
   * @param userId ID del usuario que solicita la boleta.
   * @param tenantId ID del tenant asociado.
   * @returns Boleta electoral combinada con candidatos y partidos.
   * @throws BadRequestException | UnauthorizedException
   */
  async generateBallot(
    memberTenantId: string,
    userId: string,
    tenantId: string
  ): Promise<CandidateWithId[]> {
    try {
      this.validateObjectIds(memberTenantId, userId, tenantId);

      // Verificar si el usuario es miembro del tenant
      await this.validateUserMembership(userId, tenantId);

      // Obtener candidatos y partidos
      const candidates = await this.getCandidates(memberTenantId);
      const parties = await this.getParties(tenantId, userId);

      // Combinar datos para la boleta
      const ballot = await this.combineCandidatesAndParties(candidates, parties);

      return ballot;
    } catch (error) {
      throw new BadRequestException(`Error al generar la boleta electoral: ${error.message}`);
    }
  }

  /**
   * Valida si los IDs proporcionados son válidos.
   * @param memberTenantId ID del MemberTenant.
   * @param userId ID del usuario.
   * @param tenantId ID del tenant.
   * @throws BadRequestException
   */
  private validateObjectIds(memberTenantId: string, userId: string, tenantId: string): void {
    if (!isValidObjectId(memberTenantId)) {
      throw new BadRequestException(`El valor ${memberTenantId} no es un ObjectId válido.`);
    }
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`El valor ${userId} no es un ObjectId válido.`);
    }
    if (!isValidObjectId(tenantId)) {
      throw new BadRequestException(`El valor ${tenantId} no es un ObjectId válido.`);
    }
  }

  /**
   * Valida si el usuario es miembro del tenant.
   * @param userId ID del usuario.
   * @param tenantId ID del tenant.
   * @throws UnauthorizedException
   */
  private async validateUserMembership(userId: string, tenantId: string): Promise<void> {
    const isMember = await this.tenantService.isUserMemberOfTenant(userId, tenantId);
    if (!isMember) {
      throw new UnauthorizedException('No tienes permiso para acceder a este tenant.');
    }
  }

  /**
   * Obtiene la lista de candidatos desde el contrato de blockchain.
   * @param memberTenantId ID del MemberTenant asociado al contrato.
   * @returns Lista de candidatos.
   */
  private async getCandidates(memberTenantId: string): Promise<CandidateWithId[]> {
    return await this.candidateService.getAllCandidates(memberTenantId);
  }

  /**
   * Obtiene la lista de partidos asociados a un tenant y usuario desde la base de datos.
   * @param tenantId ID del tenant.
   * @param userId ID del usuario.
   * @returns Lista de partidos.
   */
  private async getParties(tenantId: string, userId: string): Promise<Party[]> {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const userObjectId = new Types.ObjectId(userId);

    return await this.partyModel.find({ tenant: tenantObjectId, user: userObjectId }).exec();
  }

  /**
   * Combina candidatos y partidos en un formato adecuado para la boleta.
   * @param candidates Lista de candidatos del blockchain.
   * @param parties Lista de partidos del tenant.
   * @returns Boleta combinada.
   */
  private async combineCandidatesAndParties(candidates: CandidateWithId[], parties: Party[]): Promise<any[]> {
    return await Promise.all(
      candidates.map(async (candidate, index) => {
        const party = parties.find(p => p._id.toString() === candidate.partyId);

        const photoUrl = await this.pinataService.getFileUrl(candidate.imgHash);

        return {
          candidateId: index,
          name: candidate.name,
          description: candidate.description,
          imgHash: candidate.imgHash,
          email: candidate.email,
          isActive: candidate.isActive,
          photo: photoUrl,
          party: party
            ? {
              partyId: party._id,
              name: party.name,
              abbreviation: party.abbreviation,
              logo: party.logo,
            }
            : null,
        };
      })
    );
  }

}
