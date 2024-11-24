import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Enrollment extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    dni: string;

    @Prop({ required: true })
    dateOfBirth: Date;

    @Prop({ required: true })
    nationality: string;

    @Prop({ default: false })
    isVoted: boolean;

}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
