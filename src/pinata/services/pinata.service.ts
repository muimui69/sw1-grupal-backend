import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Multer } from 'multer';
import PinataSDK from '@pinata/sdk';
import { Readable } from 'stream';
import { IPinataResponse } from '../interfaces';

@Injectable()
export class PinataService {
  private readonly pinata: PinataSDK;
  private readonly pinataApiKey: string;
  private readonly pinataSecretApiKey: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.pinataApiKey = this.configService.get<string>('pinata_api_key');
    this.pinataSecretApiKey = this.configService.get<string>('pinata_api_secret');
    this.pinata = new PinataSDK(this.pinataApiKey, this.pinataSecretApiKey);
  }

  /**
   * Sube un archivo a Pinata.
   * @param file - El archivo a subir.
   * @returns La respuesta de Pinata con el CID y la URL del archivo.
   */
  async uploadFile(file: Multer.File): Promise<IPinataResponse> {
    try {
      // Validar que el archivo esté correctamente recibido
      this.validateFile(file);

      // Crear un stream legible con el buffer del archivo
      const readableStream = this.createReadableStream(file.buffer);

      // Configurar los metadatos del archivo para Pinata
      const options = this.createPinataMetadata(file.originalname);

      // Subir el archivo a Pinata
      const result = await this.pinata.pinFileToIPFS(readableStream, options);

      // Obtener la URL del archivo desde su CID
      const fileUrl = await this.getFileUrl(result.IpfsHash);

      return {
        cid: result.IpfsHash,
        fileUrl,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al subir archivo a Pinata: ${error.message}`,
      );
    }
  }

  /**
   * Valida la estructura del archivo recibido.
   * @param file - El archivo a validar.
   */
  private validateFile(file: Multer.File): void {
    if (!file || !file.buffer || !file.originalname) {
      throw new InternalServerErrorException('Archivo inválido o incompleto.');
    }
  }

  /**
   * Crea un stream legible a partir del buffer del archivo.
   * @param buffer - El buffer del archivo.
   * @returns El stream legible.
   */
  private createReadableStream(buffer: Buffer): Readable {
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    return readableStream;
  }

  /**
   * Crea los metadatos necesarios para Pinata.
   * @param fileName - Nombre original del archivo.
   * @returns Los metadatos configurados para el archivo.
   */
  private createPinataMetadata(fileName: string) {
    return {
      pinataMetadata: {
        name: fileName,
      },
    };
  }

  /**
   * Obtiene la URL pública del archivo subido a IPFS.
   * @param cid - El CID del archivo en IPFS.
   * @returns La URL pública del archivo.
   */
  async getFileUrl(cid: string): Promise<string> {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
}
