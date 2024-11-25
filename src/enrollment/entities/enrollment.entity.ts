import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Tenant } from 'src/tenant/entity';
import { User } from 'src/user/entity';


@Schema({
    timestamps: true,
    strict: false
})
export class Enrollment extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
    tenant: Tenant;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: User;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
