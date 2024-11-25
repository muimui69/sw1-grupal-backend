import { parentPort, workerData } from 'worker_threads';
import { connect, isValidObjectId, model, Schema, Types } from 'mongoose';

// Conexión a MongoDB
(async () => {
    await connect('mongodb://localhost:27017/voting-security'); // Cambia la URI si es necesario
})();

// Define el esquema de `Enrollment`
const enrollmentSchema = new Schema(
    {
        tenant: { type: Types.ObjectId, ref: 'Tenant', required: true },
        user: { type: Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true, strict: false } // Permitir campos dinámicos en los documentos
);

const Enrollment = model('Enrollment', enrollmentSchema);

// Reutilización del esquema `Member` sin redefinir lógica de negocio
const MemberTenant = model(
    'MemberTenant',
    new Schema({
        user: { type: Types.ObjectId, ref: 'User', required: true },
        tenant: { type: Types.ObjectId, ref: 'Tenant', required: true },
    })
);


/**
 * Verifica si un usuario pertenece a un tenant.
 * @param userId - ID del usuario.
 * @param tenantId - ID del tenant.
 * @returns `true` si el usuario pertenece al tenant, `false` en caso contrario.
 */
async function isUserMemberOfTenant(userId: string, tenantId: string): Promise<boolean> {
    const member = await MemberTenant.findOne({
        user: new Types.ObjectId(userId),
        tenant: new Types.ObjectId(tenantId),
    }).exec();
    return !!member;
}

/**
 * Procesa un lote de datos y los inserta en MongoDB.
 * @param batch - Lote de filas a procesar.
 * @param headers - Encabezados del archivo.
 * @param tenantId - ID del Tenant al que pertenece el lote.
 * @param userId - ID del Usuario que sube el lote.
 */
async function processBatch(batch: any[], headers: string[], userId: string, tenantId: string,) {
    console.log(`Procesando lote de ${batch.length} filas para Tenant ${tenantId} y User ${userId}...`);

    const isMember = await isUserMemberOfTenant(userId, tenantId);
    if (!isMember) {
        throw new Error(`El usuario ${userId} no pertenece al tenant ${tenantId}`);
    }

    const bulkOps = batch.map((row) => {
        const document: any = {
            user: userId,
            tenant: tenantId,
        };
        headers.forEach((header, index) => {
            document[header] = row[index];
        });
        return { insertOne: { document } };
    });

    try {
        await Enrollment.bulkWrite(bulkOps);
        console.log(`Lote procesado e insertado con éxito.`);
    } catch (error) {
        console.error(`Error al insertar datos: ${error.message}`);
        throw error;
    }
}

(async () => {
    try {
        const { batch, headers, userId, tenantId } = workerData;
        if (!batch || !headers || !userId || !tenantId) {
            throw new Error('Datos insuficientes para procesar');
        }

        if (!isValidObjectId(userId) || !isValidObjectId(tenantId)) {
            throw new Error('ID de Usuario o Tenant inválido');
        }

        await processBatch(batch, headers, userId, tenantId);
        parentPort?.postMessage({ success: true, message: `Lote procesado con ${batch.length} filas.` });
    } catch (error) {
        parentPort?.postMessage({ success: false, error: error.message });
    }
})();
