import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    HttpException,
    HttpStatus,
    Body,
    UploadedFiles,
    BadRequestException,
    UseGuards,
    Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { Multer } from 'multer';
import { TokenAuthGuard } from 'src/auth/guard';
import { TenantIdGuard } from 'src/tenant/guard';
import { Request } from 'express';
import { EnrollmentService } from '../services/enrollment.service';

@Controller('enrollment')
export class EnrollmentController {
    constructor(private readonly enrollmentService: EnrollmentService) { }

    /**
     * Endpoint para subir y procesar un archivo Excel.
     * @param req - Solicitud que contiene el userId y tenantId.
     * @param file - Archivo Excel proporcionado por el usuario.
     * @param expectedHeaders - Columnas esperadas enviadas desde el frontend.
     */
    @Post('upload/excel')
    @UseGuards(TokenAuthGuard, TenantIdGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadExcel(
        @Req() req: Request,
        @UploadedFile() file: Multer.File,
        @Body('expectedHeaders') expectedHeaders: string, // Recibe como string
    ) {
        if (!file) {
            throw new BadRequestException('No se ha proporcionado un archivo.');
        }

        const userId = req.userId;
        const tenantId = req.tenantId;

        // Convierte el string JSON en un array
        let headersArray: string[];
        try {
            headersArray = JSON.parse(expectedHeaders);
        } catch (error) {
            throw new BadRequestException('expectedHeaders debe ser un JSON válido.');
        }

        // Llama al servicio para procesar el archivo
        await this.enrollmentService.processExcel(file.buffer, headersArray, userId, tenantId);

        return {
            message: 'Archivo procesado exitosamente.',
        };
    }


    /**
     * Endpoint para subir y procesar un archivo CSV.
     * @param req - Solicitud que contiene el userId y tenantId.
     * @param file - Archivo CSV proporcionado por el usuario.
     * @param expectedHeaders - Columnas esperadas enviadas desde el frontend.
     */
    @Post('upload/csv')
    @UseGuards(TokenAuthGuard, TenantIdGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadCSV(
        @Req() req: Request,
        @UploadedFile() file: Multer.File,
        @Body('expectedHeaders') expectedHeaders: string,
    ) {
        if (!file) {
            throw new HttpException('Archivo no proporcionado', HttpStatus.BAD_REQUEST);
        }

        const userId = req.userId;
        const tenantId = req.tenantId;

        let headersArray: string[];
        try {
            headersArray = JSON.parse(expectedHeaders);
        } catch (error) {
            throw new BadRequestException('expectedHeaders debe ser un JSON válido.');
        }

        try {
            await this.enrollmentService.processCSV(file.buffer, headersArray, userId, tenantId);
            return { message: 'Archivo CSV procesado con éxito' };
        } catch (error) {
            console.error('Error al procesar el archivo:', error.message);
            throw new HttpException(
                `Error al procesar el archivo: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Endpoint para subir y procesar múltiples archivos (Excel o CSV).
     * @param req - Solicitud que contiene el userId y tenantId.
     * @param files - Archivos subidos.
     * @param expectedHeaders - Columnas esperadas enviadas desde el frontend.
     */
    // @Post('upload/multiple')
    // @UseGuards(TokenAuthGuard, TenantIdGuard)
    // @UseInterceptors(FilesInterceptor('files'))
    // async uploadMultipleFiles(
    //     @Req() req: Request,
    //     @UploadedFiles() files: Multer.File[],
    //     @Body('expectedHeaders') expectedHeaders: string[],
    // ) {
    //     if (!files || files.length === 0) {
    //         throw new HttpException('No se proporcionaron archivos', HttpStatus.BAD_REQUEST);
    //     }


    //     const userId = req.userId;
    //     const tenantId = req.tenantId;

    //     if (!expectedHeaders || expectedHeaders.length === 0) {
    //         throw new HttpException(
    //             'No se proporcionaron las columnas esperadas para validar los archivos',
    //             HttpStatus.BAD_REQUEST,
    //         );
    //     }

    //     const errors: string[] = [];
    //     for (const file of files) {
    //         try {
    //             if (path.extname(file.originalname).toLowerCase() === '.csv') {
    //                 await this.fileService.processCSV(file.path, expectedHeaders, userId, tenantId);;
    //             } else if (path.extname(file.originalname).toLowerCase() === '.xlsx') {
    //                 await this.fileService.processExcel(file.path, expectedHeaders, userId, tenantId);
    //             } else {
    //                 errors.push(`Formato no soportado para el archivo: ${file.originalname}`);
    //             }
    //         } catch (error) {
    //             console.error(`Error al procesar el archivo ${file.originalname}:`, error.message);
    //             errors.push(`Error en el archivo ${file.originalname}: ${error.message}`);
    //         }
    //     }

    //     if (errors.length > 0) {
    //         throw new HttpException(
    //             `Errores en algunos archivos: ${errors.join('; ')}`,
    //             HttpStatus.INTERNAL_SERVER_ERROR,
    //         );
    //     }

    //     return { message: 'Todos los archivos procesados con éxito' };
    // }
}
