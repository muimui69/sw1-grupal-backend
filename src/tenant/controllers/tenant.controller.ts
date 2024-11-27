import {
    Controller,
    Get,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
    Req,
} from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { TokenAuthGuard } from 'src/auth/guard';
import { Request } from 'express';
import { TokenTenantGuard } from '../guard/token-tenant.guard';

@Controller('tenant')
export class TenantController {
    constructor(private readonly tenantService: TenantService) { }

    /**
     * Obtiene todos los tenants asociados a un usuario.
     * @param req - Solicitud HTTP, incluye el ID del usuario.
     * @returns Lista de tenants asociados al usuario.
     */
    @Get('user')
    @UseGuards(TokenAuthGuard)
    @HttpCode(HttpStatus.OK)
    public async getTenantsByUser(
        @Req() req: Request,
    ) {
        const statusCode = HttpStatus.OK;
        const userId = req.userId;
        const tenants = await this.tenantService.findAllTenantsForUser(userId);
        return {
            statusCode,
            message: 'Lista de tenants para el usuario',
            data: {
                tenants,
            },
        };
    }

    /**
     * Obtiene los detalles de un tenant específico por su subdominio y el usuario asociado.
     * @param req - Solicitud HTTP, incluye el ID del usuario.
     * @param subdomain - Subdominio del tenant.
     * @returns Detalles del tenant para el usuario.
     */
    @Get(':subdomain/user')
    @UseGuards(TokenAuthGuard)
    @HttpCode(HttpStatus.OK)
    public async getTenantBySubdomainAndUser(
        @Req() req: Request,
        @Param('subdomain') subdomain: string,
    ) {
        const statusCode = HttpStatus.OK;
        const userId = req.userId;
        const tenant = await this.tenantService.findTenantUser(subdomain, userId);
        return {
            statusCode,
            message: 'Detalles del tenant para el usuario',
            data: {
                tenant,
            },
        };
    }


    /**
     * Obtiene el ID del MemberTenant para un usuario dado un tenantId.
     * @param req - Solicitud HTTP, incluye el ID del usuario y el tenantId.
     * @returns ID del MemberTenant.
     */
    @Get('user/membertenantId')
    @UseGuards(TokenAuthGuard, TokenTenantGuard)
    @HttpCode(HttpStatus.OK)
    public async getMemberTenantId(
        @Req() req: Request,
    ) {
        const statusCode = HttpStatus.OK;
        const userId = req.userId;
        const tenantId = req.tenantId;
        const tenant = await this.tenantService.getMemberTenantId(userId, tenantId);
        return {
            statusCode,
            message: 'Detalles del MemberTenant para el usuario',
            data: {
                memberTenantId: tenant
            },
        };
    }
}
