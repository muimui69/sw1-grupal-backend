import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Enrollment } from '../entities/enrollement.entity';

@Injectable()
export class EnrollementService {
  constructor(
    @InjectModel('Enrollment') private readonly enrollmentModel: Model<Enrollment>,
  ) { }

  /**
   * Crea documentos en MongoDB basados en los datos procesados.
   * @param headers - Columnas del archivo (ya normalizadas en camelCase).
   * @param data - Datos procesados.
   */
  async createEnrollment(headers: string[], data: any[]): Promise<void> {
    try {
      // Verifica si hay datos
      if (!data.length) {
        throw new InternalServerErrorException('No hay datos para insertar.');
      }

      // Inserta los datos usando bulk insert
      const bulkOps = data.map(row => {
        const document = {};
        headers.forEach((header, index) => {
          document[header] = row[index]; // Mapear cada valor de la fila al encabezado
        });
        return { insertOne: { document } };
      });

      await this.enrollmentModel.bulkWrite(bulkOps);
      console.log('Datos insertados con éxito en MongoDB.');
    } catch (error) {
      throw new InternalServerErrorException(`Error al insertar datos: ${error.message}`);
    }
  }
}
