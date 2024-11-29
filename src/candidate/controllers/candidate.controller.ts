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
    UseGuards,
    Req,
    HttpCode,
} from '@nestjs/common';
import { CreateCandidateDto } from '../dto/create-candidate.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { PatchCandidateDto } from '../dto/patch-candidate.dto';
import { CandidateService } from '../services/candidate.service';
import { TokenTenantGuard } from 'src/tenant/guard/token-tenant.guard';
import { Request } from 'express';

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
    @UseGuards(TokenTenantGuard)
    @UseInterceptors(FileInterceptor('photo'))
    @HttpCode(HttpStatus.CREATED)
    async createCandidate(
        @Req() req: Request,
        @Body() createCandidateDto: CreateCandidateDto,
        @UploadedFile() file: Multer.File,
    ) {

        const statusCode = HttpStatus.CREATED;
        const memberTenantId = req.memberTenantId;

        if (!memberTenantId) {
            throw new BadRequestException('El parámetro "memberTenantId" es requerido.');
        }

        if (file) {
            createCandidateDto.photo = file;
        }

        try {
            const candidate = await this.electionService.createCandidate(memberTenantId, createCandidateDto);
            return {
                statusCode,
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
    @Get()
    @UseGuards(TokenTenantGuard)
    @HttpCode(HttpStatus.OK)
    async getAllCandidates(
        @Req() req: Request,
    ) {

        const statusCode = HttpStatus.OK;
        const memberTenantId = req.memberTenantId;

        if (!memberTenantId) {
            throw new BadRequestException('El parámetro "memberTenantId" es requerido.');
        }

        try {
            const candidates = await this.electionService.getAllCandidates(memberTenantId);
            return {
                statusCode,
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
    @Get(':candidateId')
    @UseGuards(TokenTenantGuard)
    @HttpCode(HttpStatus.OK)
    async getCandidate(
        @Req() req: Request,
        @Param('candidateId') candidateId: number,
    ) {
        const statusCode = HttpStatus.OK;
        const memberTenantId = req.memberTenantId;

        if (!memberTenantId || candidateId === undefined) {
            throw new BadRequestException('Los parámetros "memberTenantId" y "candidateId" son requeridos.');
        }

        try {
            const candidate = await this.electionService.getCandidate(memberTenantId, candidateId);
            return {
                statusCode,
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
    @Patch('patch/:candidateId')
    @UseGuards(TokenTenantGuard)
    @UseInterceptors(FileInterceptor('photo'))
    @HttpCode(HttpStatus.OK)
    async patchCandidate(
        @Req() req: Request,
        @Param('candidateId') candidateId: number,
        @Body() patchCandidateDto: Omit<PatchCandidateDto, 'candidateId'>,
        @UploadedFile() file: Multer.File,
    ) {
        const statusCode = HttpStatus.OK;
        const memberTenantId = req.memberTenantId;

        if (!memberTenantId || candidateId === undefined) {
            throw new BadRequestException('Los parámetros "memberTenantId" y "candidateId" son requeridos.');
        }

        if (file) {
            patchCandidateDto.photo = file;
        }

        try {
            const updatedCandidate = await this.electionService.patchCandidate(memberTenantId, candidateId, patchCandidateDto);
            return {
                statusCode,
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
    @Delete('delete/:candidateId')
    @UseGuards(TokenTenantGuard)
    @HttpCode(HttpStatus.OK)
    async deleteCandidate(
        @Req() req: Request,
        @Param('candidateId') candidateId: number,
    ) {
        const statusCode = HttpStatus.OK;
        const memberTenantId = req.memberTenantId;

        if (!memberTenantId || candidateId === undefined) {
            throw new BadRequestException('Los parámetros "memberTenantId" y "candidateId" son requeridos.');
        }

        try {
            await this.electionService.deleteCandidate(memberTenantId, candidateId);
            return {
                statusCode,
                message: 'Candidato eliminado',
            };
        } catch (error) {
            throw new BadRequestException(`Error al eliminar el candidato: ${error.message}`);
        }
    }
}
