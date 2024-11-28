import {
    Controller,
    Post,
    UseGuards,
    Req,
    Get,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { TokenAuthGuard } from 'src/auth/guard';
import { Request } from 'express';
import { EnrollmentConfigurationService } from '../services/enrollment-configuration.service';
import { TokenTenantGuard } from 'src/tenant/guard/token-tenant.guard';

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
    @UseGuards(TokenAuthGuard, TokenTenantGuard)
    @HttpCode(HttpStatus.CREATED)
    async createEnrollmentConfig(
        @Req() req: Request
    ) {
        const statusCode = HttpStatus.CREATED;

        const userId = req.userId;
        const tenantId = req.tenantId;

        const config = await this.enrollmentConfigurationService.createConfig(userId, tenantId);

        return {
            statusCode,
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
    @UseGuards(TokenAuthGuard, TokenTenantGuard)
    @HttpCode(HttpStatus.OK)
    async startEnrollment(
        @Req() req: Request
    ) {

        const statusCode = HttpStatus.OK;

        const userId = req.userId;
        const tenantId = req.tenantId;


        const config = await this.enrollmentConfigurationService.startEnrollment(userId, tenantId);

        return {
            statusCode,
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
    @UseGuards(TokenAuthGuard, TokenTenantGuard)
    async getConfig(
        @Req() req: Request
    ) {

        const statusCode = HttpStatus.OK;

        const userId = req.userId;
        const tenantId = req.tenantId;

        const config = await this.enrollmentConfigurationService.getConfig(userId, tenantId);

        return {
            statusCode,
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
    @UseGuards(TokenAuthGuard, TokenTenantGuard)
    @HttpCode(HttpStatus.OK)
    async getIsStarted(@Req() req: Request) {

        const statusCode = HttpStatus.OK;

        const userId = req.userId;
        const tenantId = req.tenantId;

        const isStarted = await this.enrollmentConfigurationService.getIsStarted(userId, tenantId);

        return {
            statusCode,
            message: 'Estado del empadronamiento obtenido con éxito.',
            data: { isStarted },
        };

    }

}
