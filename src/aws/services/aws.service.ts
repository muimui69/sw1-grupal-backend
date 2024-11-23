import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Rekognition, Textract } from 'aws-sdk';

@Injectable()

@Injectable()
export class AwsService {
    private rekognition: Rekognition;
    private textract: Textract;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.rekognition = new Rekognition({
            region: this.configService.get<string>('aws_region'),
            accessKeyId: this.configService.get<string>('aws_access_key_id'),
            secretAccessKey: this.configService.get<string>('aws_secret_access_key'),
        });

        this.textract = new Textract({
            region: this.configService.get<string>('aws_region'),
            accessKeyId: this.configService.get<string>('aws_access_key_id'),
            secretAccessKey: this.configService.get<string>('aws_secret_access_key'),
        });
    }

    /**
     * Extrae texto de un documento utilizando AWS Textract.
     * @param documentBuffer - Buffer del documento subido.
     */
    async extractTextFromDocument(documentBuffer: Buffer): Promise<string[]> {
        try {
            const params = {
                Document: {
                    Bytes: documentBuffer,
                },
            };

            const result = await this.textract.detectDocumentText(params).promise();
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
            const params = {
                SourceImage: { Bytes: sourceImageBuffer },
                TargetImage: { Bytes: targetImageBuffer },
                SimilarityThreshold: 80,
            };

            const result = await this.rekognition.compareFaces(params).promise();
            return result.FaceMatches && result.FaceMatches.length > 0;
        } catch (error) {
            throw new InternalServerErrorException('Error al comparar las fotos');
        }
    }
}
