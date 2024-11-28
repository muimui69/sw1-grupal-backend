import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { StatisticService } from '../services/statistic.service';
import { BadRequestException } from '@nestjs/common';

@WebSocketGateway()
export class StatisticGateway {
  constructor(private readonly statisticService: StatisticService) { }

  /**
   * Obtiene estadísticas en tiempo real de los votos de los candidatos en una elección.
   * @param memberTenantId - ID del MemberTenant asociado a la elección.
   * @returns Estadísticas de los votos en tiempo real.
   */
  @SubscribeMessage('getRealTimeStatistics')
  async getRealTimeStatistics(@MessageBody() memberTenantId: string) {
    try {
      return await this.statisticService.getRealTimeStatistics(memberTenantId);
    } catch (error) {
      throw new BadRequestException(`Error al obtener las estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtiene el total de votos emitidos en la elección.
   * @param memberTenantId - ID del MemberTenant asociado a la elección.
   * @returns El total de votos.
   */
  @SubscribeMessage('getTotalVotes')
  async getTotalVotes(@MessageBody() memberTenantId: string) {
    try {
      return await this.statisticService.getTotalVotes(memberTenantId);
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
  @SubscribeMessage('getVoteAudit')
  async getVoteAudit(@MessageBody() data: { memberTenantId: string, candidateId: number }) {
    try {
      return await this.statisticService.getVoteAudit(data.memberTenantId, data.candidateId);
    } catch (error) {
      throw new BadRequestException(`Error al obtener los registros de votos: ${error.message}`);
    }
  }

}
