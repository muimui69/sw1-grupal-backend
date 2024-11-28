import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ethers } from 'ethers';
import { MemberTenant } from 'src/tenant/entity';
import electionAbi from '../../blockchain/abis/contracts/Election.json';
import { CandidateWithId } from '../../blockchain/interfaces/election-create';
import { CreateCandidateDto } from '../../blockchain/dto/create-candidate.dto';
import { PinataService } from 'src/pinata/services/pinata.service';
import { PatchCandidateDto } from '../../blockchain/dto/patch-candidate.dto';

@Injectable()
export class CandidateService {
    private readonly provider: ethers.JsonRpcProvider;
    private readonly wallet: ethers.Wallet;

    constructor(
        private readonly configService: ConfigService,
        private readonly pinataService: PinataService,
        @InjectModel(MemberTenant.name) private readonly memberTenantModel: Model<MemberTenant>,
    ) {
        const providerUrl = this.configService.get<string>('blockchain_url');
        const privateKey = this.configService.get<string>('wallet_private_key');
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
    }

    /**
     * Obtiene todos los candidatos registrados en una elección.
     * @param memberTenantId - ID del MemberTenant asociado a la elección.
     * @returns Lista de candidatos con sus detalles.
     */
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
                }),
            );

            return candidates;
        } catch (error) {
            throw new BadRequestException(`Error al obtener los candidatos: ${error.message}`);
        }
    }

    /**
     * Crea un nuevo candidato para una elección.
     * @param memberTenantId - ID del MemberTenant asociado a la elección.
     * @param createCandidateDto - Datos del candidato.
     * @returns Detalles del candidato creado.
     */
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
            };
        } catch (error) {
            throw new BadRequestException(`Error al agregar el candidato: ${error.message}`);
        }
    }

    /**
     * Obtiene los detalles de un candidato específico.
     * @param memberTenantId - ID del MemberTenant asociado a la elección.
     * @param candidateId - ID del candidato.
     * @returns Detalles del candidato.
     */
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

    /**
     * Actualiza los detalles de un candidato.
     * @param memberTenantId - ID del MemberTenant asociado a la elección.
     * @param candidateId - ID del candidato.
     * @param patchCandidateDto - Datos actualizados del candidato.
     * @returns Detalles del candidato actualizado.
     */
    async patchCandidate(memberTenantId: string, candidateId: number, patchCandidateDto: PatchCandidateDto) {
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
                name,
                description,
                imgHash: cid,
                email,
                partyId,
                photo: fileUrl,
            };
        } catch (error) {
            throw new BadRequestException(`Error al actualizar el candidato: ${error.message}`);
        }
    }

    /**
     * Elimina un candidato de la elección.
     * @param memberTenantId - ID del MemberTenant asociado a la elección.
     * @param candidateId - ID del candidato.
     */
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

    /**
     * Mapea los datos del contrato a un objeto `CandidateWithId`.
     * @param data - Datos del candidato obtenidos del contrato.
     * @returns Objeto `CandidateWithId` mapeado.
     */
    private mapToCandidateWithId(data: CandidateWithId): CandidateWithId {
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
