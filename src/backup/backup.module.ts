import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './services/backup.service';
import { BackupTask } from './tasks/backup.task';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [BackupService, BackupTask],
})
export class BackupModule { }
