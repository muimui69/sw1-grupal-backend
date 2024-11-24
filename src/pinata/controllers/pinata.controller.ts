import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpException,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PinataService } from '../services/pinata.service';
import { Multer } from 'multer';

@Controller('pinata')
export class PinataController {
  constructor(private readonly pinataService: PinataService) { }

  /**
   * Subir un archivo a NFT.Storage.
   * @param file - Archivo subido desde el cliente.
   * @returns CID y URL del archivo subido.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Multer.File) {
    try {
      if (!file) {
        throw new HttpException(
          'El archivo es obligatorio',
          HttpStatus.BAD_REQUEST,
        );
      }

      const { cid, fileUrl } = await this.pinataService.uploadFile(file);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Archivo subido exitosamente',
        data: {
          cid,
          fileUrl
        },
      };
    } catch (error) {
      throw new HttpException(
        `Error al subir el archivo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


}
