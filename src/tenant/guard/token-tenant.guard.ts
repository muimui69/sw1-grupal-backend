import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';
import { Request } from 'express';
import { TenantService } from '../services/tenant.service';

@Injectable()
export class TokenTenantGuard implements CanActivate {
    constructor(
        private readonly tenantService: TenantService,
    ) { }

    /**
     * Valida si una solicitud contiene un token de tenant válido.
     * @param context - El contexto de ejecución de la solicitud.
     * @returns Un valor booleano que indica si la solicitud está autenticada.
     * @throws BadRequestException si el token no se proporciona o es inválido.
     * @throws UnauthorizedException si el token ha expirado o el tenant no es válido.
     */
    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>();

        // Paso 1: Extraer y validar el token del tenant
        const token = req.headers['tenant-token'];
        if (!token || Array.isArray(token)) {
            throw new BadRequestException(
                'El token de tenant es inválido o no se proporcionó.',
            );
        }

        const decodedToken = this.tenantService.decodeJwt(token);
        if (typeof decodedToken === 'string') {
            throw new UnauthorizedException(decodedToken); // El token es inválido
        }

        if (decodedToken.isExpired) {
            throw new UnauthorizedException('El token de tenant ha expirado.');
        }

        const { tenantId, memberTenantId } = decodedToken;

        if (!tenantId || !memberTenantId) {
            throw new UnauthorizedException('Información de tenant inválida en el token.');
        }

        req.tenantId = tenantId;
        req.memberTenantId = memberTenantId;

        return true;
    }
}
