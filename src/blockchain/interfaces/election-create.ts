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
