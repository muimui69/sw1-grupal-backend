import { Module, Global } from '@nestjs/common';
import { CloudinaryProvider } from './provider/cloudinary.provider';
import { CloudinaryService } from './services/cloudinary.service';

@Global()
@Module({
    providers: [CloudinaryProvider, CloudinaryService],
    exports: [CloudinaryProvider],
})
export class CloudinaryModule { }
