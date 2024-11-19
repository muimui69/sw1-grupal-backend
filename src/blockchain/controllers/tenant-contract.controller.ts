import { Controller, Get, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { TenantContractService } from '../services/tenant-contract.service';

@Controller('blockchain/tenant')
export class TenantContractController {
  constructor(private readonly tenantContractService: TenantContractService) { }

  //no usar
  @Post('deploy')
  async deployTenant(
    @Body('userId') userId: string,
    @Body('tenantId') tenantId: string
  ) {
    if (!userId || !tenantId) {
      throw new BadRequestException('userId y tenantId son requeridos.');
    }
    return await this.tenantContractService.deployTenantContract(userId, tenantId);
  }

  @Post('create-election')
  async createElection(
    @Body('memberTenantId') memberTenantId: string,
    @Body('subdomain') subdomain: string,
    @Body('electionAddress') electionAddress: string
  ) {
    if (!memberTenantId || !subdomain || !electionAddress) {
      throw new BadRequestException('Todos los parámetros son requeridos.');
    }
    return await this.tenantContractService.createElection(
      memberTenantId,
      subdomain,
      electionAddress
    );
  }

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
