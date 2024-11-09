import {
    Controller,
    Get,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { TokenAuthGuard } from 'src/auth/guard';

@Controller('tenant')
export class TenantController {
    constructor(private readonly tenantService: TenantService) { }

    @Get('user/:userId')
    @UseGuards(TokenAuthGuard)
    @HttpCode(HttpStatus.OK)
    public async getTenantsByUser(@Param('userId') userId: string) {
        const statusCode = HttpStatus.OK;
        const tenants = await this.tenantService.findAllTenantsForUser(userId);
        return {
            statusCode,
            message: 'Lista de tenants para el usuario',
            data: {
                tenants,
            },
        };
    }

    @Get(':subdomain/user/:userId')
    @UseGuards(TokenAuthGuard)
    @HttpCode(HttpStatus.OK)
    public async getTenantBySubdomainAndUser(
        @Param('subdomain') subdomain: string,
        @Param('userId') userId: string,
    ) {
        const statusCode = HttpStatus.OK;
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
