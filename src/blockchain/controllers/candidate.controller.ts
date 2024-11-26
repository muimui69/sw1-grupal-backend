import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    HttpStatus,
    Patch,
    Delete,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { CandidateService } from '../services/candidate.service';
import { CreateCandidateDto } from '../dto/create-candidate.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { PatchCandidateDto } from '../dto/patch-candidate.dto';

@Controller('blockchain/candidate')
export class CandidateController {
    constructor(private readonly electionService: CandidateService) { }

    /**
     * Crea un nuevo candidato para la elección.
     * @param memberTenantId - ID del tenant asociado al candidato.
     * @param createCandidateDto - Datos del candidato.
     * @param file - Archivo de foto del candidato.
     * @returns Candidato creado con éxito.
     */
    @Post('create')
    @UseInterceptors(FileInterceptor('photo'))
    async createCandidate(
        @Body('memberTenantId') memberTenantId: string,
        @Body() createCandidateDto: Omit<CreateCandidateDto, 'memberTenantId'>,
        @UploadedFile() file: Multer.File,
    ) {
        if (!memberTenantId) {
            throw new BadRequestException('El parámetro "memberTenantId" es requerido.');
        }

        if (file) {
            createCandidateDto.photo = file;
        }

        try {
            const candidate = await this.electionService.createCandidate(memberTenantId, createCandidateDto);
            return {
                statusCode: HttpStatus.CREATED,
                message: 'Candidato agregado',
                data: { candidate },
            };
        } catch (error) {
            throw new BadRequestException(`Error al crear el candidato: ${error.message}`);
        }
    }

    /**
     * Obtiene todos los candidatos de una elección.
     * @param memberTenantId - ID del tenant asociado a los candidatos.
     * @returns Lista de candidatos.
     */
    @Get(':memberTenantId')
    async getAllCandidates(@Param('memberTenantId') memberTenantId: string) {
        if (!memberTenantId) {
            throw new BadRequestException('El parámetro "memberTenantId" es requerido.');
        }

        try {
            const candidates = await this.electionService.getAllCandidates(memberTenantId);
            return {
                statusCode: HttpStatus.OK,
                message: 'Lista de candidatos',
                data: { candidates },
            };
        } catch (error) {
            throw new BadRequestException(`Error al obtener los candidatos: ${error.message}`);
        }
    }

    /**
     * Obtiene un candidato específico por su ID.
     * @param memberTenantId - ID del tenant asociado al candidato.
     * @param candidateId - ID del candidato.
     * @returns Detalles del candidato.
     */
    @Get(':memberTenantId/:candidateId')
    async getCandidate(
        @Param('memberTenantId') memberTenantId: string,
        @Param('candidateId') candidateId: number,
    ) {
        if (!memberTenantId || candidateId === undefined) {
            throw new BadRequestException('Los parámetros "memberTenantId" y "candidateId" son requeridos.');
        }

        try {
            const candidate = await this.electionService.getCandidate(memberTenantId, candidateId);
            return {
                statusCode: HttpStatus.OK,
                message: 'Candidato obtenido',
                data: { candidate },
            };
        } catch (error) {
            throw new BadRequestException(`Error al obtener el candidato: ${error.message}`);
        }
    }

    /**
     * Actualiza un candidato existente.
     * @param memberTenantId - ID del tenant asociado al candidato.
     * @param candidateId - ID del candidato.
     * @param patchCandidateDto - Datos actualizados del candidato.
     * @param file - Archivo de foto actualizado del candidato.
     * @returns Candidato actualizado.
     */
    @Patch('update')
    @UseInterceptors(FileInterceptor('photo'))
    async patchCandidate(
        @Body('memberTenantId') memberTenantId: string,
        @Body('candidateId') candidateId: string,
        @Body() patchCandidateDto: Omit<PatchCandidateDto, 'memberTenantId' | 'candidateId'>,
        @UploadedFile() file: Multer.File,
    ) {
        if (!memberTenantId || !candidateId) {
            throw new BadRequestException('Los parámetros "memberTenantId" y "candidateId" son requeridos.');
        }

        if (file) {
            patchCandidateDto.photo = file;
        }

        try {
            const updatedCandidate = await this.electionService.patchCandidate(memberTenantId, candidateId, patchCandidateDto);
            return {
                statusCode: HttpStatus.OK,
                message: 'Candidato actualizado',
                data: { candidate: updatedCandidate },
            };
        } catch (error) {
            throw new BadRequestException(`Error al actualizar el candidato: ${error.message}`);
        }
    }

    /**
     * Elimina un candidato de la elección.
     * @param memberTenantId - ID del tenant asociado al candidato.
     * @param candidateId - ID del candidato a eliminar.
     * @returns Confirmación de eliminación.
     */
    @Delete('delete')
    async deleteCandidate(
        @Body('memberTenantId') memberTenantId: string,
        @Body('candidateId') candidateId: number,
    ) {
        if (!memberTenantId || candidateId === undefined) {
            throw new BadRequestException('Los parámetros "memberTenantId" y "candidateId" son requeridos.');
        }

        try {
            await this.electionService.deleteCandidate(memberTenantId, candidateId);
            return {
                statusCode: HttpStatus.OK,
                message: 'Candidato eliminado',
            };
        } catch (error) {
            throw new BadRequestException(`Error al eliminar el candidato: ${error.message}`);
        }
    }
}
