import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import * as moongose from 'mongoose';
import { Tenant } from "./tenant.entity";
import { User } from "src/user/entity";


@Schema({
  timestamps: true
})
export class MemberTenant extends Document {
  @Prop({
    type: moongose.Schema.Types.ObjectId,
    ref: 'Tenant'
  })
  tenant: Tenant

  @Prop({
    type: moongose.Schema.Types.ObjectId,
    ref: 'User'
  })
  user: User

  @Prop()
  role: string;

  @Prop({ type: String, required: false })
  tenantAddress: string;

  @Prop({ type: String, required: false })
  electionAddress: string;
}


export const MemberTenantSchema = SchemaFactory.createForClass(MemberTenant);