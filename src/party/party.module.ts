import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PartyService } from './services/party.service';
import { PartyController } from './controllers/party.controller';
import { Party, PartySchema } from './entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CloudinaryService } from 'src/cloudinary/services/cloudinary.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Party.name,
        schema: PartySchema,
      },
    ]),
    forwardRef(() => CloudinaryModule),
  ],
  controllers: [PartyController],
  providers: [PartyService, CloudinaryService],
})
export class PartyModule { }
