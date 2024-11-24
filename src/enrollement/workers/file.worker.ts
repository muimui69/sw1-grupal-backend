import { parentPort, workerData } from 'worker_threads';

/**
 * Procesa un lote de datos.
 * @param batch - Lote de filas a procesar.
 */
async function processBatch(batch: any[]): Promise<void> {
    console.log(`Procesando lote de ${batch.length} filas en el worker...`);

    // Simulación de procesamiento (puedes reemplazar esto con lógica real, como validaciones o transformación de datos)
    for (const row of batch) {
        console.log(`Procesando fila: ${JSON.stringify(row)}`);
    }

    console.log(`Lote procesado con éxito en el worker.`);
}

(async () => {
    try {
        const batch = workerData;
        await processBatch(batch);
        parentPort?.postMessage({ success: true, message: `Lote procesado con ${batch.length} filas.` });
    } catch (error) {
        parentPort?.postMessage({ success: false, error: error.message });
    }
})();
