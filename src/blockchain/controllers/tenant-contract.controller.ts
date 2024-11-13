import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TenantContractService } from '../services/tenant-contract.service';

@Controller('blockchain/tenant')
export class TenantContractController {
  constructor(private readonly tenantContractService: TenantContractService) { }

  @Post('deploy')
  async deployTenant(
    @Body('user-id') userId: string,
    @Body('tenant-id') tenantId: string
  ) {
    return await this.tenantContractService.deployTenant(userId, tenantId);
  }

  @Post('createElection')
  async createElection(
    @Body('memberTenantId') memberTenantId: string,
    @Body('subdomain') subdomain: string,
    @Body('electionAddress') electionAddress: string
  ) {
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
    return await this.tenantContractService.getElectionDetails(
      memberTenantId,
      subdomain
    );
  }
}
