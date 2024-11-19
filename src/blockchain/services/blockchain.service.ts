import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BlockchainService {
    private readonly hardhatMicroserviceUrl: string;

    constructor(
        private configService: ConfigService,
        private httpService: HttpService
    ) {
        this.hardhatMicroserviceUrl = this.configService.get<string>('hardhat_microservice_url') || 'http://localhost:6969';
    }

    async deployTenantContract(): Promise<string> {
        try {
            const response: AxiosResponse<any> = await firstValueFrom(
                this.httpService.post(`${this.hardhatMicroserviceUrl}/deploy-tenant-contract`)
            );

            const { contractTenant } = response.data;
            if (!contractTenant) {
                throw new Error('No se pudo obtener la dirección del contrato de Tenant');
            }

            return contractTenant;
        } catch (error) {
            throw new BadRequestException(`Error al desplegar el contrato de Tenant: ${error.message}`);
        }
    }

    async deployElectionContract(): Promise<string> {
        try {
            const response: AxiosResponse<any> = await firstValueFrom(
                this.httpService.post(`${this.hardhatMicroserviceUrl}/deploy-election-contract`)
            );

            const { contractElection } = response.data;
            if (!contractElection) {
                throw new Error('No se pudo obtener la dirección del contrato de Election');
            }

            return contractElection;
        } catch (error) {
            throw new BadRequestException(`Error al desplegar el contrato de Election: ${error.message}`);
        }
    }
}
