export interface Candidate {
    name: string;
    description: string;
    imgHash: string;
    voteCount: number;
    email: string;
    partyId: string;
}

export interface CandidateWithId {
    id: number;
    name: string;
    description: string;
    imgHash: string;
    photo?: string;
    voteCount: number;
    email: string;
    partyId: string;
    isActive: boolean;
}

export interface ElectionDetails {
    electionAddress: string;
    electionName: string;
    electionDescription: string;
}

export interface IVote {
    memberTenantId: string;
    candidateId: number;
}

export interface VoteRecord {
    voterAddress: string;  // Dirección del votante que emitió el voto
    timestamp: number;     // Timestamp del voto, posiblemente en formato Unix (número)
    candidateId: number;   // ID del candidato que recibió el voto
    voteHash: string;      // Hash del voto para trazabilidad o verificación
}
