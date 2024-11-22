import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { CID } from 'multiformats/cid';

@Injectable()
export class HeliaService {
  private helia;
  private fs;

  constructor() {
    // this.initializeHelia();
  }

  // private async initializeHelia() {
  //   try {
  //     this.helia = await createHelia();
  //     this.fs = unixfs(this.helia);
  //   } catch (error) {
  //     throw new InternalServerErrorException('Error initializing Helia');
  //   }
  // }

  // /**
  //  * Subir archivo a Helia (IPFS)
  //  * @param fileBuffer - Buffer del archivo a subir.
  //  * @returns CID del archivo subido.
  //  */
  // public async uploadFile(fileBuffer: Buffer): Promise<string> {
  //   try {
  //     const cid = await this.fs.addBytes(fileBuffer);
  //     return cid.toString();
  //   } catch (error) {
  //     throw new InternalServerErrorException('Error uploading file to Helia');
  //   }
  // }

  // /**
  //  * Descargar archivo de Helia (IPFS)
  //  * @param cid - CID del archivo a descargar.
  //  * @returns Buffer del archivo descargado.
  //  */
  // public async downloadFile(cid: string): Promise<Buffer> {
  //   try {
  //     const fileCID = CID.parse(cid);
  //     const chunks = [];
  //     for await (const chunk of this.fs.cat(fileCID)) {
  //       chunks.push(chunk);
  //     }
  //     return Buffer.concat(chunks);
  //   } catch (error) {
  //     throw new InternalServerErrorException('Error downloading file from Helia');
  //   }
  // }
}
