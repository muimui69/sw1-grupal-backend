import { Controller, Get, Post, Param, Body, HttpStatus, Patch, Delete, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CandidateService } from '../services/candidate.service';
import { CreateCandidateDto } from '../dto/create-candidate.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { PatchCandidateDto } from '../dto/patch-candidate.dto';

@Controller('blockchain/candidate')
export class CandidateController {
    constructor(private readonly electionService: CandidateService) { }

    @Post('create')
    @UseInterceptors(FileInterceptor('photo'))
    async createCandidate(
        @Body('memberTenantId') memberTenantId: string,
        @Body() createCandidateDto: Omit<CreateCandidateDto, 'memberTenantId'>,
        @UploadedFile() file: Multer.File,
    ) {
        if (file) {
            createCandidateDto.photo = file;
        }

        const statusCode = HttpStatus.CREATED;
        const candidate = await this.electionService.createCandidate(memberTenantId, createCandidateDto);
        return {
            statusCode,
            message: "Candidato agregado",
            data: {
                candidate
            }
        }
    }

    @Get(':memberTenantId')
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

    @Get(':memberTenantId/:candidateId')
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

    @Patch('update')
    @UseInterceptors(FileInterceptor('photo'))
    async patchCandidate(
        @Body('memberTenantId') memberTenantId: string,
        @Body('candidateId') candidateId: string,
        @Body() patchCandidateDto: Omit<PatchCandidateDto, 'memberTenantId' | 'candidateId'>,
        @UploadedFile() file: Multer.File,
    ) {

        if (file) {
            patchCandidateDto.photo = file;
        }

        const statusCode = HttpStatus.OK;
        const updatedCandidate = await this.electionService.patchCandidate(memberTenantId, candidateId, patchCandidateDto);
        return {
            statusCode,
            message: "Candidato actualizado",
            data: {
                candidate: updatedCandidate
            }
        };
    }

    @Delete('delete')
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

}
