import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  HttpStatus,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AwsService } from '../services/aws.service';
import { Multer } from 'multer';
import { diskStorage, memoryStorage } from 'multer';

@Controller('aws')
export class AwsController {
  constructor(private readonly awsService: AwsService) { }

  /**
   * Procesa la foto y realiza reconocimiento documental y facial.
   * @param files - Archivos subidos (documento e imagen del dueño).
   */
  @Post('process')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      storage: memoryStorage(), // Cambia a memoryStorage para obtener el buffer
    }),
  )
  async processPhoto(@UploadedFiles() files: Multer.File[]) {
    if (!files || files.length < 2) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Debes subir tanto el documento como la foto del dueño',
      };
    }

    const [documentFile, ownerPhotoFile] = files;

    // Extraer texto del documento
    const extractedText = await this.awsService.extractTextFromDocument(
      documentFile.buffer,
    );

    // Comparar las caras
    const isFaceMatch = await this.awsService.compareFaces(
      documentFile.buffer,
      ownerPhotoFile.buffer,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Procesamiento completado',
      data: {
        extractedText,
        isFaceMatch,
      },
    };
  }

  // @Post('process-document')
  // @UseInterceptors(
  //   FilesInterceptor('files', 2, {
  //     storage: memoryStorage(),
  //   }),
  // ) // Anverso y reverso del documento
  // async processDocument(@UploadedFiles() files: Multer.File[]) {
  //   if (!files || files.length !== 2) {
  //     return {
  //       statusCode: HttpStatus.BAD_REQUEST,
  //       message: 'Debes subir las fotos del anverso y reverso del documento',
  //     };
  //   }

  //   const [frontFile, backFile] = files;

  //   const frontText = await this.awsService.extractTextFromDocument(frontFile.buffer);
  //   const backText = await this.awsService.extractTextFromDocument(backFile.buffer);

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: 'Documento procesado exitosamente',
  //     data: {
  //       frontText,
  //       backText,
  //     },
  //   };
  // }

  // @Post('process-face')
  // @UseInterceptors(FileInterceptor('file')) // Solo se espera 1 archivo: la foto del dueño
  // async processFace(@UploadedFile() file: Multer.File) {
  //   if (!file) {
  //     return {
  //       statusCode: HttpStatus.BAD_REQUEST,
  //       message: 'Debes subir la foto del dueño',
  //     };
  //   }

  //   // Recupera la foto del documento desde la base de datos o el storage
  //   const documentPhotoBuffer = await this.awsService.getDocumentPhotoBuffer(); // Método para obtener la foto previamente procesada

  //   // Compara la cara subida con la foto del documento
  //   const isFaceMatch = await this.awsService.compareFaces(
  //     documentPhotoBuffer,
  //     file.buffer,
  //   );

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: 'Comparación facial completada',
  //     data: {
  //       isFaceMatch,
  //     },
  //   };
  // }


}
