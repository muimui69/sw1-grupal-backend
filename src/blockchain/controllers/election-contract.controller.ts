import { Controller, Get, Post, Param, Body, HttpStatus, Patch, Delete } from '@nestjs/common';
import { ElectionContractService } from '../services/election-contract.service';

@Controller('blockchain/election')
export class ElectionContractController {
    constructor(private readonly electionService: ElectionContractService) { }

    @Post('candidate/create')
    async addCandidate(
        @Body('memberTenantId') memberTenantId: string,
        @Body('name') name: string,
        @Body('description') description: string,
        @Body('imgHash') imgHash: string,
        @Body('email') email: string,
        @Body('partyId') partyId: string
    ) {
        const statusCode = HttpStatus.CREATED;
        const candidate = await this.electionService.addCandidate(memberTenantId, name, description, imgHash, email, partyId);
        return {
            statusCode,
            message: "Candidato agregado",
            data: {
                candidate
            }
        }
    }

    @Get('candidate/:memberTenantId')
    async getAllCandidates(@Param('memberTenantId') memberTenantId: string) {
        const candidates = await this.electionService.getAllCandidates(memberTenantId);
        const statusCode = HttpStatus.OK;
        return {
            statusCode,
            message: "Lista de candidatos",
            data: {
                candidates
            }
        }
    }

    @Get('candidate/:memberTenantId/:candidateId')
    async getCandidate(
        @Param('memberTenantId') memberTenantId: string,
        @Param('candidateId') candidateId: number
    ) {
        const candidate = await this.electionService.getCandidate(memberTenantId, candidateId);
        const statusCode = HttpStatus.OK;
        return {
            statusCode,
            message: "Candidato obtenido",
            data: {
                candidate
            }
        };
    }

    @Patch('candidate/update')
    async updateCandidate(
        @Body('memberTenantId') memberTenantId: string,
        @Body('candidateId') candidateId: number,
        @Body('name') name: string,
        @Body('description') description: string,
        @Body('imgHash') imgHash: string,
        @Body('email') email: string,
        @Body('partyId') partyId: string
    ) {
        const statusCode = HttpStatus.OK;
        const updatedCandidate = await this.electionService.patchCandidate(
            memberTenantId,
            candidateId,
            name,
            description,
            imgHash,
            email,
            partyId
        );
        return {
            statusCode,
            message: "Candidato actualizado",
            data: {
                candidate: updatedCandidate
            }
        };
    }

    @Delete('candidate/delete')
    async deleteCandidate(
        @Body('memberTenantId') memberTenantId: string,
        @Body('candidateId') candidateId: number
    ) {
        const statusCode = HttpStatus.OK;
        await this.electionService.deleteCandidate(memberTenantId, candidateId);
        return {
            statusCode,
            message: "Candidato eliminado"
        };
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
}
