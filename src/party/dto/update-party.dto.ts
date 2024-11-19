import { IsString, IsOptional, IsDate, MinLength } from "class-validator";
import { HasMimeType, IsFile, MaxFileSize } from "nestjs-form-data";

export class UpdatePartyDto {

    @IsOptional()
    @IsString()
    @MinLength(3)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    abbreviation?: string;

    @IsOptional()
    @IsString()
    ideology?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsFile()
    @MaxFileSize(1e6)
    @HasMimeType(['image/*'])
    logo?: File;
}
