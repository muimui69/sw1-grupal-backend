import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { TenantService } from '../services/tenant.service';
import { Request } from 'express';

@Injectable()
export class TenantIdGuard implements CanActivate {
    constructor(private readonly tenantService: TenantService) { }

    async canActivate(
        context: ExecutionContext
    ): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>();
        const tenantId = req.headers['tenant-id'];

        if (!tenantId) {
            throw new BadRequestException('Tenant ID is required.');
        }

        if (
            typeof tenantId !== 'string' ||
            tenantId.trim() === '' ||
            !isValidObjectId(tenantId)
        ) {
            throw new BadRequestException('Invalid Tenant ID.');
        }

        const tenantExists = await this.tenantService.findTenantById(tenantId);
        if (!tenantExists) {
            throw new BadRequestException('Tenant ID does not exist.');
        }

        req.tenantId = tenantId;

        return true;
    }
}
