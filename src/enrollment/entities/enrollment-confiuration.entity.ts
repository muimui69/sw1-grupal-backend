import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Tenant } from "src/tenant/entity";
import { User } from "src/user/entity";


@Schema({
    timestamps: true
})
export class EnrollmentConfiguration extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
    tenant: Tenant;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: User;

    @Prop({ type: [String] })
    validated: string[];

    @Prop({ default: false })
    isStarted: boolean;
}

export const EnrollmentConfigurationSchema = SchemaFactory.createForClass(EnrollmentConfiguration);
EnrollmentConfigurationSchema.set('collection', 'enrollmentConfigurations');

