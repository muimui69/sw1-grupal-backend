import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { RekognitionClient, CompareFacesCommand } from '@aws-sdk/client-rekognition';
import * as fs from 'fs/promises';
import path, { join } from 'path';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Enrollment } from 'src/enrollment/entities/enrollment.entity';
import { CohereService } from '../../cohere/services/cohere.service';
import { Worker } from 'worker_threads';

@Injectable()
export class AwsService {
    private readonly rekognitionClient: RekognitionClient;
    private readonly textractClient: TextractClient;
    private readonly tempDir = join('./temp');

    constructor(
        private readonly configService: ConfigService,
        private readonly cohereService: CohereService,
        @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<Enrollment>
    ) {
        this.rekognitionClient = new RekognitionClient({
            region: this.configService.get<string>('aws_region'),
            credentials: {
                accessKeyId: this.configService.get<string>('aws_access_key_id'),
                secretAccessKey: this.configService.get<string>('aws_secret_access_key'),
            },
        });

        this.textractClient = new TextractClient({
            region: this.configService.get<string>('aws_region'),
            credentials: {
                accessKeyId: this.configService.get<string>('aws_access_key_id'),
                secretAccessKey: this.configService.get<string>('aws_secret_access_key'),
            },
        });

        this.initializeTempDir();
    }

    /**
     * Procesa el documento del usuario y realiza la validación completa.
     * @param frontBuffer - Buffer del anverso del documento.
     * @param backBuffer - Buffer del reverso del documento.
     * @param tenantId - ID del tenant.
     * @returns Información validada del usuario.
     */
    async processAndValidateDocument(frontBuffer: Buffer, backBuffer: Buffer, tenantId: string) {
        // try {
        // 1. Extraer texto del anverso y reverso
        const frontText = await this.extractTextFromDocument(frontBuffer);
        const backText = await this.extractTextFromDocument(backBuffer);

        // 2. Combinar los textos extraídos
        const combinedText = [...frontText, ...backText];

        // 3. Realizar el match dinámico con Cohere
        const matchedFields = await this.matchFieldsWithEnrollment(combinedText, tenantId);

        // 4. Buscar el usuario en la base de datos
        const matchedEnrollment = await this.findEnrollmentByMatchedFields(matchedFields, tenantId);

        return { matchedFields, matchedEnrollment };
        // } catch (error) {
        // throw new InternalServerErrorException(`Error al procesar y validar el documento: ${error.message}`);
        // }
    }

    private async initializeTempDir(): Promise<void> {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.error('Error al crear el directorio temporal:', error.message);
        }
    }

    async saveTempFile(fileBuffer: Buffer, fileNamePrefix: string, extension: string): Promise<string> {
        const filePath = join(this.tempDir, `${fileNamePrefix}-${Date.now()}.${extension}`);
        try {
            await fs.writeFile(filePath, fileBuffer);
            return filePath;
        } catch (error) {
            throw new InternalServerErrorException('Error al guardar el archivo temporal');
        }
    }

    async deleteFromTempStorage(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Error al eliminar archivo temporal:', error.message);
        }
    }

    async extractTextFromDocument(documentBuffer: Buffer): Promise<string[]> {
        try {
            const command = new DetectDocumentTextCommand({
                Document: { Bytes: documentBuffer },
            });
            const result = await this.textractClient.send(command);
            return result.Blocks.filter(block => block.BlockType === 'LINE').map(block => block.Text || '');
        } catch (error) {
            throw new InternalServerErrorException('Error al extraer texto del documento');
        }
    }

    async compareFacesWithDocument(
        frontBuffer: Buffer,
        backBuffer: Buffer,
        selfieBuffer: Buffer,
    ): Promise<boolean> {
        try {
            // Priorizar la comparación con el anverso
            const frontMatch = await this.compareFacesBuffer(frontBuffer, selfieBuffer);

            // Si no hay coincidencia con el anverso, intentar con el reverso
            if (!frontMatch) {
                const backMatch = await this.compareFacesBuffer(backBuffer, selfieBuffer);
                return backMatch; // Resultado de la comparación con el reverso
            }

            return frontMatch; // Coincidencia con el anverso
        } catch (error) {
            throw new InternalServerErrorException('Error al comparar las fotos del documento con la selfie, intenta de nuevo');
        }
    }

    async compareFacesBuffer(sourceBuffer: Buffer, targetBuffer: Buffer): Promise<boolean> {
        try {
            const command = new CompareFacesCommand({
                SourceImage: { Bytes: sourceBuffer },
                TargetImage: { Bytes: targetBuffer },
                SimilarityThreshold: 80,
            });

            const result = await this.rekognitionClient.send(command);

            return result.FaceMatches && result.FaceMatches.length > 0;
        } catch (error) {
            throw new InternalServerErrorException('Error al comparar las fotos');
        }
    }


    async matchFieldsWithEnrollment(extractedText: string[], tenantId: string): Promise<Record<string, string>> {
        const expectedFields = await this.getExpectedFields();
        return await this.cohereService.matchFields(extractedText, expectedFields);
    }

    async getExpectedFields(): Promise<string[]> {
        const sampleDocument = await this.enrollmentModel.findOne().lean();
        if (!sampleDocument) {
            throw new InternalServerErrorException('No se encontraron documentos en la colección de empadronamientos.');
        }

        return Object.keys(sampleDocument).filter(
            key => !['_id', '__v', 'tenant', 'user', 'createdAt', 'updatedAt'].includes(key)
        );
    }

    /**
    * Encuentra un empadronamiento utilizando campos coincidentes en un worker thread.
    * @param matchedFields - Campos que coinciden con los datos extraídos.
    * @param tenantId - ID del tenant.
    * @returns Promesa que resuelve con el empadronamiento encontrado.
    */
    async findEnrollmentByMatchedFields(matchedFields: Record<string, string>, tenantId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const workerPath = path.resolve(__dirname, '../workers/enrollment.worker.js');

            const worker = new Worker(workerPath, {
                workerData: {
                    batch: [matchedFields],
                    tenantId,
                },
            });

            worker.on('message', (message) => {
                if (message.success) {
                    if (message.results.length > 0 && message.results[0].success) {
                        resolve(message.results[0]); // Devolver la coincidencia encontrada
                    } else {
                        reject(new NotFoundException('No se encontró un usuario con los datos proporcionados.'));
                    }
                } else {
                    reject(new NotFoundException(message.error));
                }
            });

            worker.on('error', (error) => {
                console.error('Error en el worker:', error.message);
                reject(new InternalServerErrorException(`Error en el worker: ${error.message}`));
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new InternalServerErrorException(`El worker finalizó con el código ${code}`));
                }
            });
        });
    }
}
