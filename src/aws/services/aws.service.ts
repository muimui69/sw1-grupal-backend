import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { TenantService } from 'src/tenant/services/tenant.service';

@Injectable()
export class AwsService {
    private readonly rekognitionClient: RekognitionClient;
    private readonly textractClient: TextractClient;
    private readonly tempDir = join('./temp');

    constructor(
        private readonly configService: ConfigService,
        private readonly cohereService: CohereService,
        private readonly tenantService: TenantService,
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
    async processAndValidateDocument(frontBuffer: Buffer, backBuffer: Buffer, userId: string, tenantId: string) {
        await this.validateUserMembership(userId, tenantId);

        // 1. Extraer texto del anverso y reverso
        const frontText = await this.extractTextFromDocument(frontBuffer);
        const backText = await this.extractTextFromDocument(backBuffer);

        // 2. Combinar los textos extraídos
        const combinedText = [...frontText, ...backText];

        // 3. Realizar el match dinámico con Cohere
        const matchedFields = await this.matchFieldsWithEnrollment(combinedText);

        // 4. Buscar el usuario en la base de datos
        const matchedEnrollment = await this.findEnrollmentByMatchedFields(matchedFields, userId, tenantId);

        return { matchedFields, matchedEnrollment };
    }

    /**
     * Inicializa el directorio temporal.
     */
    private async initializeTempDir(): Promise<void> {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.error('Error al crear el directorio temporal:', error.message);
        }
    }

    /**
    * Extrae texto de un documento.
    * @param documentBuffer - Buffer del documento.
    * @returns Lista de líneas extraídas.
    */
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

    /**
    * Compara las caras del documento con una selfie.
    * @param userId - ID del usuario.
    * @param tenantId - ID del tenant.
    * @param frontBuffer - Buffer del anverso del documento.
    * @param backBuffer - Buffer del reverso del documento.
    * @param selfieBuffer - Buffer de la selfie.
    * @returns `true` si las caras coinciden; `false` de lo contrario.
    */
    async compareFacesWithDocument(
        userId: string,
        tenantId: string,
        frontBuffer: Buffer,
        backBuffer: Buffer,
        selfieBuffer: Buffer,
    ): Promise<boolean> {
        try {
            await this.validateUserMembership(userId, tenantId);
            const frontMatch = await this.compareFacesBuffer(frontBuffer, selfieBuffer);
            if (!frontMatch) {
                const backMatch = await this.compareFacesBuffer(backBuffer, selfieBuffer);
                return backMatch;
            }
            return frontMatch;
        } catch (error) {
            throw new InternalServerErrorException('Error al comparar las fotos del documento con la selfie, intenta de nuevo');
        }
    }

    /**
     * Compara dos imágenes utilizando AWS Rekognition.
     * @param sourceBuffer - Buffer de la imagen de origen.
     * @param targetBuffer - Buffer de la imagen de destino.
     * @returns `true` si las caras coinciden; `false` de lo contrario.
     */
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


    /**
     * Realiza la coincidencia de campos extraídos con los campos esperados del padrón.
     * @param extractedText - Lista de texto extraído del documento.
     * @returns Un objeto con los campos coincidentes.
     */
    async matchFieldsWithEnrollment(extractedText: string[]): Promise<Record<string, string>> {
        try {
            const expectedFields = await this.getExpectedFields(); // Obtener campos esperados
            return await this.cohereService.matchFields(extractedText, expectedFields);
        } catch (error) {
            throw new InternalServerErrorException(
                `Error al realizar la coincidencia de campos: ${error.message}`,
            );
        }
    }

    /**
     * Obtiene los campos esperados del modelo de empadronamiento.
     * @returns Una lista de los campos válidos.
     * @throws InternalServerErrorException si no se encuentran documentos en la colección.
     */
    async getExpectedFields(): Promise<string[]> {
        try {
            const sampleDocument = await this.enrollmentModel.findOne().lean(); // Obtener un documento de muestra
            if (!sampleDocument) {
                throw new InternalServerErrorException(
                    'No se encontraron documentos en la colección de empadronamientos.',
                );
            }

            // Filtrar claves válidas, excluyendo las que son internas o irrelevantes
            const excludedFields = ['_id', '__v', 'tenant', 'user', 'createdAt', 'updatedAt'];
            return Object.keys(sampleDocument).filter(
                (key) => !excludedFields.includes(key),
            );
        } catch (error) {
            throw new InternalServerErrorException(
                `Error al obtener campos esperados: ${error.message}`,
            );
        }
    }


    /**
    * Encuentra un empadronamiento utilizando campos coincidentes en un worker thread.
    * @param matchedFields - Campos que coinciden con los datos extraídos.
    * @param tenantId - ID del tenant.
    * @returns Promesa que resuelve con el empadronamiento encontrado.
    */
    async findEnrollmentByMatchedFields(matchedFields: Record<string, string>, userId: string, tenantId: string) {
        return new Promise((resolve, reject) => {
            const workerPath = path.resolve(__dirname, '../workers/enrollment.worker.js');

            const worker = new Worker(workerPath, {
                workerData: {
                    batch: [matchedFields],
                    userId,
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

    /**
     * Valida si el usuario es miembro del tenant.
     * @param userId ID del usuario.
     * @param tenantId ID del tenant.
     * @throws UnauthorizedException
     */
    private async validateUserMembership(userId: string, tenantId: string): Promise<void> {
        const isMember = await this.tenantService.isUserMemberOfTenant(userId, tenantId);
        if (!isMember) {
            throw new UnauthorizedException('No tienes permiso para acceder a este tenant.');
        }
    }
}
