import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  HttpStatus,
  BadRequestException,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AwsService } from '../services/aws.service';
import { Multer } from 'multer';
import { TokenAuthGuard } from 'src/auth/guard';
import { Request } from 'express';
import { TokenTenantGuard } from 'src/tenant/guard/token-tenant.guard';

@Controller('aws')
export class AwsController {
  constructor(private readonly awsService: AwsService) { }

  /**
   * Procesa el documento del usuario.
   * @param req - Información de la solicitud (tenantId).
   * @param files - Archivos subidos (anverso y reverso del documento).
   * @returns Información validada del usuario.
   */
  @Post('process-document')
  @UseGuards(TokenAuthGuard, TokenTenantGuard)
  @UseInterceptors(FilesInterceptor('files', 2))
  @HttpCode(HttpStatus.OK)
  async processDocument(
    @Req() req: Request,
    @UploadedFiles() files: Multer.File[],
  ) {
    if (!files || files.length !== 2) {
      throw new BadRequestException('Debes subir las fotos del anverso y reverso del documento');
    }

    const userId = req.userId;
    const tenantId = req.tenantId;
    const [frontFile, backFile] = files;

    try {
      const result = await this.awsService.processAndValidateDocument(frontFile.buffer, backFile.buffer, userId, tenantId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Documento procesado y validado exitosamente',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(`Error al procesar el documento: ${error.message}`);
    }
  }

  /**
   * Compara la foto del usuario con la foto extraída del documento.
   * @param files - Archivo subido (anverso y reverso del documento,foto del usuario).
   * @returns Resultado de la comparación facial.
   */
  @Post('compare-face')
  @UseGuards(TokenAuthGuard, TokenTenantGuard)
  @UseInterceptors(FilesInterceptor('files', 3)) // Aceptar hasta 3 archivos
  @HttpCode(HttpStatus.OK)
  async compareFace(
    @Req() req: Request,
    @UploadedFiles() files: Multer.File[]
  ) {
    if (!files || files.length !== 3) {
      throw new BadRequestException('Debes subir tres fotos: anverso, reverso del documento y tu selfie.');
    }

    const userId = req.userId;
    const tenantId = req.tenantId;
    const [frontFile, backFile, selfieFile] = files;

    try {
      const isFaceMatch = await this.awsService.compareFacesWithDocument(
        userId,
        tenantId,
        frontFile.buffer,
        backFile.buffer,
        selfieFile.buffer,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Comparación facial completada',
        data: { isFaceMatch },
      };
    } catch (error) {
      throw new BadRequestException(`Error al comparar las fotos: ${error.message}`);
    }
  }

}

