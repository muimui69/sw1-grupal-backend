import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    HttpException,
    HttpStatus,
    Body,
    BadRequestException,
    UseGuards,
    Req,
    HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { TokenAuthGuard } from 'src/auth/guard';
import { Request } from 'express';
import { EnrollmentService } from '../services/enrollment.service';
import { TokenTenantGuard } from 'src/tenant/guard/token-tenant.guard';

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
    @UseGuards(TokenAuthGuard, TokenTenantGuard)
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(HttpStatus.CREATED)
    async uploadExcel(
        @Req() req: Request,
        @UploadedFile() file: Multer.File,
        @Body('expectedHeaders') expectedHeaders: string, // Recibe como string
    ) {
        if (!file) {
            throw new BadRequestException('No se ha proporcionado un archivo.');
        }

        const statusCode = HttpStatus.CREATED;
        const userId = req.userId;
        const tenantId = req.tenantId;

        let headersArray: string[];
        try {
            headersArray = JSON.parse(expectedHeaders);
        } catch (error) {
            throw new BadRequestException('expectedHeaders debe ser un JSON válido.');
        }

        await this.enrollmentService.processExcel(file.buffer, headersArray, userId, tenantId);

        return {
            statusCode,
            message: 'Archivo Excel procesado exitosamente.',
        };
    }

    /**
     * Endpoint para subir y procesar un archivo CSV.
     * @param req - Solicitud que contiene el userId y tenantId.
     * @param file - Archivo CSV proporcionado por el usuario.
     * @param expectedHeaders - Columnas esperadas enviadas desde el frontend.
     */
    @Post('upload/csv')
    @UseGuards(TokenAuthGuard, TokenTenantGuard)
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(HttpStatus.CREATED)
    async uploadCSV(
        @Req() req: Request,
        @UploadedFile() file: Multer.File,
        @Body('expectedHeaders') expectedHeaders: string,
    ) {
        if (!file) {
            throw new BadRequestException('No se ha proporcionado un archivo.');
        }

        const statusCode = HttpStatus.CREATED;

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
            return {
                statusCode,
                message: 'Archivo CSV procesado exitosamente.',
            };
        } catch (error) {
            console.error('Error al procesar el archivo:', error.message);
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: `Error al procesar el archivo.`,
                    error: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
