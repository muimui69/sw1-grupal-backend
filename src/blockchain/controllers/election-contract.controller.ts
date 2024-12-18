import {
    Controller,
    Post,
    Body,
    BadRequestException,
    HttpStatus,
    Get,
    Param,
    UseGuards,
    Req,
    HttpCode,
} from '@nestjs/common';
import { ElectionContractService } from '../services';
import { TokenEnrollmentGuard } from 'src/enrollment/guards/token-enrollment.guard';
import { Request } from 'express';
import { TokenTenantGuard } from 'src/tenant/guard/token-tenant.guard';

@Controller('blockchain/election')
export class ElectionContractController {
    constructor(private readonly electionService: ElectionContractService) { }

    /**
     * Registra un voto para un candidato.
     * @param voteCandidateDto - Datos del voto, incluyendo ID del candidato y del tenant.
     * @returns Confirmación del voto registrado.
     */
    @Post('vote')
    @UseGuards(TokenEnrollmentGuard)
    @HttpCode(HttpStatus.CREATED)
    async vote(
        @Req() req: Request,
        @Body('candidateId') candidateId: number
    ) {
        try {
            const enrollmentId = req.enrollmentId;
            const memberTenantId = req.memberTenantId;

            if (!memberTenantId || candidateId === undefined) {
                throw new BadRequestException('El parámetro "memberTenantId" es requerido.');
            }

            const voteResult = await this.electionService.vote(memberTenantId, enrollmentId, candidateId);
            return {
                statusCode: HttpStatus.CREATED,
                message: 'Voto registrado con éxito.',
                data: voteResult,
            };
        } catch (error) {
            throw new BadRequestException(`Error al registrar el voto: ${error.message}`);
        }
    }

    /**
     * Finaliza la elección en el contrato.
     * @param memberTenantId - ID del MemberTenant asociado a la elección.
     * @returns Confirmación de la finalización de la elección.
     */
    @Post('end')
    @HttpCode(HttpStatus.OK)
    async endElection(@Body('memberTenantId') memberTenantId: string) {
        if (!memberTenantId) {
            throw new BadRequestException('El parámetro "memberTenantId" es requerido.');
        }

        try {
            const result = await this.electionService.endElection(memberTenantId);
            return {
                statusCode: HttpStatus.OK,
                message: 'Elección finalizada con éxito.',
                data: result,
            };
        } catch (error) {
            throw new BadRequestException(`Error al finalizar la elección: ${error.message}`);
        }
    }

    /**
     * Verifica si un usuario ya ha votado.
     * @param memberTenantId - ID del MemberTenant asociado a la elección.
     * @param userAddress - Dirección del usuario en la blockchain.
     * @returns Estado de voto del usuario.
     */
    @Get('has-voted')
    @UseGuards(TokenEnrollmentGuard)
    @HttpCode(HttpStatus.OK)
    async hasUserVoted(
        @Req() req: Request,
    ) {
        const enrollmentId = req.enrollmentId;
        const memberTenantId = req.memberTenantId;

        if (!memberTenantId) {
            throw new BadRequestException('El parámetro "memberTenantId" es requerido.');
        }

        try {
            const hasVoted = await this.electionService.hasUserVoted(memberTenantId, enrollmentId);
            return {
                statusCode: HttpStatus.OK,
                message: hasVoted ? 'Este usuario ya ha votado.' : 'Este usuario aún no ha votado.',
                data: { hasVoted },
            };
        } catch (error) {
            throw new BadRequestException(`Error al verificar el estado de voto: ${error.message}`);
        }
    }


    /**
     * Obtiene el total de votos emitidos en la elección.
     * @param memberTenantId - ID del MemberTenant asociado a la elección.
     * @returns Total de votos emitidos.
     */
    @Get('total-votes')
    @UseGuards(TokenTenantGuard)
    @HttpCode(HttpStatus.OK)
    async getTotalVotes(
        @Req() req: Request,
    ) {
        const memberTenantId = req.memberTenantId;

        if (!memberTenantId) {
            throw new BadRequestException('El parámetro "memberTenantId" es requerido.');
        }

        try {
            const totalVotes = await this.electionService.getTotalVotes(memberTenantId);
            return {
                statusCode: HttpStatus.OK,
                message: 'Total de votos obtenidos con éxito.',
                data: { totalVotes },
            };
        } catch (error) {
            throw new BadRequestException(`Error al obtener el total de votos: ${error.message}`);
        }
    }

    /**
     * Obtiene el total de votos de un candidato específico.
     * @param memberTenantId - ID del MemberTenant asociado a la elección.
     * @param candidateId - ID del candidato.
     * @returns Total de votos recibidos por el candidato.
     */
    @Get('votes-by-candidate/:candidateId')
    @UseGuards(TokenTenantGuard)
    @HttpCode(HttpStatus.OK)
    async getVotesByCandidate(
        @Req() req: Request,
        @Param('candidateId') candidateId: number
    ) {
        const memberTenantId = req.memberTenantId;

        if (!memberTenantId || candidateId === undefined) {
            throw new BadRequestException('Los parámetros "memberTenantId" y "candidateId" son requeridos.');
        }

        try {
            const votes = await this.electionService.getVotesByCandidate(memberTenantId, candidateId);
            return {
                statusCode: HttpStatus.OK,
                message: `Votos obtenidos para el candidato ${candidateId}.`,
                data: { candidateId, votes },
            };
        } catch (error) {
            throw new BadRequestException(`Error al obtener los votos del candidato: ${error.message}`);
        }
    }

    @Get('vote-audit/:candidateId')
    @UseGuards(TokenTenantGuard)
    @HttpCode(HttpStatus.OK)
    async getVoteAudit(
        @Req() req: Request,
        @Param('candidateId') candidateId: number
    ) {
        const memberTenantId = req.memberTenantId;

        if (!memberTenantId || candidateId === undefined) {
            throw new BadRequestException('Los parámetros "memberTenantId" y "candidateId" son requeridos.');
        }

        try {
            const votes = await this.electionService.getVoteAudit(memberTenantId, candidateId);

            return {
                statusCode: HttpStatus.OK,
                message: `Votos auditados para el candidato ${candidateId}.`,
                data: { candidateId, votes },
            };
        } catch (error) {
            throw new BadRequestException(`Error al obtener los votos del candidato: ${error.message}`);
        }
    }
}
