import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ethers } from 'ethers';
import { Model } from 'mongoose';
import { MemberTenant } from 'src/tenant/entity';
import electionAbi from '../../blockchain/abis/contracts/Election.json';


@Injectable()
export class StatisticService {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly wallet: ethers.Wallet;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(MemberTenant.name) private readonly memberTenantModel: Model<MemberTenant>,
  ) {
    const providerUrl = this.configService.get<string>('blockchain_url');
    const privateKey = this.configService.get<string>('wallet_private_key');
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * Obtiene estadísticas en tiempo real de todos los candidatos.
   * @param memberTenantId - ID del MemberTenant asociado a la elección.
   * @returns Lista de estadísticas de los votos de todos los candidatos.
   */
  async getRealTimeStatistics(memberTenantId: string): Promise<any> {
    const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    if (!memberTenant || !memberTenant.electionAddress) {
      throw new BadRequestException('Election address not set in MemberTenant');
    }

    const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

    try {
      const candidatesData = await electionContract.getAllCandidates();

      const statistics = await Promise.all(
        candidatesData.map(async (candidateData: any) => {
          const candidateId = candidateData.id;
          const voteCount = await electionContract.getVotesByCandidate(candidateId);

          return {
            candidateId,
            candidateName: candidateData.name,
            voteCount,
          };
        }),
      );

      return statistics; // Retorna las estadísticas de todos los candidatos
    } catch (error) {
      throw new BadRequestException(`Error al obtener las estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtiene los votos totales en la elección.
   * @param memberTenantId - ID del MemberTenant asociado a la elección.
   * @returns El total de votos emitidos en la elección.
   */
  async getTotalVotes(memberTenantId: string): Promise<number> {
    const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    if (!memberTenant || !memberTenant.electionAddress) {
      throw new BadRequestException('Election address not set in MemberTenant');
    }

    const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

    try {
      const totalVotes = await electionContract.getTotalVotes();
      return totalVotes;
    } catch (error) {
      throw new BadRequestException(`Error al obtener los votos totales: ${error.message}`);
    }
  }

  /**
   * Obtiene los registros de votos de un candidato específico.
   * @param memberTenantId - ID del MemberTenant asociado a la elección.
   * @param candidateId - ID del candidato cuyo registro de votos se desea consultar.
   * @returns Los registros de votos para un candidato específico.
   */
  async getVoteAudit(memberTenantId: string, candidateId: number): Promise<any[]> {
    const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    if (!memberTenant || !memberTenant.electionAddress) {
      throw new BadRequestException('Election address not set in MemberTenant');
    }

    const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

    try {
      const voteAudit = await electionContract.getVoteAudit(candidateId);
      return voteAudit;
    } catch (error) {
      throw new BadRequestException(`Error al obtener los registros de votos: ${error.message}`);
    }
  }
}
