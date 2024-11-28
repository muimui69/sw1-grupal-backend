import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { ethers } from 'ethers';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { MemberTenant } from 'src/tenant/entity';
import electionAbi from '../../abis/contracts/Election.json';
import { VoteRecord } from '../../interfaces/election-create';

@Injectable()
export class ElectionContractService {
  private readonly jwtSecretKey: string;
  private readonly hardhatMicroserviceUrl: string;
  private readonly provider: ethers.JsonRpcProvider;
  private readonly wallet: ethers.Wallet;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectModel(MemberTenant.name) private readonly memberTenantModel: Model<MemberTenant>,
  ) {
    this.hardhatMicroserviceUrl = this.configService.get<string>('hardhat_microservice_url');
    const providerUrl = this.configService.get<string>('blockchain_url');
    const privateKey = this.configService.get<string>('wallet_private_key');
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.jwtSecretKey = this.configService.get<string>('secret_key_jwt');
  }

  /**
   * Despliega el contrato de Election y actualiza el MemberTenant con la dirección del contrato.
   * @param userId - ID del usuario.
   * @param tenantId - ID del tenant.
   * @returns Miembro actualizado de Tenant.
   */
  async deployElectionContract(userId: string, tenantId: string): Promise<MemberTenant> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException('El ID de usuario proporcionado no es válido.');
    }
    if (!isValidObjectId(tenantId)) {
      throw new BadRequestException('El ID del tenant proporcionado no es válido.');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.hardhatMicroserviceUrl}/deploy-election-contract`),
      );

      const { contractElection } = response.data;

      if (!contractElection) {
        throw new Error('No se pudo obtener la dirección del contrato de Election');
      }

      const userObjectId = new Types.ObjectId(userId);
      const tenantObjectId = new Types.ObjectId(tenantId);

      const existingMemberTenant = await this.memberTenantModel.findOne({
        user: userObjectId,
        tenant: tenantObjectId,
        role: 'owner',
      });

      if (!existingMemberTenant) {
        throw new Error('No se encontró un documento MemberTenant con los criterios proporcionados');
      }

      const memberTenant = await this.memberTenantModel.findOneAndUpdate(
        { user: userObjectId, tenant: tenantObjectId, role: 'owner' },
        { $set: { electionAddress: contractElection } },
        { new: true, upsert: false },
      );

      if (!memberTenant) {
        throw new Error('No se pudo actualizar el electionAddress en MemberTenant');
      }

      return memberTenant;
    } catch (error) {
      throw new BadRequestException(`Error al desplegar el contrato de Election: ${error.message}`);
    }
  }

  /**
   * Configura los detalles de la elección en el contrato.
   * @param electionAddress - Dirección del contrato de Election.
   * @param electionName - Nombre de la elección.
   * @param electionDescription - Descripción de la elección.
   * @returns Detalles configurados de la elección.
   */
  async setElectionDetails(electionAddress: string, electionName: string, electionDescription: string) {
    const electionContract = new ethers.Contract(electionAddress, electionAbi.abi, this.wallet);

    try {
      const tx = await electionContract.setElectionDetails(electionName, electionDescription);
      await tx.wait();

      return { success: true, electionName, electionDescription };
    } catch (error) {
      throw new BadRequestException(`Error al establecer los detalles de la elección: ${error.message}`);
    }
  }

  /**
   * Registra un voto para un candidato.
   * @param voteCandidateDto - Datos del voto (ID del Tenant y del candidato).
   * @returns Confirmación del voto registrado.
   */
  async vote(memberTenantId: string, enrollmentId: string, candidateId: number) {

    // Buscar el MemberTenant asociado al contrato
    const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    if (!memberTenant || !memberTenant.electionAddress) {
      throw new BadRequestException('Dirección del contrato de Election no configurada.');
    }

    // Obtener el contrato de Election
    const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

    // Generar el voterHash utilizando el enrollmentId, tenantId y secretKey
    const voterHash = this.generateVoterHash(enrollmentId, String(memberTenant.tenant), this.jwtSecretKey);

    try {
      // Llamar al método vote del contrato, pasando el candidateId y el voterHash
      const tx = await electionContract.vote(candidateId, voterHash);
      await tx.wait();

      return { success: true, candidateId, enrollmentId };
    } catch (error) {
      throw new BadRequestException(`Error al votar: ${error.message}`);
    }
  }


  /**
   * Finaliza la elección en el contrato.
   * @param memberTenantId - ID del MemberTenant asociado a la elección.
   * @returns Confirmación de la finalización de la elección.
   */
  async endElection(memberTenantId: string) {
    const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    if (!memberTenant || !memberTenant.electionAddress) {
      throw new Error('Election address no esta en el MemberTenant');
    }

    const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

    try {
      const tx = await electionContract.endElection();
      await tx.wait();

      return { success: true };
    } catch (error) {
      throw new BadRequestException(`Error al finalizar la elección: ${error.message}`);
    }
  }

  /**
 * Verifica si un usuario ha votado.
 * @param memberTenantId - ID del MemberTenant asociado al contrato.
 * @returns Si el usuario ha votado o no.
 */
  async hasUserVoted(memberTenantId: string, enrollmentId: string): Promise<boolean> {
    if (!memberTenantId || !enrollmentId) {
      throw new BadRequestException('El parámetro "memberTenantId" y "enrollmentId" son requeridos.');
    }

    // Buscar el MemberTenant asociado al contrato
    const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    if (!memberTenant || !memberTenant.electionAddress) {
      throw new BadRequestException('Dirección del contrato de Election no configurada.');
    }

    // Obtener el contrato de Election
    const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

    try {
      // Generar el voterHash usando el enrollmentId, tenantId y secretKey
      const voterHash = this.generateVoterHash(enrollmentId, String(memberTenant.tenant), this.jwtSecretKey);

      // Consultar si el votante ya ha votado
      const hasVoted = await electionContract.hasUserVoted(voterHash);

      return hasVoted;
    } catch (error) {
      throw new BadRequestException(`Error al verificar el estado de voto: ${error.message} `);
    }
  }


  /**
   * Obtiene el total de votos emitidos en la elección.
   * @param memberTenantId - ID del MemberTenant asociado al contrato.
   * @returns Total de votos emitidos.
   */
  async getTotalVotes(memberTenantId: string): Promise<number> {
    if (!memberTenantId) {
      throw new BadRequestException('El parámetro "memberTenantId" es requerido.');
    }

    const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    if (!memberTenant || !memberTenant.electionAddress) {
      throw new BadRequestException('Dirección del contrato de Election no configurada.');
    }

    const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

    try {
      const totalVotes = await electionContract.getTotalVotes();
      return Number(totalVotes);
    } catch (error) {
      throw new BadRequestException(`Error al obtener el total de votos: ${error.message} `);
    }
  }

  /**
   * Obtiene el total de votos recibidos por un candidato específico.
   * @param memberTenantId - ID del MemberTenant asociado al contrato.
   * @param candidateId - ID del candidato.
   * @returns Total de votos del candidato.
   */
  async getVotesByCandidate(memberTenantId: string, candidateId: number): Promise<number> {
    if (!memberTenantId || candidateId === undefined) {
      throw new BadRequestException('Los parámetros "memberTenantId" y "candidateId" son requeridos.');
    }

    const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    if (!memberTenant || !memberTenant.electionAddress) {
      throw new BadRequestException('Dirección del contrato de Election no configurada.');
    }

    const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

    try {
      const votes = await electionContract.getVotesByCandidate(candidateId);
      return Number(votes);
    } catch (error) {
      throw new BadRequestException(`Error al obtener los votos del candidato: ${error.message} `);
    }
  }

  private generateVoterHash(enrollmentId: string, tenantId: string, secretKey: string): string {
    enrollmentId = String(enrollmentId);
    tenantId = String(tenantId);
    secretKey = String(secretKey);

    const input = `${enrollmentId} -${tenantId} -${secretKey} `;
    return ethers.keccak256(ethers.toUtf8Bytes(input));
  }


  /**
   * Obtiene el total de votos auditados por un candidato específico.
   * @param memberTenantId - ID del MemberTenant asociado al contrato.
   * @param candidateId - ID del candidato.
   * @returns Total de votos del candidato.
   */
  async getVoteAudit(memberTenantId: string, candidateId: number): Promise<VoteRecord[]> {
    if (!memberTenantId || candidateId === undefined) {
      throw new BadRequestException('Los parámetros "memberTenantId" y "candidateId" son requeridos.');
    }

    const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    if (!memberTenant || !memberTenant.electionAddress) {
      throw new BadRequestException('Dirección del contrato de Election no configurada.');
    }

    const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

    try {
      const voteAuditRecords = await electionContract.getVoteAudit(candidateId);

      return voteAuditRecords.map((record: any) => ({
        voterAddress: record.voterAddress,
        timestamp: record.timestamp.toNumber(),
        candidateId: record.candidateId,
        voteHash: record.voteHash
      }));
    } catch (error) {
      throw new BadRequestException(`Error al obtener el registro de auditoría de votos: ${error.message}`);
    }
  }
}
