import { Controller, Get, Param, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { BallotService } from '../service/ballot.service';
import { TokenAuthGuard } from 'src/auth/guard';
import { TenantIdGuard } from 'src/tenant/guard';
import { Request } from 'express';

/**
 * Controlador para manejar las operaciones relacionadas con las boletas electorales.
 */
@Controller('ballot')
export class BallotController {
  constructor(private readonly ballotService: BallotService) { }

  /**
   * Genera una boleta electoral basada en el `memberTenantId` proporcionado.
   *
   * @param req Request con el ID del usuario y tenant en los parámetros.
   * @param memberTenantId ID del MemberTenant relacionado con la elección.
   * @returns Boleta electoral generada exitosamente.
   */
  @Get('generate/:memberTenantId')
  @UseGuards(TokenAuthGuard, TenantIdGuard)
  async generateBallot(
    @Req() req: Request,
    @Param('memberTenantId') memberTenantId: string
  ) {
    const statusCode = HttpStatus.OK;
    const userId = req.userId;
    const tenantId = req.tenantId;

    const ballot = await this.ballotService.generateBallot(memberTenantId, userId, tenantId);

    return {
      statusCode,
      message: 'Boleta electoral generada exitosamente',
      data: {
        ballot,
      }
    };
  }
}
