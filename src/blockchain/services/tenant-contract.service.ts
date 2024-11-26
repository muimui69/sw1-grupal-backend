import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { ethers } from 'ethers';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { MemberTenant } from 'src/tenant/entity';
import tenantAbi from '../abis/contracts/Tenant.json';

@Injectable()
export class TenantContractService {
    private readonly hardhatMicroserviceUrl: string;
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        @InjectModel(MemberTenant.name) private readonly memberTenantModel: Model<MemberTenant>
    ) {
        // Configuración de la URL del microservicio y la conexión a la blockchain
        this.hardhatMicroserviceUrl = this.configService.get<string>('hardhat_microservice_url');
        const providerUrl = this.configService.get<string>('blockchain_url');
        const privateKey = this.configService.get<string>('wallet_private_key');
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
    }

    /**
     * Despliega el contrato de Tenant y actualiza el MemberTenant con la dirección del contrato
     * @param userId - ID del usuario
     * @param tenantId - ID del tenant
     * @returns Miembro actualizado de Tenant
     */
    async deployTenantContract(userId: string, tenantId: string): Promise<MemberTenant> {
        if (!isValidObjectId(userId)) {
            throw new BadRequestException("El ID de usuario proporcionado no es válido.");
        }
        if (!isValidObjectId(tenantId)) {
            throw new BadRequestException("El ID del tenant proporcionado no es válido.");
        }

        try {
            // Llamada a la API del microservicio para desplegar el contrato de Tenant
            const response = await firstValueFrom(
                this.httpService.post(`${this.hardhatMicroserviceUrl}/deploy-tenant-contract`)
            );

            const { contractTenant } = response.data;
            console.log(contractTenant);

            if (!contractTenant) {
                throw new Error('No se pudo obtener la dirección del contrato de Tenant');
            }

            const userObjectId = new Types.ObjectId(userId);
            const tenantObjectId = new Types.ObjectId(tenantId);

            const existingMemberTenant = await this.memberTenantModel.findOne({
                user: userObjectId,
                tenant: tenantObjectId,
                role: 'owner',
            });

            if (!existingMemberTenant) {
                throw new Error('No se encontró un documento MemberTenant con los criterios proporcionados');
            }

            // Actualiza el MemberTenant con la dirección del contrato de Tenant
            const memberTenant = await this.memberTenantModel.findOneAndUpdate(
                { user: userObjectId, tenant: tenantObjectId, role: 'owner' },
                { $set: { tenantAddress: contractTenant } },
                { new: true, upsert: false }
            );

            if (!memberTenant) {
                throw new Error('No se pudo actualizar el tenantAddress en MemberTenant');
            }

            return memberTenant;
        } catch (error) {
            throw new BadRequestException(`Error al desplegar el contrato de Tenant: ${error.message}`);
        }
    }

    /**
     * Crea una elección en el contrato Tenant
     * @param memberTenantId - ID del MemberTenant
     * @param subdomain - Subdominio de la elección
     * @param electionAddress - Dirección del contrato de elección
     * @returns Resultado de la transacción
     */
    async createElection(memberTenantId: string, subdomain: string, electionAddress: string) {
        const memberTenant = await this.memberTenantModel.findById(memberTenantId);
        if (!memberTenant || !memberTenant.tenantAddress) {
            throw new Error('Tenant address not set in MemberTenant');
        }

        const tenantContract = new ethers.Contract(memberTenant.tenantAddress, tenantAbi.abi, this.wallet);

        try {
            const tx = await tenantContract.createElection(subdomain, electionAddress);
            await tx.wait();
            return { success: true, subdomain, electionAddress };
        } catch (error) {
            throw new BadRequestException(`Error al crear la elección: ${error.message}`);
        }
    }

    /**
     * Obtiene los detalles de una elección en el contrato Tenant
     * @param memberTenantId - ID del MemberTenant
     * @param subdomain - Subdominio de la elección
     * @returns Detalles de la elección
     */
    async getElectionDetails(memberTenantId: string, subdomain: string) {
        const memberTenant = await this.memberTenantModel.findById(memberTenantId);
        if (!memberTenant || !memberTenant.tenantAddress) {
            throw new Error('Tenant address not set in MemberTenant');
        }

        const tenantContract = new ethers.Contract(memberTenant.tenantAddress, tenantAbi.abi, this.wallet);

        try {
            const electionData = await tenantContract.getElection(subdomain);
            console.log(electionData);
            return {
                electionAddress: electionData[0],
                electionName: electionData[1],
                electionDescription: electionData[2],
            };
        } catch (error) {
            throw new BadRequestException(`Error al obtener los detalles de la elección: ${error.message}`);
        }
    }
}
