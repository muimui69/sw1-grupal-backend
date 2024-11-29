import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PartyService } from './services';
import { PartyController } from './controllers';
import { Party, PartySchema } from './entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CloudinaryService } from 'src/cloudinary/services';
import { TenantModule } from 'src/tenant/tenant.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { MemberTenant, MemberTenantSchema } from 'src/tenant/entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Party.name,
        schema: PartySchema,
      },
      {
        name: MemberTenant.name,
        schema: MemberTenantSchema,
      }
    ]),
    AuthModule,
    TenantModule,
    forwardRef(() => UserModule),
    forwardRef(() => CloudinaryModule),
  ],
  controllers: [PartyController],
  providers: [PartyService, CloudinaryService],
})
export class PartyModule { }
