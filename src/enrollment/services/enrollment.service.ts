import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Worker } from 'worker_threads';
import * as path from 'path';
import { promises as fs } from 'fs';
import * as fastCsv from 'fast-csv';

@Injectable()
export class EnrollmentService {
    private readonly tempDir = path.join('./temp');

    constructor() {
        fs.mkdir(this.tempDir, { recursive: true }).catch(console.error);
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
     * 
     * @param row - Objeto que representa una fila del CSV, donde las claves son los encabezados y los valores son los datos de esa fila.
     * @param headers - Array de cadenas que representan los encabezados esperados para la asociación con los datos de la fila.
     * @returns Un objeto donde cada clave es un encabezado y su valor es el dato correspondiente de la fila.
     *
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
}
