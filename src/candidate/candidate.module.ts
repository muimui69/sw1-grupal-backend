import { Module } from '@nestjs/common';
import { CandidateController } from './controllers/candidate.controller';
import { CandidateService } from './services/candidate.service';
import { PinataModule } from 'src/pinata/pinata.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberTenant, MemberTenantSchema } from 'src/tenant/entity';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MemberTenant.name,
        schema: MemberTenantSchema
      },
    ]),
    TenantModule,
    PinataModule
  ],
  controllers: [CandidateController],
  providers: [CandidateService],
  exports: [CandidateService]
})
export class CandidateModule { }
