// import {
//     BadRequestException,
//     CanActivate,
//     ExecutionContext,
//     Injectable,
//     UnauthorizedException
// } from '@nestjs/common';
// import { Request } from 'express';
// import { TenantService } from '../services/tenant.service';

// @Injectable()
// export class TokenTenantGuard implements CanActivate {
//     constructor(
//         private readonly tenantService: TenantService,
//     ) { }

//     /**
//      * Valida si una solicitud contiene un token de tenant válido.
//      * @param context - El contexto de ejecución de la solicitud.
//      * @returns Un valor booleano que indica si la solicitud está autenticada.
//      * @throws BadRequestException si el token no se proporciona o es inválido.
//      * @throws UnauthorizedException si el token ha expirado o el tenant no es válido.
//      */
//     public async canActivate(context: ExecutionContext): Promise<boolean> {
//         const req = context.switchToHttp().getRequest<Request>();

//         // Paso 1: Extraer y validar el token del tenant
//         const token = req.headers['tenant-token'];
//         if (!token || Array.isArray(token)) {
//             throw new BadRequestException(
//                 'El token de tenant es inválido o no se proporcionó.',
//             );
//         }

//         const decodedToken = this.tenantService.decodeJwt(token);
//         if (typeof decodedToken === 'string') {
//             throw new UnauthorizedException(decodedToken); // El token es inválido
//         }

//         if (decodedToken.isExpired) {
//             throw new UnauthorizedException('El token de tenant ha expirado.');
//         }

//         const { tenantId, memberTenantId } = decodedToken;

//         if (!tenantId || !memberTenantId) {
//             throw new UnauthorizedException('Información de tenant inválida en el token.');
//         }

//         req.tenantId = tenantId;
//         req.memberTenantId = memberTenantId;

//         return true;
//     }
// }


import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';
import { Request } from 'express';
import { TenantService } from '../services/tenant.service';
import { ITenantToken } from '../interface/IToken-tenant.interface';

@Injectable()
export class TokenTenantGuard implements CanActivate {
    constructor(
        private readonly tenantService: TenantService,
    ) { }

    /**
     * Valida si una solicitud (HTTP o WebSocket) contiene un token de tenant válido.
     * @param context - El contexto de ejecución de la solicitud.
     * @returns Un valor booleano que indica si la solicitud está autenticada.
     * @throws BadRequestException si el token no se proporciona o es inválido.
     * @throws UnauthorizedException si el token ha expirado o el tenant no es válido.
     */
    public async canActivate(context: ExecutionContext): Promise<boolean> {
        // Verifica si el contexto es WebSocket o HTTP
        const isWs = context.switchToWs;
        const req = context.switchToHttp().getRequest<Request>();
        const clientWB = isWs ? context.switchToWs().getClient() : null;

        // Paso 1: Extraer y validar los tokens, según el tipo de solicitud (HTTP o WebSocket)
        const token = req.headers['tenant-token'];  // Para solicitudes HTTP
        const tokenWB = clientWB ? clientWB.handshake.headers['tenant-token'] : null;  // Para WebSocket

        if (!token && !tokenWB || (Array.isArray(token) || Array.isArray(tokenWB))) {
            throw new BadRequestException('El token de tenant es inválido o no se proporcionó.');
        }

        // Paso 2: Decodificar y validar los tokens (uno u otro según la solicitud)
        const decodedToken = token ? this.tenantService.decodeJwt(token) : null;
        const decodedTokenWB = tokenWB ? this.tenantService.decodeJwt(tokenWB) : null;

        if ((token && typeof decodedToken === 'string') || (tokenWB && typeof decodedTokenWB === 'string')) {
            throw new UnauthorizedException('El token es inválido.');
        }

        if ((decodedToken && (decodedToken as ITenantToken).isExpired) || (decodedTokenWB && (decodedTokenWB as ITenantToken).isExpired)) {
            throw new UnauthorizedException('El token de tenant ha expirado.');
        }

        // Paso 3: Extraer la información relevante de los tokens
        const { tenantId, memberTenantId } = (decodedToken as ITenantToken) || {};
        const { tenantId: tenantIdWB, memberTenantId: memberTenantIdWB } = (decodedTokenWB as ITenantToken) || {};

        // Verificar que los tokens contienen la información necesaria
        if (!tenantId && !tenantIdWB || !memberTenantId && !memberTenantIdWB) {
            throw new UnauthorizedException('Información de tenant inválida en el token.');
        }

        // Paso 4: Establecer los valores en la solicitud o el cliente WebSocket
        if (req) {
            req.tenantId = tenantId;
            req.memberTenantId = memberTenantId;
        }

        if (clientWB) {
            clientWB.tenantId = tenantIdWB;
            clientWB.memberTenantId = memberTenantIdWB;
        }

        return true;  // La validación fue exitosa
    }
}
