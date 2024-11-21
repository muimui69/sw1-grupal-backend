import {
    Injectable,
    CanActivate,
    ExecutionContext,
    BadRequestException
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { TenantService } from '../services/tenant.service';
import { Request } from 'express';

@Injectable()
export class TenantIdGuard implements CanActivate {
    constructor(private readonly tenantService: TenantService) { }

    /**
     * Valida si una solicitud contiene un Tenant ID válido y verifica su existencia.
     * @param context - El contexto de ejecución de la solicitud.
     * @returns Un valor booleano que indica si el Tenant ID es válido.
     * @throws BadRequestException si el Tenant ID no se proporciona, es inválido o no existe.
     */
    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>();

        // Paso 1: Extraer el Tenant ID de los encabezados
        const tenantId = req.headers['tenant-id'];

        // Validación: El Tenant ID debe estar presente
        if (!tenantId) {
            throw new BadRequestException('El Tenant ID es obligatorio.');
        }

        // Validación: El Tenant ID debe ser una cadena válida y un ObjectId válido
        if (
            typeof tenantId !== 'string' ||
            tenantId.trim() === '' ||
            !isValidObjectId(tenantId)
        ) {
            throw new BadRequestException('El Tenant ID no es válido.');
        }

        // Paso 2: Verificar la existencia del Tenant en la base de datos
        const tenantExists = await this.tenantService.findTenantById(tenantId);
        if (!tenantExists) {
            throw new BadRequestException('El Tenant ID no existe.');
        }

        // Paso 3: Adjuntar el Tenant ID al objeto de la solicitud para su procesamiento posterior
        req.tenantId = tenantId;

        return true;
    }
}
