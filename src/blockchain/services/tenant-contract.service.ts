import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ContractFactory, JsonRpcProvider, Provider, Wallet, ethers } from 'ethers';
import tenantAbi from '../abis/contracts/Tenant.json';
import { MemberTenant } from 'src/tenant/entity';

@Injectable()
export class TenantContractService {
    private provider: Provider;
    private wallet: Wallet;

    constructor(
        private configService: ConfigService,
        @InjectModel(MemberTenant.name) private memberTenantModel: Model<MemberTenant>
    ) {
        const providerUrl = this.configService.get<string>('blockchain_url');
        const privateKey = this.configService.get<string>('wallet_private_key');
        this.provider = new JsonRpcProvider(providerUrl);
        this.wallet = new Wallet(privateKey, this.provider);
    }
    // async deployTenant(userId: string, tenantId: string): Promise<MemberTenant> {
    //     if (!Types.ObjectId.isValid(userId)) {
    //         throw new BadRequestException("El ID de usuario proporcionado no es válido.");
    //     }

    //     if (!Types.ObjectId.isValid(tenantId)) {
    //         throw new BadRequestException("El ID del tenant proporcionado no es válido.");
    //     }

    //     const TenantFactory = new ContractFactory(tenantAbi.abi, tenantAbi.bytecode, this.wallet);
    //     const deploymentFee = await this.wallet.estimateGas();

    //     const tenantContract = await TenantFactory.deploy();
    //     await tenantContract.waitForDeployment();

    //     const tenantAddressContract = await tenantContract.getAddress();
    //     console.log(`Tenant deployed at: ${tenantAddressContract}`);


    //     const memberTenant = await this.memberTenantModel.findOneAndUpdate(
    //         { user: userId, tenant: tenantId, role: "owner" },
    //         { tenantAddress: tenantAddressContract },
    //         { new: true, upsert: true } // Crea un documento si no existe
    //     );

    //     if (!memberTenant) {
    //         throw new Error('No se pudo actualizar el tenantAddress en MemberTenant');
    //     }

    //     return memberTenant;
    // }



    // // Método para crear una elección en el contrato Tenant
    // async createElection(memberTenantId: string, subdomain: string, electionAddress: string) {
    //     const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    //     if (!memberTenant || !memberTenant.tenantAddress) throw new Error('Tenant address not set in MemberTenant');

    //     const tenantContract = new ethers.Contract(memberTenant.tenantAddress, tenantAbi.abi, this.wallet);
    //     const tx = await tenantContract.createElection(subdomain, electionAddress);
    //     await tx.wait();

    //     return { success: true, subdomain, electionAddress };
    // }

    // // Método para obtener los detalles de una elección en el contrato Tenant
    // async getElectionDetails(memberTenantId: string, subdomain: string) {
    //     const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    //     if (!memberTenant || !memberTenant.tenantAddress) throw new Error('Tenant address not set in MemberTenant');

    //     const tenantContract = new ethers.Contract(memberTenant.tenantAddress, tenantAbi.abi, this.wallet);
    //     const electionData = await tenantContract.getElection(subdomain);

    //     return {
    //         electionAddress: electionData[0],
    //         electionName: electionData[1],
    //         electionDescription: electionData[2],
    //     };
    // }
}
