import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Multer } from 'multer';

/**
 * Servicio para manejar la carga de imágenes en Cloudinary.
 */
@Injectable()
export class CloudinaryService {
    constructor(
        @Inject('Cloudinary') private readonly cloudinaryInstance: typeof cloudinary
    ) { }

    /**
     * Sube una imagen a Cloudinary.
     * @param file Archivo de tipo Multer.File que contiene el buffer de la imagen.
     * @returns Una promesa que resuelve con la respuesta de la API de Cloudinary.
     */
    public async uploadImage(file: Multer.File): Promise<UploadApiResponse> {
        if (!file || !file.buffer) {
            throw new BadRequestException('El archivo es inválido o está vacío.');
        }

        return new Promise((resolve, reject) => {
            this.cloudinaryInstance.uploader.upload_stream(
                { folder: 'uploads' }, // Carpeta donde se almacenarán las imágenes en Cloudinary
                (error, result) => {
                    if (error) {
                        return reject(
                            new BadRequestException(
                                `Error al cargar la imagen en Cloudinary: ${error.message}`
                            )
                        );
                    }
                    resolve(result);
                },
            ).end(file.buffer);
        });
    }
}
