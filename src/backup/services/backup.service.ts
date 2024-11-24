import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { join } from 'path';

@Injectable()
export class BackupService {
    private readonly logger = new Logger(BackupService.name);
    private readonly backupPath = join('./backups');

    constructor() {
        // Crea la carpeta de backups si no existe
        if (!require('fs').existsSync(this.backupPath)) {
            require('fs').mkdirSync(this.backupPath, { recursive: true });
        }
    }

    /**
     * Realiza un backup de la base de datos usando `mongodump`.
     */
    async createBackup(): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = join(this.backupPath, `backup-${timestamp}`);
        const mongoUri = 'mongodb://localhost:27017/voting-security';

        const command = `mongodump --uri="${mongoUri}" --out="${backupDir}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                this.logger.error(`Error al realizar el backup: ${stderr}`);
                throw new InternalServerErrorException('Error al realizar el backup');
            }

            this.logger.log(`Backup creado exitosamente en: ${backupDir}`);
        });
    }
}
