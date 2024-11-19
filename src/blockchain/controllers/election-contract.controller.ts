import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ElectionContractService } from '../services/election-contract.service';

@Controller('blockchain/election')
export class ElectionContractController {
    constructor(private readonly electionService: ElectionContractService) { }

    //no usar
    @Post('deploy')
    async deployElectionContract(
        @Body('userId') userId: string,
        @Body('tenantId') tenantId: string
    ) {
        return await this.electionService.deployElectionContract(userId, tenantId);
    }

    @Post('set-details')
    async setElectionDetails(
        @Body('electionAddress') electionAddress: string,
        @Body('electionName') electionName: string,
        @Body('electionDescription') electionDescription: string
    ) {
        return await this.electionService.setElectionDetails(electionAddress, electionName, electionDescription);
    }

    @Post('add-candidate')
    async addCandidate(
        @Body('memberTenantId') memberTenantId: string,
        @Body('name') name: string,
        @Body('description') description: string,
        @Body('imgHash') imgHash: string,
        @Body('email') email: string,
        @Body('partyId') partyId: string
    ) {
        return await this.electionService.addCandidate(memberTenantId, name, description, imgHash, email, partyId);
    }

    @Post('vote')
    async vote(
        @Body('memberTenantId') memberTenantId: string,
        @Body('candidateId') candidateId: number
    ) {
        return await this.electionService.vote(memberTenantId, candidateId);
    }

    @Post('end')
    async endElection(@Body('memberTenantId') memberTenantId: string) {
        return await this.electionService.endElection(memberTenantId);
    }

    @Get('candidates/:memberTenantId')
    async getAllCandidates(@Param('memberTenantId') memberTenantId: string) {
        return await this.electionService.getAllCandidates(memberTenantId);
    }
}
