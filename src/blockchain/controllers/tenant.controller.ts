import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { TenantService } from '../services';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) { }

  @Post('setContractAddress')
  async setTenantContract(@Body('address') address: string) {
    this.tenantService.setTenantContract(address);
    return { message: 'Tenant contract address set successfully' };
  }

  @Get('election/:subdomain')
  async getElectionDetails(@Param('subdomain') subdomain: string) {
    return this.tenantService.getElectionDetails(subdomain);
  }

  @Post('createElection')
  async createElection(
    @Body('subdomain') subdomain: string,
    @Body('electionAddress') electionAddress: string,
    @Body('electionName') electionName: string,
    @Body('electionDescription') electionDescription: string,
  ) {
    return this.tenantService.createElection(subdomain, electionAddress, electionName, electionDescription);
  }

  @Post('updateElection')
  async updateElection(
    @Body('subdomain') subdomain: string,
    @Body('electionAddress') electionAddress: string,
    @Body('electionName') electionName: string,
    @Body('electionDescription') electionDescription: string,
  ) {
    return this.tenantService.updateElection(subdomain, electionAddress, electionName, electionDescription);
  }

  @Delete('election/:subdomain')
  async deleteElection(@Param('subdomain') subdomain: string) {
    return this.tenantService.deleteElection(subdomain);
  }

  @Get('listElections')
  async listElections() {
    return this.tenantService.listElections();
  }

  @Get('electionExists/:subdomain')
  async electionExists(@Param('subdomain') subdomain: string) {
    return this.tenantService.electionExists(subdomain);
  }
}
