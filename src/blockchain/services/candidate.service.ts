import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ethers } from 'ethers';
import { MemberTenant } from 'src/tenant/entity';
import electionAbi from '../abis/contracts/Election.json';
import { CandidateWithId } from '../interfaces/election-create';
import { CreateCandidateDto } from '../dto/create-candidate.dto';
import { PinataService } from 'src/pinata/services/pinata.service';
import { PatchCandidateDto } from '../dto/patch-candidate.dto';

@Injectable()
export class CandidateService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;

    constructor(
        private configService: ConfigService,
        private pinataService: PinataService,
        @InjectModel(MemberTenant.name) private memberTenantModel: Model<MemberTenant>
    ) {
        const providerUrl = this.configService.get<string>('blockchain_url');
        const privateKey = this.configService.get<string>('wallet_private_key');
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
    }

    async getAllCandidates(memberTenantId: string): Promise<CandidateWithId[]> {
        const memberTenant = await this.memberTenantModel.findById(memberTenantId);
        if (!memberTenant || !memberTenant.electionAddress) {
            throw new Error('Election address not set in MemberTenant');
        }

        const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

        try {
            const candidatesData = await electionContract.getAllCandidates();

            const candidates: CandidateWithId[] = await Promise.all(
                candidatesData.map(async (candidateData: any) => {
                    const candidate = this.mapToCandidateWithId(candidateData);

                    candidate.photo = await this.pinataService.getFileUrl(candidate.imgHash);

                    return candidate;
                })
            );

            return candidates;
        } catch (error) {
            throw new BadRequestException(`Error al obtener los candidatos: ${error.message}`);
        }
    }



    async createCandidate(memberTenantId: string, createCandidateDto: CreateCandidateDto) {
        const { name, description, photo, email, partyId } = createCandidateDto;

        const memberTenant = await this.memberTenantModel.findById(memberTenantId);
        if (!memberTenant || !memberTenant.electionAddress) {
            throw new Error('Election address not set in MemberTenant');
        }


        const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

        try {
            const { cid, fileUrl } = await this.pinataService.uploadFile(photo);
            const tx = await electionContract.addCandidate(name, description, cid, email, partyId);
            await tx.wait();
            return {
                name,
                description,
                imgHash: cid,
                email,
                partyId,
                photo: fileUrl,
            }
        } catch (error) {
            throw new BadRequestException(`Error al agregar el candidato: ${error.message}`);
        }
    }

    async getCandidate(memberTenantId: string, candidateId: number): Promise<CandidateWithId> {
        const memberTenant = await this.memberTenantModel.findById(memberTenantId);
        if (!memberTenant || !memberTenant.electionAddress) {
            throw new Error('Election address not set in MemberTenant');
        }

        const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

        try {
            const candidateData = await electionContract.getCandidate(candidateId);

            const candidate = this.mapToCandidateWithId(candidateData);

            candidate.photo = await this.pinataService.getFileUrl(candidate.imgHash);

            return candidate;
        } catch (error) {
            throw new BadRequestException(`Error al obtener el candidato: ${error.message}`);
        }
    }


    async patchCandidate(memberTenantId: string, candidateId: string, patchCandidateDto: PatchCandidateDto) {
        const { name, description, photo, email, partyId } = patchCandidateDto;

        const memberTenant = await this.memberTenantModel.findById(memberTenantId);
        if (!memberTenant || !memberTenant.electionAddress) {
            throw new Error('Election address not set in MemberTenant');
        }

        const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

        try {
            const { cid, fileUrl } = await this.pinataService.uploadFile(photo);
            const tx = await electionContract.updateCandidate(candidateId, name, description, cid, email, partyId);
            await tx.wait();
            return {
                name: name,
                description: description,
                imgHash: cid,
                email: email,
                partyId: partyId,
                photo: fileUrl,
            }
        } catch (error) {
            throw new BadRequestException(`Error al actualizar el candidato: ${error.message}`);
        }
    }

    async deleteCandidate(memberTenantId: string, candidateId: number) {
        const memberTenant = await this.memberTenantModel.findById(memberTenantId);
        if (!memberTenant || !memberTenant.electionAddress) {
            throw new Error('Election address not set in MemberTenant');
        }

        const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.wallet);

        try {
            const tx = await electionContract.deleteCandidate(candidateId);
            await tx.wait();
        } catch (error) {
            throw new BadRequestException(`Error al eliminar el candidato: ${error.message}`);
        }
    }

    mapToCandidateWithId(data: any): CandidateWithId {
        return {
            id: Number(data[0]),
            name: data[1],
            description: data[2],
            imgHash: data[3],
            voteCount: Number(data[4]),
            email: data[5],
            partyId: data[6],
            isActive: data[7],
        };
    }



}
