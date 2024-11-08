export interface Candidate {
    name: string;
    description: string;
    imgHash: string;
    voteCount: number;
    email: string;
}

export interface ElectionDetails {
    electionAddress: string;
    electionName: string;
    electionDescription: string;
}
