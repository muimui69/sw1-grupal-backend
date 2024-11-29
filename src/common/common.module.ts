import { Module } from '@nestjs/common';
import { LogsService } from './services';
import { LogsInterceptor } from './interceptors';

@Module({
    providers: [LogsService, LogsInterceptor],
    exports: [LogsService],
})
export class CommonModule { }
