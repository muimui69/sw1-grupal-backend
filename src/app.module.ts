import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envConfig, envSchema } from './config/env';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { FileSystemStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { TenantModule } from './tenant/tenant.module';
import { CommonModule } from './common/common.module';
import { CandidateModule } from './candidate/candidate.module';
import { MatchModule } from './match/match.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load:[envConfig],
      isGlobal: true,
      validationSchema: envSchema
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory:(config: ConfigService )=> ({
        uri: config.get<string>('database_url')  
      }),
      inject:[ConfigService]
    }),
    NestjsFormDataModule.configAsync({
      useFactory: ()=>({
        storage: FileSystemStoredFile,
        fileSystemStoragePath: '/tmp',
      }),
      isGlobal: true,
    }),
    UserModule,
    AuthModule,
    TenantModule,
    CommonModule,
    CandidateModule,
    MatchModule
  ],
  
  providers: [],  
})
export class AppModule {}
