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
import { TenantIdGuard } from '../guard';

@Controller('tenant')
export class TenantController {
    constructor(private readonly tenantService: TenantService) { }

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


    @Get('user/membertenantId')
    @UseGuards(TokenAuthGuard, TenantIdGuard)
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
