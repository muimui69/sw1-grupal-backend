import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema({
    timestamps: true,
    strict: false
})
export class Enrollment extends Document { }

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
