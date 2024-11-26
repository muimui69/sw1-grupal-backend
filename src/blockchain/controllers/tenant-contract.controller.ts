import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { TenantContractService } from '../services/tenant-contract.service';

@Controller('blockchain/tenant')
export class TenantContractController {
  constructor(private readonly tenantContractService: TenantContractService) { }

  /**
   * Obtiene los detalles de una elección desde el contrato Tenant.
   * @param memberTenantId - ID del MemberTenant asociado a la elección.
   * @param subdomain - Subdominio único de la elección.
   * @returns Detalles de la elección, incluyendo dirección y descripción.
   */
  @Get('election/:memberTenantId/:subdomain')
  async getElectionDetails(
    @Param('memberTenantId') memberTenantId: string,
    @Param('subdomain') subdomain: string,
  ) {
    // Validación de parámetros requeridos
    if (!memberTenantId) {
      throw new BadRequestException('El parámetro "memberTenantId" es requerido.');
    }

    if (!subdomain) {
      throw new BadRequestException('El parámetro "subdomain" es requerido.');
    }

    try {
      // Llama al servicio para obtener los detalles de la elección
      return await this.tenantContractService.getElectionDetails(
        memberTenantId,
        subdomain,
      );
    } catch (error) {
      // Manejo de excepciones y retorno de un error legible
      throw new BadRequestException(`Error al obtener los detalles de la elección: ${error.message}`);
    }
  }
}
