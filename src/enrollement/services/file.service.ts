import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { createReadStream } from 'fs';
import { Worker } from 'worker_threads';
import * as csvParser from 'fast-csv';
import * as path from 'path';

@Injectable()
export class FileService {
    /**
     * Procesa un archivo Excel en streaming.
     * @param filePath - Ruta del archivo Excel.
     */
    async processExcel(filePath: string): Promise<void> {
        const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {});

        for await (const worksheet of workbook) {
            let isFirstRow = true;
            const batch: any[] = [];
            const batchSize = 1000; // Lote de 1000 filas

            for await (const row of worksheet) {
                if (isFirstRow) {
                    // Valida las columnas en la primera fila
                    const headers = Array.isArray(row.values) ? row.values.slice(1).filter(value => typeof value === 'string') as string[] : [];
                    if (!this.validateHeaders(headers)) {
                        throw new InternalServerErrorException('Las columnas del archivo no son válidas');
                    }
                    isFirstRow = false;
                } else {
                    // Procesa filas normales
                    const rowData = Array.isArray(row.values) ? row.values.slice(1) : [];
                    batch.push(rowData);

                    if (batch.length >= batchSize) {
                        await this.processBatch(batch);
                        batch.length = 0; // Limpia el lote después de procesarlo
                    }
                }
            }

            // Procesa cualquier fila restante
            if (batch.length > 0) {
                await this.processBatch(batch);
            }
        }
    }

    /**
     * Procesa un archivo CSV en streaming.
     * @param filePath - Ruta del archivo CSV.
     */
    async processCSV(filePath: string): Promise<void> {
        const stream = createReadStream(filePath);
        const batch: any[] = [];
        const batchSize = 1000; // Lote de 1000 filas

        return new Promise((resolve, reject) => {
            stream
                .pipe(csvParser.parse({ headers: true }))
                .on('data', (row) => {
                    batch.push(row);

                    if (batch.length >= batchSize) {
                        this.processBatch(batch)
                            .then(() => batch.length = 0) // Limpia el lote después de procesarlo
                            .catch((err) => reject(err));
                    }
                })
                .on('end', async () => {
                    // Procesa cualquier fila restante
                    if (batch.length > 0) {
                        await this.processBatch(batch);
                    }
                    resolve();
                })
                .on('error', (error) => {
                    reject(new InternalServerErrorException(`Error al procesar CSV: ${error.message}`));
                });
        });
    }

    /**
     * Valida las columnas del archivo.
     * @param headers - Columnas del archivo.
     * @returns `true` si las columnas son válidas.
     */
    validateHeaders(headers: string[]): boolean {
        const requiredHeaders = ['nombre', 'dni', 'fechaNacimiento', 'nacionalidad'];
        return requiredHeaders.every((header) => headers.includes(header));
    }

    /**
     * Procesa un lote de datos utilizando un worker thread.
     * @param batch - Lote de filas a procesar.
     */
    async processBatch(batch: any[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const workerPath = path.resolve(__dirname, '../../workers/file.worker.ts');
            const worker = new Worker(workerPath, { workerData: batch });

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
