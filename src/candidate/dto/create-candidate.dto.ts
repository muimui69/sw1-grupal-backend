import { IsOptional, IsString, MinLength } from "class-validator";
import { HasMimeType, IsFile, MaxFileSize, MemoryStoredFile } from "nestjs-form-data";


export class CreateCandidateDto{
  @IsString()
  @MinLength(5)
  name: string;

  @IsFile()
  @IsOptional()
  @MaxFileSize(1e6)
  @HasMimeType(['image/*'])
  photo: MemoryStoredFile;
}