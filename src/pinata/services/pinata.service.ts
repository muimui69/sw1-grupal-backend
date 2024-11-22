import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Multer } from 'multer';
import PinataSDK from '@pinata/sdk';
import { Readable } from 'stream';
import { IPinataResponse } from '../interfaces/IPinata.interface';

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

  async uploadFile(file: Multer.File): Promise<IPinataResponse> {
    try {
      if (!file || !file.buffer || !file.originalname) {
        throw new InternalServerErrorException('Archivo inválido o incompleto.');
      }

      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);

      const options = {
        pinataMetadata: {
          name: file.originalname,
        },
      };

      const result = await this.pinata.pinFileToIPFS(readableStream, options);
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

  async getFileUrl(cid: string): Promise<string> {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
}
