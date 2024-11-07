import { Module } from '@nestjs/common';
import { AuthService } from './services';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/user/entity';
import { AuthController } from './controllers';
import { UserModule } from 'src/user/user.module';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  providers: [AuthService],
  imports:[
    JwtModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: userSchema
      }
    ]),
    UserModule,
    TenantModule
  ],
  exports: [
    AuthService
  ],
  controllers: [AuthController]
})
export class AuthModule {}
