import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import tenantAbi from '../abis/contracts/Tenant.json';

@Injectable()
export class TenantService {
    private provider: ethers.JsonRpcProvider;
    private tenantContract: ethers.Contract;

    constructor(private configService: ConfigService) {
        const providerUrl = this.configService.get<string>('blockchain_url');
        this.provider = new ethers.JsonRpcProvider(providerUrl);
    }

    setTenantContract(address: string) {
        this.tenantContract = new ethers.Contract(
            address,
            tenantAbi.abi,
            this.provider
        );
    }

    async getElectionDetails(subdomain: string) {
        if (!this.tenantContract) {
            throw new Error('Tenant contract is not set');
        }

        const electionData = await this.tenantContract.getElection(subdomain);

        if (!electionData) {
            throw new Error(`No election found for subdomain ${subdomain}`);
        }

        return {
            electionAddress: electionData[0],
            electionName: electionData[1],
            electionDescription: electionData[2],
        };
    }

    async createElection(subdomain: string, electionAddress: string, electionName: string, electionDescription: string) {
        if (!this.tenantContract) {
            throw new Error('Tenant contract is not set');
        }

        const tx = await this.tenantContract.createElection(subdomain, electionAddress, electionName, electionDescription);
        await tx.wait();
        return { success: true, subdomain, electionAddress, electionName, electionDescription };
    }

    async updateElection(subdomain: string, electionAddress: string, electionName: string, electionDescription: string) {
        if (!this.tenantContract) {
            throw new Error('Tenant contract is not set');
        }

        const tx = await this.tenantContract.updateElection(subdomain, electionAddress, electionName, electionDescription);
        await tx.wait();
        return { success: true, subdomain, electionAddress, electionName, electionDescription };
    }

    async deleteElection(subdomain: string) {
        if (!this.tenantContract) {
            throw new Error('Tenant contract is not set');
        }

        const tx = await this.tenantContract.deleteElection(subdomain);
        await tx.wait();
        return { success: true, subdomain };
    }

    async listElections() {
        if (!this.tenantContract) {
            throw new Error('Tenant contract is not set');
        }

        const electionCount = await this.tenantContract.getElectionCount();
        const elections = [];

        for (let i = 0; i < electionCount; i++) {
            const election = await this.tenantContract.elections(i);
            elections.push({
                electionAddress: election[0],
                electionName: election[1],
                electionDescription: election[2],
            });
        }

        return elections;
    }

    async electionExists(subdomain: string) {
        if (!this.tenantContract) {
            throw new Error('Tenant contract is not set');
        }

        return await this.tenantContract.electionExists(subdomain);
    }
}

// 0xC19f69707178aAA6e51b4388e141c1962ECFC8A9