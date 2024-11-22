import { Module } from '@nestjs/common';
import { LogsService } from './services/logs.service';
import { LogsInterceptor } from './interceptors/logs.Interceptor';

@Module({
    providers: [LogsService, LogsInterceptor],
    exports: [LogsService],
})
export class CommonModule { }
