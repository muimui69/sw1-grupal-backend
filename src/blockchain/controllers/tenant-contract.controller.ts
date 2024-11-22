import { Controller, Get, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { TenantContractService } from '../services/tenant-contract.service';

@Controller('blockchain/tenant')
export class TenantContractController {
  constructor(private readonly tenantContractService: TenantContractService) { }

  @Get('election/:memberTenantId/:subdomain')
  async getElectionDetails(
    @Param('memberTenantId') memberTenantId: string,
    @Param('subdomain') subdomain: string
  ) {
    if (!memberTenantId || !subdomain) {
      throw new BadRequestException('memberTenantId y subdomain son requeridos.');
    }
    return await this.tenantContractService.getElectionDetails(
      memberTenantId,
      subdomain
    );
  }
}
