import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from "stripe";
import { Connection } from 'mongoose';
import { CreateTenantDto } from '../dto';
import { TenantService } from './tenant.service';
import { UserService } from 'src/user/services';
import { Tenant } from '../entity';
import { Plan } from 'src/constant';
import { InjectConnection } from '@nestjs/mongoose';
import { ElectionContractService, TenantContractService } from 'src/blockchain/services';

@Injectable()
export class SuscriptionService {
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantService: TenantService,
    private readonly userService: UserService,
    private readonly electionContractService: ElectionContractService,
    private readonly tenantContractService: TenantContractService,
    @InjectConnection() private readonly connection: Connection,
  ) {
    this.stripe = new Stripe(this.configService.get<string>("stripe_key_api"));
  }

  /**
   * Crea una suscripción para un tenant.
   * @param createTenantDto - Datos del tenant a crear.
   * @param userId - ID del usuario que crea la suscripción.
   * @returns Stripe checkout session.
   */
  public async createSuscription(createTenantDto: CreateTenantDto, userId: string): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    try {
      // Validación del plan Gold
      this.validateGoldPlan(createTenantDto);

      // Verificar si el tenant ya existe
      await this.checkTenantExistence(createTenantDto);

      // Crear metadata para Stripe
      const metadata = this.createMetadata(createTenantDto, userId);

      // Iniciar pago en Stripe
      return await this.initiateStripePayment(createTenantDto, metadata);

    } catch (err) {
      this.handleError(err);
    }
  }

  /**
   * Valida los datos del plan Gold.
   * @param createTenantDto - Datos del tenant a crear.
   */
  private validateGoldPlan(createTenantDto: CreateTenantDto): void {
    if (createTenantDto.plan === "Gold" && (!createTenantDto.number_voting || createTenantDto.number_voting <= 500)) {
      throw new BadRequestException("El plan gold necesita un número de votantes superior a 500 personas.");
    }
  }

  /**
   * Verifica si el tenant ya existe.
   * @param createTenantDto - Datos del tenant a crear.
   */
  private async checkTenantExistence(createTenantDto: CreateTenantDto): Promise<void> {
    const existingTenants = await this.tenantService.findOrTenant([
      { domain: createTenantDto.domain },
      { name: createTenantDto.name },
    ]);
    if (existingTenants.length) {
      throw new BadRequestException("Ingrese otro nombre o subdominio, ya se encuentra en uso.");
    }
  }

  /**
   * Crea el objeto de metadata para Stripe.
   * @param createTenantDto - Datos del tenant a crear.
   * @param userId - ID del usuario que crea la suscripción.
   * @returns Metadata para Stripe.
   */
  private createMetadata(createTenantDto: CreateTenantDto, userId: string): Stripe.Metadata {
    return {
      userId: String(userId),
      plan: createTenantDto.plan,
      domain: createTenantDto.domain,
      name: createTenantDto.name,
      number_voting: createTenantDto.number_voting?.toString() ?? "500",
    };
  }

  /**
   * Inicia el proceso de pago en Stripe.
   * @param createTenantDto - Datos del tenant.
   * @param metadata - Metadata del pago.
   * @returns Stripe session.
   */
  private async initiateStripePayment(createTenantDto: CreateTenantDto, metadata: Stripe.Metadata): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    const lineItems = this.createLineItems(createTenantDto);
    return this.payment(lineItems, metadata);
  }

  /**
   * Crea los items de línea para el pago de Stripe.
   * @param createTenantDto - Datos del tenant.
   * @returns Line items para Stripe.
   */
  private createLineItems(createTenantDto: CreateTenantDto): Stripe.Checkout.SessionCreateParams.LineItem[] {
    return [
      {
        price_data: {
          product_data: {
            name: createTenantDto.plan,
            description: `Plan ${createTenantDto.plan} de suscripción al servicio de votación con blockchain.`,
          },
          currency: 'usd',
          unit_amount: (createTenantDto.plan === "Gold" ? 100 * 100 : 0),
        },
        quantity: 1,
      },
    ];
  }

  /**
   * Realiza el pago usando Stripe.
   * @param line_items - Items de línea para el pago.
   * @param metadata - Metadata asociada al pago.
   * @returns Stripe checkout session.
   */
  private async payment(line_items: Stripe.Checkout.SessionCreateParams.LineItem[], metadata: Stripe.Metadata): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    return this.stripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      success_url: this.configService.get<string>("stripe_sucess_url"),
      cancel_url: this.configService.get<string>("stripe_cancel_url"),
      metadata,
    });
  }

  /**
   * Maneja los errores generados durante la creación de la suscripción.
   * @param err - Error generado.
   */
  private handleError(err: any): void {
    if (err instanceof BadRequestException) {
      throw err;
    }
    console.error(err);
    throw new InternalServerErrorException(`Error en el servidor: ${err}`);
  }

  /**
   * Procesa el webhook de Stripe después de un pago.
   * @param body - Metadata del webhook de Stripe.
   * @returns Tenant creado.
   */
  public async webhookPayment(body: Stripe.Metadata): Promise<Tenant> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const tenantData = this.extractTenantData(body);

      // Verificar existencia de tenant
      await this.checkTenantExistence(tenantData);

      // Verificar existencia de usuario
      const user = await this.userService.findIdUser(tenantData.userId);
      if (!user) throw new NotFoundException("Usuario no encontrado.");

      // Crear tenant
      const createdTenant = await this.tenantService.createTenant({
        name: tenantData.name,
        subdomain: tenantData.domain,
        plan: tenantData.plan as Plan,
        limit_voting: tenantData.number_voting,
      });

      // Asignar propietario
      await this.tenantService.createMemberTenant({
        tenantId: String(createdTenant._id),
        userId: tenantData.userId,
      }, "owner");

      // Desplegar contratos
      await this.deployContracts(tenantData, createdTenant);

      // Confirmar transacción
      await session.commitTransaction();
      session.endSession();

      return createdTenant;

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      this.handleError(err);
    }
  }

  /**
   * Extrae los datos necesarios para el tenant desde el webhook de Stripe.
   * @param body - Metadata del webhook de Stripe.
   * @returns Datos del tenant.
   */
  private extractTenantData(body: Stripe.Metadata): { userId: string, plan: Plan, domain: string, name: string, number_voting: number } {
    return {
      userId: body.userId,
      plan: body.plan as Plan,
      domain: body.domain,
      name: body.name,
      number_voting: +body.number_voting,
    };
  }

  /**
   * Despliega los contratos de elección y tenant en blockchain.
   * @param tenantData - Datos del tenant.
   * @param createdTenant - Tenant creado.
   */
  private async deployContracts(tenantData: { userId: string, plan: Plan, domain: string, name: string, number_voting: number }, createdTenant: Tenant): Promise<void> {
    const electionContract = await this.electionContractService.deployElectionContract(tenantData.userId, String(createdTenant._id));
    await this.electionContractService.setElectionDetails(electionContract.electionAddress, tenantData.domain, `Elecciones de ${tenantData.domain}`);

    const tenantContract = await this.tenantContractService.deployTenantContract(tenantData.userId, String(createdTenant._id));
    await this.tenantContractService.createElection(String(tenantContract._id), tenantData.domain, electionContract.electionAddress);
  }
}
