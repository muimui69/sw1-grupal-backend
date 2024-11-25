import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { TenantService } from 'src/tenant/services/tenant.service';
import { EnrollmentConfiguration } from '../entities/enrollment-confiuration.entity';

const DEFAULT_VALIDATED_FIELDS = ['pais', 'nacionalidad'];

@Injectable()
export class EnrollmentConfigurationService {
    constructor(
        @InjectModel(EnrollmentConfiguration.name)
        private readonly enrollmentConfigModel: Model<EnrollmentConfiguration>,
        private readonly tenantService: TenantService,
    ) { }

    /**
     * Crea una nueva configuración para un Tenant y un Usuario.
     * @param userId - ID del Usuario.
     * @param tenantId - ID del Tenant.
     * @returns La configuración creada.
     */
    async createConfig(userId: string, tenantId: string): Promise<EnrollmentConfiguration> {
        this.validateObjectIds(userId, tenantId);
        await this.validateUserMembership(userId, tenantId);

        const userObjectId = new Types.ObjectId(userId);
        const tenantObjectId = new Types.ObjectId(tenantId);

        // Verificar si ya existe una configuración
        const existingConfig = await this.enrollmentConfigModel
            .findOne({ user: userObjectId, tenant: tenantObjectId })
            .exec();
        if (existingConfig) {
            throw new BadRequestException('La configuración para este tenant ya existe.');
        }

        // Crear nueva configuración
        const config = new this.enrollmentConfigModel({
            tenant: tenantObjectId,
            user: userObjectId,
            validated: DEFAULT_VALIDATED_FIELDS,
        });
        return await config.save();
    }

    /**
     * Marca la configuración como iniciada.
     * @param userId - ID del Usuario.
     * @param tenantId - ID del Tenant.
     * @returns La configuración actualizada.
     */
    async startEnrollment(userId: string, tenantId: string): Promise<EnrollmentConfiguration> {
        this.validateObjectIds(userId, tenantId);
        await this.validateUserMembership(userId, tenantId);

        const userObjectId = new Types.ObjectId(userId);
        const tenantObjectId = new Types.ObjectId(tenantId);

        // Buscar la configuración existente
        const config = await this.enrollmentConfigModel
            .findOne({ user: userObjectId, tenant: tenantObjectId })
            .exec();
        if (!config) {
            throw new BadRequestException('La configuración para este tenant no existe.');
        }
        if (config.isStarted) {
            throw new BadRequestException('El empadronamiento ya está iniciado.');
        }

        // Actualizar estado
        config.isStarted = true;
        return await config.save();
    }

    /**
     * Obtiene la configuración de un Tenant.
     * @param userId - ID del Usuario.
     * @param tenantId - ID del Tenant.
     * @returns La configuración encontrada.
     */
    async getConfig(userId: string, tenantId: string): Promise<EnrollmentConfiguration> {
        this.validateObjectIds(userId, tenantId);
        await this.validateUserMembership(userId, tenantId);

        const userObjectId = new Types.ObjectId(userId);
        const tenantObjectId = new Types.ObjectId(tenantId);

        const config = await this.enrollmentConfigModel
            .findOne({ user: userObjectId, tenant: tenantObjectId })
            .exec();
        if (!config) {
            throw new BadRequestException('La configuración para este tenant no existe.');
        }
        return config;
    }

    /**
     * Verifica si el empadronamiento está iniciado para un Tenant y un Usuario.
     * @param userId - ID del Usuario.
     * @param tenantId - ID del Tenant.
     * @returns `true` si el empadronamiento está iniciado, `false` en caso contrario.
     */
    async getIsStarted(userId: string, tenantId: string): Promise<boolean> {
        this.validateObjectIds(userId, tenantId);
        await this.validateUserMembership(userId, tenantId);

        const userObjectId = new Types.ObjectId(userId);
        const tenantObjectId = new Types.ObjectId(tenantId);

        const config = await this.enrollmentConfigModel
            .findOne({ user: userObjectId, tenant: tenantObjectId })
            .exec();
        if (!config) {
            throw new BadRequestException('La configuración para este tenant no existe.');
        }
        return config.isStarted;
    }

    /**
     * Valida si el usuario es miembro del tenant.
     * @param userId - ID del Usuario.
     * @param tenantId - ID del Tenant.
     * @throws UnauthorizedException si el usuario no pertenece al tenant.
     */
    private async validateUserMembership(userId: string, tenantId: string): Promise<void> {
        const isMember = await this.tenantService.isUserMemberOfTenant(userId, tenantId);
        if (!isMember) {
            throw new UnauthorizedException('No tienes permiso para acceder a este tenant.');
        }
    }

    /**
     * Valida si los IDs proporcionados son válidos.
     * @param userId - ID del Usuario.
     * @param tenantId - ID del Tenant.
     * @throws BadRequestException si algún ID es inválido.
     */
    private validateObjectIds(userId: string, tenantId: string): void {
        if (!isValidObjectId(userId)) {
            throw new BadRequestException(`El valor ${userId} no es un ObjectId válido.`);
        }
        if (!isValidObjectId(tenantId)) {
            throw new BadRequestException(`El valor ${tenantId} no es un ObjectId válido.`);
        }
    }
}
