import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { CreateTenantDto } from '../dto';
import { Request } from 'express';
import Stripe from "stripe"
import { SuscriptionService } from '../services/suscription.service';
import { TokenAuthGuard } from 'src/auth/guard';

@Controller('suscription')
export class SuscriptionController {

  constructor(
    private readonly suscriptionService: SuscriptionService
  ) { }


  @Post("create")
  @UseGuards(TokenAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  public async createSuscription(@Body() createTenantDto: CreateTenantDto, @Req() req: Request) {
    const statusCode = HttpStatus.CREATED;
    const userId = req.userId;
    const suscription = await this.suscriptionService.createSuscription(createTenantDto, userId);
    return {
      statusCode,
      message: "suscripcion casi acabado",
      data: {
        suscription
      }
    }
  }
  @Post("webhook")
  @HttpCode(HttpStatus.CREATED)
  public async suscriptionWebhook(@Body() body: Stripe.CheckoutSessionCompletedEvent) {
    const statusCode = HttpStatus.CREATED;

    if (body.type !== 'checkout.session.completed') return;

    const metadata = body.data.object.metadata;
    if (!metadata) {
      console.error("Metadata no encontrada en el evento `checkout.session.completed`");
      throw new BadRequestException("La metadata es necesaria para procesar la suscripción");
    }

    const suscription = await this.suscriptionService.webhookPayment(body.data.object.metadata);
    return {
      statusCode,
      message: "suscripcion concluida",
      data: {
        suscription
      }
    }
  }

}
