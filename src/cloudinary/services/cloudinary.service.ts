import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Multer } from 'multer';

@Injectable()
export class CloudinaryService {
    constructor(@Inject('Cloudinary') private readonly cloudinaryInstance: typeof cloudinary) { }

    public async uploadImage(file: Multer.File): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            this.cloudinaryInstance.uploader.upload_stream(
                { folder: 'uploads' }, // Puedes cambiar el nombre de la carpeta si es necesario
                (error, result) => {
                    if (error) {
                        return reject(new BadRequestException('Error al cargar la imagen en Cloudinary'));
                    }
                    resolve(result);
                },
            ).end(file.buffer);
        });
    }
}
