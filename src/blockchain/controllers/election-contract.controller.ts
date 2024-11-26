import { Controller, Post, Body, BadRequestException, HttpStatus } from '@nestjs/common';
import { ElectionContractService } from '../services/election-contract.service';
import { VoteCandidateDto } from '../dto/vote-candidate.dto';

@Controller('blockchain/election')
export class ElectionContractController {
    constructor(private readonly electionService: ElectionContractService) { }

    /**
     * Registra un voto para un candidato.
     * @param voteCandidateDto - Datos del voto, incluyendo ID del candidato y del tenant.
     * @returns Confirmación del voto registrado.
     */
    @Post('vote')
    async vote(@Body() voteCandidateDto: VoteCandidateDto) {
        try {
            // Llama al servicio para registrar el voto
            return await this.electionService.vote(voteCandidateDto);
        } catch (error) {
            // Manejo de errores y retorno de una excepción legible
            throw new BadRequestException(`Error al registrar el voto: ${error.message}`);
        }
    }

    /**
     * Finaliza la elección en el contrato.
     * @param memberTenantId - ID del MemberTenant asociado a la elección.
     * @returns Confirmación de la finalización de la elección.
     */
    @Post('end')
    async endElection(@Body('memberTenantId') memberTenantId: string) {
        if (!memberTenantId) {
            throw new BadRequestException('El parámetro "memberTenantId" es requerido.');
        }

        try {
            // Llama al servicio para finalizar la elección
            return await this.electionService.endElection(memberTenantId);
        } catch (error) {
            // Manejo de errores y retorno de una excepción legible
            throw new BadRequestException(`Error al finalizar la elección: ${error.message}`);
        }
    }
}
