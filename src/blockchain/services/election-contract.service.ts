import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ethers } from 'ethers';
import electionAbi from '../abis/contracts/Election.json';
import { MemberTenant } from 'src/tenant/entity';

@Injectable()
export class ElectionContractService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;

  constructor(
    private configService: ConfigService,
    @InjectModel(MemberTenant.name) private memberTenantModel: Model<MemberTenant>
  ) {
    const providerUrl = this.configService.get<string>('blockchain_url');
    const privateKey = this.configService.get<string>('wallet_private_key');
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
  }

  // Método para desplegar el contrato Election y actualizar el MemberTenant con la dirección
  async deployElection(adminAddress: string, electionName: string, electionDescription: string, memberTenantId: string): Promise<MemberTenant> {
    const ElectionFactory = new ethers.ContractFactory(electionAbi.abi, electionAbi.bytecode, this.signer);
    const electionContract = await ElectionFactory.deploy(adminAddress, electionName, electionDescription);
    await electionContract.waitForDeployment();

    const electionAddressContract = await electionContract.getAddress()


    console.log(`Election deployed at: ${electionAddressContract}`);

    const memberTenant = await this.memberTenantModel.findByIdAndUpdate(
      memberTenantId,
      { electionAddress: electionAddressContract },
      { new: true }
    );

    if (!memberTenant) throw new Error('MemberTenant not found');

    return memberTenant;
  }

  async addCandidate(memberTenantId: string, name: string, description: string, imgHash: string, email: string) {
    const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    if (!memberTenant || !memberTenant.electionAddress) throw new Error('Election address not set in MemberTenant');

    const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.signer);
    const tx = await electionContract.addCandidate(name, description, imgHash, email);
    await tx.wait();

    return { success: true, name };
  }

  async vote(memberTenantId: string, candidateId: number) {
    const memberTenant = await this.memberTenantModel.findById(memberTenantId);
    if (!memberTenant || !memberTenant.electionAddress) throw new Error('Election address not set in MemberTenant');

    const electionContract = new ethers.Contract(memberTenant.electionAddress, electionAbi.abi, this.signer);
    const tx = await electionContract.vote(candidateId);
    await tx.wait();

    return { success: true, candidateId };
  }
}
