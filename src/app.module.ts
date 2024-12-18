import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envConfig, envSchema } from './config/env';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { FileSystemStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { TenantModule } from './tenant/tenant.module';
import { CommonModule } from './common/common.module';
import { PartyModule } from './party/party.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { BallotModule } from './ballot/ballot.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { PinataModule } from './pinata/pinata.module';
import { BackupModule } from './backup/backup.module';
import { LogsService } from './common/services/logs.service';
import { LogsInterceptor } from './common/interceptors/logs.Interceptor';
import { AwsModule } from './aws/aws.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { CohereModule } from './cohere/cohere.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { StatisticModule } from './statistic/statistic.module';
import { CandidateModule } from './candidate/candidate.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ConfigModule.forRoot({
      load: [envConfig],
      isGlobal: true,
      validationSchema: envSchema
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database_url')
      }),
      inject: [ConfigService]
    }),
    NestjsFormDataModule.configAsync({
      useFactory: () => ({
        storage: FileSystemStoredFile,
        fileSystemStoragePath: '/tmp',
      }),
      isGlobal: true,
    }),
    UserModule,
    AuthModule,
    TenantModule,
    CommonModule,
    PartyModule,
    CloudinaryModule,
    BallotModule,
    BlockchainModule,
    PinataModule,
    BackupModule,
    AwsModule,
    EnrollmentModule,
    CohereModule,
    StatisticModule,
    CandidateModule,
  ],
  providers: [
    LogsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LogsInterceptor,
    },
  ],
})
export class AppModule { }
