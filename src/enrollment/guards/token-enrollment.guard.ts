import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { EnrollmentService } from '../services/enrollment.service';

@Injectable()
export class TokenEnrollmentGuard implements CanActivate {
    constructor(
        private readonly enrollmentService: EnrollmentService,  // Asegúrate de tener el servicio de Enrollment
    ) { }

    /**
     * Valida si una solicitud contiene un token de autenticación válido con un enrollmentId.
     * @param context - El contexto de ejecución de la solicitud.
     * @returns Un valor booleano que indica si la solicitud está autenticada con un enrollmentId válido.
     * @throws BadRequestException si el token no se proporciona o es inválido.
     * @throws UnauthorizedException si el token ha expirado o el enrollmentId no existe.
     */
    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>();

        const token = req.headers['enrollment-token'];
        if (!token || Array.isArray(token)) {
            throw new BadRequestException(
                'El token de autenticación es inválido o no se proporcionó.',
            );
        }

        const decodedToken = this.enrollmentService.decodeJwt(token);
        if (typeof decodedToken === 'string') {
            throw new UnauthorizedException(decodedToken); // El token es inválido
        }

        if (decodedToken.isExpired) {
            throw new UnauthorizedException('El token de enrollment ha expirado.');
        }

        const { enrollmentId, memberTenantId } = decodedToken;

        if (!enrollmentId) {
            throw new UnauthorizedException('Información de tenant inválida en el token.');
        }

        req.enrollmentId = enrollmentId;
        req.memberTenantId = memberTenantId;

        return true;
    }
}
