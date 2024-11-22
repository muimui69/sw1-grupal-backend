import { Injectable } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class LogsService {
    private readonly logDirectory = './logs';
    private readonly logFilePath = join(this.logDirectory, 'activity.log');

    constructor() {
        // Asegurarse de que el directorio de logs exista
        if (!existsSync(this.logDirectory)) {
            mkdirSync(this.logDirectory);
        }
    }

    /**
     * Crea un registro en el archivo de logs.
     * @param logData - Datos del log que se va a guardar.
     */
    async createLog(logData: any): Promise<void> {
        try {
            const logEntry = `${logData.timestamp.toISOString()} - Tenant: ${logData.tenantId || 'N/A'
                }, User: ${logData.userId || 'N/A'}, IP: ${logData.ip}, Action: ${logData.action
                }, Details: ${JSON.stringify(logData.details)}\n`;

            // Agregar la entrada al archivo de logs
            appendFileSync(this.logFilePath, logEntry, { encoding: 'utf-8' });
        } catch (error) {
            console.error('Error al escribir en el archivo de logs:', error);
        }
    }
}
