import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as moongose from 'mongoose';

@Schema({
  timestamps: true,
})
export class Candidate extends moongose.Document {
  @Prop({
    isRequired: true
  })
  name: string;

  @Prop({
    isRequired: false
  })
  photo: string;

  @Prop({
    type: moongose.Schema.Types.ObjectId,
    ref: "Tenant"
  })
  tenant_id: string;
}

export const candidateSchema = SchemaFactory.createForClass(Candidate);