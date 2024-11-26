import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class VoteCandidateDto {

    @IsString()
    @IsNotEmpty()
    memberTenantId: string;

    @IsInt()
    @IsNotEmpty()
    @Min(0)
    candidateId: number;
}
