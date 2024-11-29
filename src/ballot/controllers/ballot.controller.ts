import { Controller, Get, Param, HttpStatus, UseGuards, Req, HttpCode } from '@nestjs/common';
import { BallotService } from '../service/ballot.service';
import { TokenAuthGuard } from 'src/auth/guard';
import { Request } from 'express';
import { TokenTenantGuard } from 'src/tenant/guard/token-tenant.guard';

@Controller('ballot')
export class BallotController {
  constructor(private readonly ballotService: BallotService) { }

  /**
   * Genera una boleta electoral basada en el `memberTenantId` proporcionado.
   * @param req Request con el ID del usuario , ID tenant y el ID member tenant.
   * @returns Boleta electoral generada exitosamente.
   */
  @Get('generate')
  @UseGuards(TokenAuthGuard, TokenTenantGuard)
  @HttpCode(HttpStatus.OK)
  async generateBallot(
    @Req() req: Request,
  ) {
    const userId = req.userId;
    const tenantId = req.tenantId;
    const memberTenantId = req.memberTenantId;

    const ballot = await this.ballotService.generateBallot(memberTenantId, userId, tenantId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Boleta electoral generada exitosamente',
      data: {
        ballot,
      }
    };
  }
}
