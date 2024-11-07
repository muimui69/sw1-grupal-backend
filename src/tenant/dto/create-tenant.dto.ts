import { IsEnum, IsNumber, IsOptional, IsString, IsUrl, MinLength } from "class-validator";
import { HasMimeType, IsFile, MaxFileSize, MemoryStoredFile } from "nestjs-form-data";
import { Plan } from "src/constant";


export class CreateTenantDto{

  @IsEnum(Plan, {message: "No es algun plan valido"})
  plan: keyof typeof Plan;

  @IsOptional()
  @IsNumber()
  number_voting?: number;

  @IsString()
  @MinLength(4)
  name:       string;

  @IsString()
  @IsUrl()
  domain:     string;

}