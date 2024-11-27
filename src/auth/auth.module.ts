import { Module } from '@nestjs/common';
import { AuthService } from './services';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/user/entity';
import { AuthController } from './controllers';
import { UserModule } from 'src/user/user.module';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: userSchema
      }
    ]),
    JwtModule,
    UserModule,
    TenantModule
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule { }
