import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { HasMimeType, IsFile, MaxFileSize } from 'nestjs-form-data';

export class CreateCandidateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsOptional()
    @IsFile()
    @MaxFileSize(1e6)
    @HasMimeType(['image/*'])
    photo?: File;

    @IsString()
    @IsNotEmpty()
    partyId: string;
}
