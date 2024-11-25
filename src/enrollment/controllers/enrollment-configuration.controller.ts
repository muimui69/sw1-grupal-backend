import {
    Controller,
    Post,
    UseGuards,
    Req,
    Get,
    BadRequestException,
    HttpStatus,
} from '@nestjs/common';
import { TokenAuthGuard } from 'src/auth/guard';
import { TenantIdGuard } from 'src/tenant/guard';
import { Request } from 'express';
import { EnrollmentConfigurationService } from '../services/enrollment-configuration.service';

@Controller('enrollment/configuration')
export class EnrollmentConfigurationController {
    constructor(
        private readonly enrollmentConfigurationService: EnrollmentConfigurationService,
    ) { }

    /**
     * Crea una nueva configuración de empadronamiento para un usuario y tenant.
     * @param req - Objeto de la solicitud.
     * @returns La configuración creada.
     */
    @Post('create')
    @UseGuards(TokenAuthGuard, TenantIdGuard)
    async createEnrollmentConfig(@Req() req: Request) {
        const { userId, tenantId } = this.extractUserAndTenant(req);
        const config = await this.enrollmentConfigurationService.createConfig(userId, tenantId);

        return {
            statusCode: HttpStatus.CREATED,
            message: 'Configuración de empadronamiento creada con éxito.',
            data: { config },
        };
    }

    /**
     * Marca una configuración de empadronamiento como iniciada.
     * @param req - Objeto de la solicitud.
     * @returns La configuración actualizada.
     */
    @Post('start')
    @UseGuards(TokenAuthGuard, TenantIdGuard)
    async startEnrollment(@Req() req: Request) {
        const { userId, tenantId } = this.extractUserAndTenant(req);
        const config = await this.enrollmentConfigurationService.startEnrollment(userId, tenantId);

        return {
            statusCode: HttpStatus.OK,
            message: 'El empadronamiento ha sido iniciado con éxito.',
            data: { config },
        };
    }

    /**
     * Obtiene la configuración de empadronamiento de un tenant.
     * @param req - Objeto de la solicitud.
     * @returns La configuración encontrada.
     */
    @Get()
    @UseGuards(TokenAuthGuard, TenantIdGuard)
    async getConfig(@Req() req: Request) {
        const { userId, tenantId } = this.extractUserAndTenant(req);
        const config = await this.enrollmentConfigurationService.getConfig(userId, tenantId);

        return {
            statusCode: HttpStatus.OK,
            message: 'Configuración de empadronamiento obtenida con éxito.',
            data: { config },
        };
    }

    /**
     * Verifica si el empadronamiento está iniciado para un tenant.
     * @param req - Objeto de la solicitud.
     * @returns `true` si el empadronamiento está iniciado, `false` en caso contrario.
     */
    @Get('is-started')
    @UseGuards(TokenAuthGuard, TenantIdGuard)
    async getIsStarted(@Req() req: Request) {
        const { userId, tenantId } = this.extractUserAndTenant(req);
        const isStarted = await this.enrollmentConfigurationService.getIsStarted(userId, tenantId);

        return {
            statusCode: HttpStatus.OK,
            message: 'Estado del empadronamiento obtenido con éxito.',
            data: { isStarted },
        };
    }

    /**
     * Extrae y valida los IDs de usuario y tenant de la solicitud.
     * @param req - Objeto de la solicitud.
     * @returns Un objeto con userId y tenantId.
     * @throws BadRequestException si los IDs no están presentes.
     */
    private extractUserAndTenant(req: Request): { userId: string; tenantId: string } {
        const userId = req.userId;
        const tenantId = req.tenantId;

        if (!userId || !tenantId) {
            throw new BadRequestException('El userId y tenantId son requeridos.');
        }
        return { userId, tenantId };
    }
}
