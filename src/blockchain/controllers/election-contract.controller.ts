import { Controller, Get, Post, Param, Body, HttpStatus, Patch, Delete } from '@nestjs/common';
import { ElectionContractService } from '../services/election-contract.service';

@Controller('blockchain/election')
export class ElectionContractController {
    constructor(private readonly electionService: ElectionContractService) { }

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
}
