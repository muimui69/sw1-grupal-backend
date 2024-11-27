import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LogsService } from '../services/logs.service';

@Injectable()
export class LogsInterceptor implements NestInterceptor {
    constructor(private readonly logsService: LogsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();

        res.on('finish', async () => {
            const tenant = req.headers['tenant-token'];
            const user = req.headers['auth-token'];

            if (!tenant || !user) {
                console.warn('No se registró el log porque faltan tenant-token o auth-token.');
                return;
            }

            const logData = {
                tenantId: req.tenantId,
                userId: req.userId,
                ip: req.ip,
                timestamp: new Date(),
                action: `${req.method} ${req.url}`,
                details: req.body,
            };

            await this.logsService.createLog(logData);
        });

        return next.handle();
    }
}
