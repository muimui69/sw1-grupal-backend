import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Worker } from 'worker_threads';
import * as path from 'path';
import { existsSync, promises as fs, mkdirSync } from 'fs';
import * as fastCsv from 'fast-csv';
import * as jwt from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnrollmentTokenResult, IEnrollmentToken } from '../interfaces/IToken-enrollment.interface';
import { isValidObjectId } from 'mongoose';


@Injectable()
export class EnrollmentService {
    private readonly tempDir = path.join('./temp');

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        if (!existsSync(this.tempDir)) {
            mkdirSync(this.tempDir, { recursive: true })
        }
    }

    /**
     * Procesa un archivo Excel en streaming.
     * @param fileBuffer - Buffer del archivo Excel.
     * @param expectedHeaders - Columnas esperadas desde el frontend.
     * @param userId - ID del usuario.
     * @param tenantId - ID del tenant.
     */
    async processExcel(fileBuffer: Buffer, expectedHeaders: string[], userId: string, tenantId: string): Promise<void> {
        const tempFilePath = await this.saveTempFile(fileBuffer, 'xlsx');

        try {
            const workbook = new ExcelJS.stream.xlsx.WorkbookReader(tempFilePath, {});
            for await (const worksheet of workbook) {
                let isFirstRow = true;
                const batch: any[] = [];
                const batchSize = 1000; // Lote de 1000 filas

                for await (const row of worksheet) {
                    if (isFirstRow) {
                        // Extrae y normaliza las columnas de la primera fila
                        const headers = this.extractHeaders(row);
                        const normalizedExpectedHeaders = expectedHeaders.map(h => h.trim().toLowerCase());

                        if (!this.validateHeaders(headers, normalizedExpectedHeaders)) {
                            throw new InternalServerErrorException('Las columnas del archivo no son válidas');
                        }
                        isFirstRow = false;
                    } else {
                        // Procesa filas normales
                        const rowData = this.extractRowData(row);
                        batch.push(rowData);

                        if (batch.length >= batchSize) {
                            await this.processBatch(batch, expectedHeaders, userId, tenantId);
                            batch.length = 0; // Limpia el lote después de procesarlo
                        }
                    }
                }
                // Procesa cualquier fila restante
                if (batch.length > 0) {
                    await this.processBatch(batch, expectedHeaders, userId, tenantId);
                }
            }
        } finally {
            // Elimina el archivo temporal después de procesarlo
            await fs.unlink(tempFilePath);
        }
    }

    /**
     * Procesa un archivo CSV en streaming.
     * @param fileBuffer - Buffer del archivo CSV.
     * @param expectedHeaders - Columnas esperadas desde el frontend.
     * @param userId - ID del usuario.
     * @param tenantId - ID del tenant.
     */
    async processCSV(fileBuffer: Buffer, expectedHeaders: string[], userId: string, tenantId: string): Promise<void> {
        let batch: any[] = [];
        const batchSize = 1000;

        return new Promise((resolve, reject) => {
            fastCsv
                .parseString(fileBuffer.toString('utf-8'), { headers: true })
                .on('headers', (headers) => {
                    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
                    const normalizedExpectedHeaders = expectedHeaders.map(h => h.trim().toLowerCase());

                    if (!this.validateHeaders(normalizedHeaders, normalizedExpectedHeaders)) {
                        reject(new InternalServerErrorException('Las columnas del archivo no son válidas'));
                    }
                })
                .on('data', (row) => {
                    const rowData = this.extractRowDataArray(row, expectedHeaders);
                    batch.push(rowData); // Agrega la fila al lote actual

                    if (batch.length >= batchSize) {
                        const currentBatch = [...batch]; // Crea una copia del lote
                        batch = []; // Limpia el lote antes de procesarlo
                        this.processBatch(currentBatch, expectedHeaders, userId, tenantId)
                            .catch((err) => reject(err));
                    }
                })
                .on('end', async () => {
                    if (batch.length > 0) {
                        const finalBatch = [...batch];
                        batch = []; // Limpia el lote restante
                        await this.processBatch(finalBatch, expectedHeaders, userId, tenantId);
                    }
                    resolve();
                })
                .on('error', (error) => {
                    reject(new InternalServerErrorException(`Error al procesar CSV: ${error.message}`));
                });
        });
    }

    /**
     * Guarda un buffer en un archivo temporal.
     * @param fileBuffer - Buffer del archivo.
     * @param extension - Extensión del archivo (xlsx).
     * @returns La ruta del archivo temporal.
     */
    private async saveTempFile(fileBuffer: Buffer, extension: string): Promise<string> {
        const filePath = path.join(this.tempDir, `temp-${Date.now()}.${extension}`);
        await fs.writeFile(filePath, fileBuffer);
        return filePath;
    }

    /**
     * Extrae y normaliza los encabezados de una fila.
     * @param row - Fila del archivo.
     * @returns Encabezados normalizados (en minúsculas).
     */
    private extractHeaders(row: any): string[] {
        return row.values
            ?.slice(1) // Ignora el índice 0
            .map((value: any) => value?.toString().trim().toLowerCase()) // Normaliza a minúsculas
            .filter((value: any) => !!value) || []; // Filtra valores vacíos o nulos
    }

    /**
     * Valida las columnas del archivo contra las columnas esperadas.
     * @param headers - Columnas del archivo.
     * @param expectedHeaders - Columnas esperadas.
     * @returns `true` si las columnas son válidas.
     */
    private validateHeaders(headers: string[], expectedHeaders: string[]): boolean {
        return expectedHeaders.every(expected => headers.includes(expected));
    }

    /**
     * Extrae datos de una fila.
     * @param row - Fila del archivo.
     * @returns Datos de la fila.
     */
    private extractRowData(row: any): any {
        return Array.isArray(row.values) ? row.values.slice(1) : [];
    }

    /**
     * Extrae y asocia los datos de una fila del archivo CSV con los encabezados correspondientes.
     * @param row - Objeto que representa una fila del CSV, donde las claves son los encabezados y los valores son los datos de esa fila.
     * @param headers - Array de cadenas que representan los encabezados esperados para la asociación con los datos de la fila.
     * @returns Un objeto donde cada clave es un encabezado y su valor es el dato correspondiente de la fila.
     */
    private extractRowDataArray(row: any, headers: string[]): any[] {
        return headers.map(header => row[header] || null); // Devuelve un arreglo con los valores en el orden de los encabezados
    }

    /**
     * Convierte una cadena en formato camelCase.
     * @param value - Cadena a convertir.
     * @returns La cadena convertida en camelCase.
     */
    private toCamelCase(value: string): string {
        return value
            .split(/[\s_]+/) // Divide por espacios o guiones bajos
            .map((word, index) => {
                if (index === 0) {
                    return word.toLowerCase(); // La primera palabra en minúsculas
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Capitaliza la primera letra
            })
            .join('');
    }

    /**
     * Procesa un lote de datos utilizando un worker thread.
     * @param batch - Lote de filas a procesar.
     * @param headers - Encabezados esperados.
     * @param userId - ID del usuario.
     * @param tenantId - ID del tenant.
     */
    async processBatch(batch: any[], headers: string[], userId: string, tenantId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const headersToCamelCase = headers.map(header => this.toCamelCase(header));
            const workerPath = path.resolve(__dirname, '../workers/file.worker.js');
            const worker = new Worker(workerPath, {
                workerData: {
                    batch,
                    headers: headersToCamelCase,
                    userId,
                    tenantId,
                }
            });

            worker.on('message', (result) => {
                if (result.success) {
                    console.log(result.message);
                    resolve();
                } else {
                    console.error('Error en el worker:', result.error);
                    reject(new Error(result.error));
                }
            });

            worker.on('error', (error) => {
                console.error('Error en el worker:', error);
                reject(error);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker finalizó con el código ${code}`));
                }
            });
        });
    }

    /**
     * Genera un token JWT basado en el `enrollmentId`.
     * @param enrollmentId - El ID del enrollment que se utilizará para generar el token.
     * @returns El token JWT firmado.
     */
    public async generateEnrollmentToken(memberTenantId: string, enrollmentId: string,): Promise<any> {
        if (!isValidObjectId(enrollmentId)) {
            throw new BadRequestException(`The value ${enrollmentId} is not a valid ObjectId.`);
        }

        if (!isValidObjectId(memberTenantId)) {
            throw new BadRequestException(`The value ${memberTenantId} is not a valid ObjectId.`);
        }

        const tokenPayload = {
            memberTenantId: memberTenantId,
            enrollmentId: enrollmentId,
        };

        const tenantToken = this.generateJwt({
            payload: tokenPayload,
            expires: 10 * 24 * 60 * 60, // Token expira en 10 días
        });

        return { token: tenantToken };
    }

    /**
     * Genera un token JWT.
     * @param options.payload - Información que se incluirá en el token.
     * @param options.expires - Tiempo de expiración del token en segundos o como cadena de texto.
     * @returns El token JWT firmado.
     */
    public generateJwt({
        payload,
        expires,
    }: {
        payload: jwt.JwtPayload;
        expires: number | string;
    }): string {
        return this.jwtService.sign(payload, {
            secret: this.configService.get<string>('secret_key_jwt'),
            expiresIn: expires,
        });
    }

    /**
     * Decodifica un token JWT y verifica si ha expirado.
     * @param token - Token JWT a decodificar.
     * @returns IEnrollmentToken con el enrollmentId y el estado de expiración o una cadena indicando un token inválido.
     */
    public decodeJwt(token: string): IEnrollmentToken | string {
        try {
            const decodedToken = jwt.decode(token) as EnrollmentTokenResult;

            if (!decodedToken) {
                throw new Error('El token no se puede decodificar');
            }

            const { enrollmentId, memberTenantId, exp } = decodedToken;

            if (!enrollmentId || !memberTenantId) {
                throw new Error('El token no contiene enrollmentId o memberTenantId válido');
            }

            const currentDate = new Date().getTime() / 1000;
            const isExpired = exp <= currentDate;

            return {
                enrollmentId: decodedToken.enrollmentId,
                memberTenantId: decodedToken.memberTenantId,
                isExpired,
            };
        } catch (error) {
            console.error('Error al decodificar el JWT de tenant:', error);
            return 'Token inválido';
        }
    }
}

