import {
    Controller,
    Post,
    UseGuards,
    Req,
    Get,
    Param,
    BadRequestException,
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
        return await this.enrollmentConfigurationService.createConfig(userId, tenantId);
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
        return await this.enrollmentConfigurationService.startEnrollment(userId, tenantId);
    }

    /**
     * Obtiene la configuración de empadronamiento de un tenant.
     * @param req - Objeto de la solicitud.
     * @param tenantId - ID del tenant.
     * @returns La configuración encontrada.
     */
    @Get('get/:tenantId')
    @UseGuards(TokenAuthGuard, TenantIdGuard)
    async getConfig(@Req() req: Request, @Param('tenantId') tenantId: string) {
        const { userId } = this.extractUserAndTenant(req);
        if (!tenantId) {
            throw new BadRequestException('El tenantId es requerido.');
        }
        return await this.enrollmentConfigurationService.getConfig(userId, tenantId);
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
