import { Module } from '@nestjs/common';
import { BallotService } from './service/ballot.service';
import { BallotController } from './controllers/ballot.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Party, PartySchema } from 'src/party/entity';
import { UserModule } from 'src/user/user.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { AuthModule } from 'src/auth/auth.module';
import { PinataModule } from 'src/pinata/pinata.module';
import { CandidateModule } from 'src/candidate/candidate.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Party.name,
        schema: PartySchema,
      },
    ]),
    UserModule,
    AuthModule,
    TenantModule,
    CandidateModule,
    PinataModule,
  ],
  controllers: [BallotController],
  providers: [BallotService],
})
export class BallotModule { }
