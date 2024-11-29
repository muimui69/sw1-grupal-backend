import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './provider';
import { CloudinaryService } from './services';

@Module({
    providers: [CloudinaryProvider, CloudinaryService],
    exports: [CloudinaryProvider],
})
export class CloudinaryModule { }
