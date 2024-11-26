import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { ethers } from 'ethers';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { MemberTenant } from 'src/tenant/entity';
import electionAbi from '../abis/contracts/Election.json';
import { VoteCandidateDto } from '../dto/vote-candidate.dto';

@Injectable()
export class ElectionContractService {
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
  async vote(voteCandidateDto: VoteCandidateDto) {
    const { memberTenantId, candidateId } = voteCandidateDto;

    const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    if (!memberTenant || !memberTenant.electionAddress) {
      throw new Error('Election address no esta en el MemberTenant');
    }

    const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

    try {
      const tx = await electionContract.vote(candidateId);
      await tx.wait();

      return { success: true, candidateId };
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
}
