import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ElectionContractService } from '../services';

@Controller('blockchain/election')
export class ElectionContractController {
    constructor(private readonly electionService: ElectionContractService) { }

    // @Get('candidates')
    // async getCandidates() {
    //     return this.electionService.getCandidates();
    // }

    // @Get('numOfCandidates')
    // async getNumOfCandidates() {
    //     return this.electionService.getNumOfCandidates();
    // }

    // @Post('create-candidate')
    // async addCandidate(
    //     @Body('name') name: string,
    //     @Body('description') description: string,
    //     @Body('imgHash') imgHash: string,
    //     @Body('email') email: string,
    // ) {
    //     return await this.electionService.addCandidate(name, description, imgHash, email);
    // }

    // @Post('vote')
    // async voteForCandidate(@Body('candidateId') candidateId: number) {
    //     return this.electionService.voteForCandidate(candidateId);
    // }

    // @Get('totalVotes')
    // async getTotalVotes() {
    //     return this.electionService.getTotalVotes();
    // }

    // @Get('result')
    // async getElectionResult() {
    //     return this.electionService.getElectionResult();
    // }

    // @Post('end')
    // async endElection() {
    //     return this.electionService.endElection();
    // }

    // @Get('status')
    // async getElectionStatus() {
    //     return this.electionService.getElectionStatus();
    // }

    // @Post('setContractAddress')
    // async setElectionContract(@Body('address') address: string) {
    //     this.electionService.setElectionContract(address);
    //     return { message: 'Election contract address set successfully' };
    // }
}
