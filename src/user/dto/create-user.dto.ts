import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { HasMimeType, IsFile, MaxFileSize, MemoryStoredFile } from "nestjs-form-data";


export class CreateUserDto{

  @IsEmail()
  @IsString()
  email: string;


  @IsString()
  @MinLength(3)
  username: string;


  @IsString()
  password: string;


  @IsOptional()
  @IsFile()
  @MaxFileSize(1e6)
  @HasMimeType(['image/*'])
  photo?:         MemoryStoredFile;
}