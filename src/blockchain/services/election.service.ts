import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import electionAbi from '../abis/contracts/Election.json';

@Injectable()
export class ElectionService {
  private provider: ethers.JsonRpcProvider;
  private electionContract: ethers.Contract;

  constructor(private configService: ConfigService) {
    const providerUrl = this.configService.get<string>('blockchain_url');
    this.provider = new ethers.JsonRpcProvider(providerUrl);
  }

  setElectionContract(address: string) {
    const privateKey = this.configService.get<string>('wallet_private_key');
    const wallet = new ethers.Wallet(privateKey, this.provider);

    this.electionContract = new ethers.Contract(
      address,
      electionAbi.abi,
      wallet
    );
  }

  async getCandidates() {
    const candidatesCount = await this.electionContract.getNumOfCandidates();
    const candidates = [];

    for (let i = 0; i < candidatesCount; i++) {
      const candidateData = await this.electionContract.candidates(i);
      candidates.push({
        name: candidateData.name,
        description: candidateData.description,
        imgHash: candidateData.imgHash,
        voteCount: candidateData.voteCount.toString(),
        email: candidateData.email,
      });
    }

    return candidates;
  }


  async getNumOfCandidates() {
    return await this.electionContract.getNumOfCandidates();
  }

  async addCandidate(name: string, description: string, imgHash: string, email: string) {
    const tx = await this.electionContract.addCandidate(name, description, imgHash, email);
    await tx.wait();
    return tx;
  }

  async voteForCandidate(candidateId: number) {
    const tx = await this.electionContract.vote(candidateId);
    await tx.wait(); // Espera la confirmación de la transacción
    return tx;
  }

  async getTotalVotes() {
    return await this.electionContract.getTotalVotes();
  }

  async getElectionResult() {
    const result = await this.electionContract.getElectionResult();
    return {
      winnerName: result[0],
      winnerVoteCount: result[1].toNumber(),
    };
  }

  async endElection() {
    const tx = await this.electionContract.endElection();
    await tx.wait(); // Espera la confirmación de la transacción
    return tx;
  }

  async getElectionStatus() {
    return await this.electionContract.getElectionStatus();
  }
}

//0x65d6A2974466601bF9647b99e164bf95DaD1E016