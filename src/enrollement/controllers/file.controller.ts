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
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileService } from '../services/file.service';
import * as path from 'path';
import { Multer } from 'multer';

@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) { }

    /**
     * Endpoint para subir y procesar un archivo Excel.
     * @param file - Archivo Excel proporcionado por el usuario.
     * @param expectedHeaders - Columnas esperadas enviadas desde el frontend.
     */
    @Post('upload/excel')
    @UseInterceptors(FileInterceptor('file'))
    async uploadExcel(
        @UploadedFile() file: Multer.File,
        @Body('expectedHeaders') expectedHeaders: string, // Recibe como string
    ) {
        if (!file) {
            throw new BadRequestException('No se ha proporcionado un archivo.');
        }

        // Convierte el string JSON en un array
        let headersArray: string[];
        try {
            headersArray = JSON.parse(expectedHeaders);
        } catch (error) {
            throw new BadRequestException('expectedHeaders debe ser un JSON válido.');
        }

        // Llama al servicio para procesar el archivo
        await this.fileService.processExcel(file.buffer, headersArray);

        return {
            message: 'Archivo procesado exitosamente.',
        };
    }


    /**
     * Endpoint para subir y procesar un archivo CSV.
     * @param file - Archivo CSV proporcionado por el usuario.
     * @param expectedHeaders - Columnas esperadas enviadas desde el frontend.
     */
    @Post('upload/csv')
    @UseInterceptors(FileInterceptor('file'))
    async uploadCSV(
        @UploadedFile() file: Multer.File,
        @Body('expectedHeaders') expectedHeaders: string, // Recibe como string
    ) {
        if (!file) {
            throw new HttpException('Archivo no proporcionado', HttpStatus.BAD_REQUEST);
        }

        let headersArray: string[];
        try {
            headersArray = JSON.parse(expectedHeaders);
        } catch (error) {
            throw new BadRequestException('expectedHeaders debe ser un JSON válido.');
        }

        try {
            await this.fileService.processCSV(file.buffer, headersArray);
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
     * @param files - Archivos subidos.
     * @param expectedHeaders - Columnas esperadas enviadas desde el frontend.
     */
    @Post('upload/multiple')
    @UseInterceptors(FilesInterceptor('files'))
    async uploadMultipleFiles(
        @UploadedFiles() files: Multer.File[],
        @Body('expectedHeaders') expectedHeaders: string[],
    ) {
        if (!files || files.length === 0) {
            throw new HttpException('No se proporcionaron archivos', HttpStatus.BAD_REQUEST);
        }

        if (!expectedHeaders || expectedHeaders.length === 0) {
            throw new HttpException(
                'No se proporcionaron las columnas esperadas para validar los archivos',
                HttpStatus.BAD_REQUEST,
            );
        }

        const errors: string[] = [];
        for (const file of files) {
            try {
                if (path.extname(file.originalname).toLowerCase() === '.csv') {
                    await this.fileService.processCSV(file.path, expectedHeaders);
                } else if (path.extname(file.originalname).toLowerCase() === '.xlsx') {
                    await this.fileService.processExcel(file.path, expectedHeaders);
                } else {
                    errors.push(`Formato no soportado para el archivo: ${file.originalname}`);
                }
            } catch (error) {
                console.error(`Error al procesar el archivo ${file.originalname}:`, error.message);
                errors.push(`Error en el archivo ${file.originalname}: ${error.message}`);
            }
        }

        if (errors.length > 0) {
            throw new HttpException(
                `Errores en algunos archivos: ${errors.join('; ')}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { message: 'Todos los archivos procesados con éxito' };
    }
}
