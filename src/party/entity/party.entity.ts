import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Tenant } from "src/tenant/entity";

@Schema({
    timestamps: true
})
export class Party extends Document {

    @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
    tenant: Tenant;

    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true })
    abbreviation: string;

    @Prop()
    president: string;

    @Prop()
    ideology: string;

    @Prop()
    description: string;

    @Prop()
    logo: string;
}

export const PartySchema = SchemaFactory.createForClass(Party);

PartySchema.index({ tenant: 1, name: 1 }, { unique: true });