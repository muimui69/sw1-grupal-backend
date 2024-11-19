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
import { TenantIdGuard } from '../guard';
import { Request } from 'express';

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
}
