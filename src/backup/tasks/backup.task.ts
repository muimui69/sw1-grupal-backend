import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BackupService } from '../services/backup.service';

@Injectable()
export class BackupTask {
    constructor(private readonly backupService: BackupService) { }

    /**
     * Tarea programada para realizar el backup diariamente a las 2:00 AM.
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleDatabaseBackup() {
        try {
            await this.backupService.createBackup();
        } catch (error) {
            console.error('Error en la tarea de backup:', error.message);
        }
    }
}
