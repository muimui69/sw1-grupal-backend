import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BlockchainService {
    private readonly hardhatMicroserviceUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        // Obtener la URL del microservicio Hardhat desde las variables de configuración
        this.hardhatMicroserviceUrl =
            this.configService.get<string>('hardhat_microservice_url');
    }

    /**
     * Despliega un contrato de Tenant a través del microservicio Hardhat.
     * @returns La dirección del contrato de Tenant desplegado.
     * @throws BadRequestException si ocurre un error durante el despliegue.
     */
    public async deployTenantContract(): Promise<string> {
        try {
            // Enviar una solicitud POST al microservicio para desplegar el contrato de Tenant
            const response: AxiosResponse<any> = await firstValueFrom(
                this.httpService.post(`${this.hardhatMicroserviceUrl}/deploy-tenant-contract`),
            );

            const { contractTenant } = response.data;

            // Validar si se obtuvo una dirección válida
            if (!contractTenant) {
                throw new Error('No se pudo obtener la dirección del contrato de Tenant');
            }

            return contractTenant;
        } catch (error) {
            // Manejo de errores con descripción clara en español
            throw new BadRequestException(`Error al desplegar el contrato de Tenant: ${error.message}`);
        }
    }

    /**
     * Despliega un contrato de Election a través del microservicio Hardhat.
     * @returns La dirección del contrato de Election desplegado.
     * @throws BadRequestException si ocurre un error durante el despliegue.
     */
    public async deployElectionContract(): Promise<string> {
        try {
            // Enviar una solicitud POST al microservicio para desplegar el contrato de Election
            const response: AxiosResponse<any> = await firstValueFrom(
                this.httpService.post(`${this.hardhatMicroserviceUrl}/deploy-election-contract`),
            );

            const { contractElection } = response.data;

            // Validar si se obtuvo una dirección válida
            if (!contractElection) {
                throw new Error('No se pudo obtener la dirección del contrato de Election');
            }

            return contractElection;
        } catch (error) {
            // Manejo de errores con descripción clara en español
            throw new BadRequestException(`Error al desplegar el contrato de Election: ${error.message}`);
        }
    }
}
