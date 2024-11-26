import { parentPort, workerData } from 'worker_threads';
import { connect, model, Schema, Types } from 'mongoose';

// Conexión a MongoDB
(async () => {
    await connect('mongodb://localhost:27017/voting-security'); // Cambia la URI si es necesario
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
async function processBatch(batch: Record<string, string>[], tenantId: string) {
    console.log(`Procesando lote de ${batch.length} filas para Tenant ${tenantId}...`);

    const results = [];
    for (const row of batch) {
        const matchedField = Object.keys(row).find(async (field) => {
            const value = row[field]?.trim();
            if (value) {
                const enrollment = await Enrollment.findOne({
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
        const { batch, tenantId } = workerData;
        if (!batch || !tenantId) {
            throw new Error('Datos insuficientes para procesar');
        }

        const results = await processBatch(batch, tenantId);
        parentPort?.postMessage({ success: true, results });
    } catch (error) {
        console.error(`Error en el worker: ${error.message}`);
        parentPort?.postMessage({ success: false, error: error.message });
    }
})();
