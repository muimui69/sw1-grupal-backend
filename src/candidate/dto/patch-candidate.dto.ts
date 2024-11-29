import { IsString, IsOptional, IsEmail } from 'class-validator';
import { HasMimeType, IsFile, MaxFileSize } from 'nestjs-form-data';

export class PatchCandidateDto {

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsFile()
    @MaxFileSize(1e6)
    @HasMimeType(['image/*'])
    photo?: File;

    @IsOptional()
    @IsString()
    partyId?: string;
}
