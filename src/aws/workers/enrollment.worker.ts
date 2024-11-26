import { parentPort, workerData } from 'worker_threads';
import { connect, isValidObjectId, model, Schema, Types } from 'mongoose';

// Conexión a MongoDB
(async () => {
    // await connect('mongodb://localhost:27017/voting-security'); // Cambia la URI si es necesario
    await connect(process.env.DATABASE_URL!!); // Cambia la URI si es necesario
})();

// Define el esquema de `Enrollment`
const enrollmentSchema = new Schema(
    {
        tenant: { type: Types.ObjectId, ref: 'Tenant', required: true },
    },
    { timestamps: true, strict: false } // Permitir campos dinámicos en los documentos
);

const Enrollment = model('Enrollment', enrollmentSchema);

/**
 * Procesa un lote de datos para buscar coincidencias en la colección `Enrollment`.
 * @param batch - Lote de filas a procesar.
 * @param tenantId - ID del Tenant al que pertenece el lote.
 */
async function processBatch(batch: Record<string, string>[], userId: string, tenantId: string) {
    console.log(`Procesando lote de ${batch.length} filas para Tenant ${tenantId}...`);

    const results = [];
    for (const row of batch) {
        const matchedField = Object.keys(row).find(async (field) => {
            const value = row[field]?.trim();
            if (value) {
                const enrollment = await Enrollment.findOne({
                    user: userId,
                    tenant: tenantId,
                    [field]: value,
                }).exec();

                return !!enrollment; // Retorna true si se encontró una coincidencia
            }
            return false;
        });

        if (matchedField) {
            results.push({ success: true, matchedField: row[matchedField] });
        } else {
            results.push({ success: false, error: `No se encontró coincidencia para la fila: ${JSON.stringify(row)}` });
        }
    }

    return results;
}

// Lógica principal del worker
(async () => {
    try {
        const { batch, userId, tenantId } = workerData;
        if (!batch || !tenantId) {
            throw new Error('Datos insuficientes para procesar');
        }

        if (!isValidObjectId(userId) || !isValidObjectId(tenantId)) {
            throw new Error('ID de Usuario o Tenant inválido');
        }

        const results = await processBatch(batch, userId, tenantId);
        parentPort?.postMessage({ success: true, results });
    } catch (error) {
        console.error(`Error en el worker: ${error.message}`);
        parentPort?.postMessage({ success: false, error: error.message });
    }
})();
