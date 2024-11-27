import { parentPort, workerData } from 'worker_threads';
import { connect, isValidObjectId, model, Schema, Types } from 'mongoose';

// Conexión a MongoDB
(async () => {
    await connect(process.env.DATABASE_URL!!); // Asegúrate de tener la URL de la base de datos
})();

// Define el esquema de `Enrollment`
const enrollmentSchema = new Schema(
    {
        tenant: { type: Types.ObjectId, ref: 'Tenant', required: true },
        user: { type: Types.ObjectId, ref: 'User', required: true },  // Referencia al usuario
    },
    { timestamps: true, strict: false } // Permitir campos dinámicos en los documentos
);

const Enrollment = model('Enrollment', enrollmentSchema);

/**
 * Procesa un lote de datos para buscar coincidencias en la colección `Enrollment`.
 * @param batch - Lote de filas a procesar.
 * @param userId - ID del Usuario que se quiere verificar.
 * @param tenantId - ID del Tenant al que pertenece el usuario.
 */
async function processBatch(batch: Record<string, string>[], userId: string, tenantId: string) {
    console.log(`Procesando lote de ${batch.length} filas para Tenant ${tenantId}...`);

    const results = [];
    for (const row of batch) {
        const matchedFields = [];

        // Iterar sobre cada campo en la fila
        for (const field in row) {
            const value = row[field]?.trim();
            if (value) {
                // Buscar coincidencias en el `enrollment`
                const enrollment = await Enrollment.findOne({
                    user: userId,
                    tenant: tenantId,
                    [field]: { $regex: value, $options: 'i' }, // Usar regex para hacer búsqueda más flexible
                }).exec();

                if (enrollment) {
                    matchedFields.push({ field, value, enrollment });
                }
            }
        }

        let matchedDocumentId;
        if (matchedFields.length > 0) {
            matchedDocumentId = matchedFields[0].enrollment._id;
            results.push({ success: true, matchedFields, matchedDocumentId: String(matchedDocumentId) });
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
