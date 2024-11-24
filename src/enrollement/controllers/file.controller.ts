import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, Multer } from 'multer';
import * as path from 'path';
import { FileService } from '../services/file.service';

@Controller('files')
export class FileController {
    constructor(private readonly fileService: FileService) { }

    // Fecha de nacimineto , fechaDeNacimineto, fecha_de_nacimineto

    // "dni","nombre","apellido","fecha_de_nacimineto","email","telefono","direccion","ciudad","provincia","pais","codigo_postal","fecha_de_alta","fecha_de_baja","estado"



    /**
     * Endpoint para subir y procesar un archivo Excel.
     * @param file Archivo subido por el cliente.
     */
    @Post('upload/excel')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads', // Carpeta donde se guardarán temporalmente los archivos
                filename: (req, file, callback) => {
                    const fileExt = path.extname(file.originalname);
                    const fileName = `${path.basename(
                        file.originalname,
                        fileExt,
                    )}-${Date.now()}${fileExt}`;
                    callback(null, fileName);
                },
            }),
            fileFilter: (req, file, callback) => {
                // Validar que el archivo sea un Excel
                if (!file.originalname.match(/\.(xlsx)$/)) {
                    return callback(
                        new HttpException(
                            'Solo se permiten archivos .xlsx',
                            HttpStatus.BAD_REQUEST,
                        ),
                        false,
                    );
                }
                callback(null, true);
            },
        }),
    )
    async uploadExcel(@UploadedFile() file: Multer.File) {
        if (!file) {
            throw new HttpException(
                'Archivo no proporcionado',
                HttpStatus.BAD_REQUEST,
            );
        }

        try {
            console.log(`Archivo recibido: ${file.path}`);
            await this.fileService.processExcel(file.path);
            return { message: 'Archivo Excel procesado con éxito' };
        } catch (error) {
            console.error('Error al procesar el archivo:', error.message);
            throw new HttpException(
                `Error al procesar el archivo: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Endpoint para subir y procesar un archivo CSV.
     * @param file Archivo subido por el cliente.
     */
    @Post('upload/csv')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, callback) => {
                    const fileExt = path.extname(file.originalname);
                    const fileName = `${path.basename(
                        file.originalname,
                        fileExt,
                    )}-${Date.now()}${fileExt}`;
                    callback(null, fileName);
                },
            }),
            fileFilter: (req, file, callback) => {
                // Validar que el archivo sea un CSV
                if (!file.originalname.match(/\.(csv)$/)) {
                    return callback(
                        new HttpException(
                            'Solo se permiten archivos .csv',
                            HttpStatus.BAD_REQUEST,
                        ),
                        false,
                    );
                }
                callback(null, true);
            },
        }),
    )
    async uploadCSV(@UploadedFile() file: Multer.File) {
        if (!file) {
            throw new HttpException(
                'Archivo no proporcionado',
                HttpStatus.BAD_REQUEST,
            );
        }

        try {
            console.log(`Archivo recibido: ${file.path}`);
            await this.fileService.processCSV(file.path);
            return { message: 'Archivo CSV procesado con éxito' };
        } catch (error) {
            console.error('Error al procesar el archivo:', error.message);
            throw new HttpException(
                `Error al procesar el archivo: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
