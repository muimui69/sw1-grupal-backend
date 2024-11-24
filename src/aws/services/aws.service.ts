import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { RekognitionClient, CompareFacesCommand } from '@aws-sdk/client-rekognition';

@Injectable()

@Injectable()
export class AwsService {
    private rekognitionClient: RekognitionClient;
    private textractClient: TextractClient;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.rekognitionClient = new RekognitionClient({
            region: this.configService.get<string>('aws_region'),
            credentials: {
                accessKeyId: this.configService.get<string>('aws_access_key_id'),
                secretAccessKey: this.configService.get<string>('aws_secret_access_key'),
            }
        });

        this.textractClient = new TextractClient({
            region: this.configService.get<string>('aws_region'),
            credentials: {
                accessKeyId: this.configService.get<string>('aws_access_key_id'),
                secretAccessKey: this.configService.get<string>('aws_secret_access_key'),
            }
        });
    }

    /**
     * Extrae texto de un documento utilizando AWS Textract.
     * @param documentBuffer - Buffer del documento subido.
     */
    async extractTextFromDocument(documentBuffer: Buffer): Promise<string[]> {
        try {
            const command = new DetectDocumentTextCommand({
                Document: {
                    Bytes: documentBuffer
                }
            });
            const result = await this.textractClient.send(command);
            return result.Blocks.filter(block => block.BlockType === 'LINE').map(block => block.Text || '');
        } catch (error) {
            throw new InternalServerErrorException('Error al extraer texto del documento');
        }
    }

    /**
     * Compara la foto del dueño con la foto en el documento.
     * @param sourceImageBuffer - Buffer de la foto extraída del documento.
     * @param targetImageBuffer - Buffer de la foto del dueño.
     */
    async compareFaces(sourceImageBuffer: Buffer, targetImageBuffer: Buffer): Promise<boolean> {
        try {
            const command = new CompareFacesCommand({
                SourceImage: { Bytes: sourceImageBuffer },
                TargetImage: { Bytes: targetImageBuffer },
                SimilarityThreshold: 80,
            });
            const result = await this.rekognitionClient.send(command);
            return result.FaceMatches && result.FaceMatches.length > 0;
        } catch (error) {
            throw new InternalServerErrorException('Error al comparar las fotos');
        }
    }
}
