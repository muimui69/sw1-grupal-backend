import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './entity';
import { UserService } from './service';
import { UserController } from './controllers';

@Module({
  providers: [ UserService],
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: userSchema
      }
    ])
  ],
  controllers: [UserController],
  exports: [
    UserService
  ]
})
export class UserModule {}
