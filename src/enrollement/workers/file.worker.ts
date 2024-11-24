import { parentPort, workerData } from 'worker_threads';
import { connect, model, Schema } from 'mongoose';

// Conexión a MongoDB
(async () => {
    await connect('mongodb://localhost:27017/voting-security'); // Cambia la URI si es necesario
})();

// Define un esquema dinámico
const enrollmentSchema = new Schema({}, { strict: false });
const Enrollment = model('Enrollment', enrollmentSchema);

/**
 * Procesa un lote de datos y los inserta en MongoDB.
 * @param batch - Lote de filas a procesar.
 * @param headers - Encabezados del archivo.
 */
async function processBatch(batch: any[], headers: string[]) {
    console.log(`Procesando lote de ${batch.length} filas en el worker...`);

    const bulkOps = batch.map(row => {
        const document: any = {};
        headers.forEach((header, index) => {
            document[header] = row[index]; // Mapear cada valor de la fila al encabezado
        });
        return { insertOne: { document } };
    });

    try {
        // Inserta los datos en MongoDB
        await Enrollment.bulkWrite(bulkOps);
        console.log(`Lote procesado e insertado con éxito.`);
    } catch (error) {
        console.error(`Error al insertar datos: ${error.message}`);
        throw error;
    }
}

(async () => {
    try {
        const { batch, headers } = workerData;
        if (!batch || !headers) {
            throw new Error("Datos insuficientes para procesar");
        }
        await processBatch(batch, headers);
        parentPort?.postMessage({ success: true, message: `Lote procesado con ${batch.length} filas.` });
    } catch (error) {
        parentPort?.postMessage({ success: false, error: error.message });
    }
})();
