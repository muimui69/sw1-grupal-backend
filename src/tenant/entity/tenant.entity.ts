import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document} from "mongoose";
import { Configuration, configurationSchema } from "./configuration.entity";




@Schema({
  timestamps: true
})
export class Tenant extends Document{

  @Prop()
  name:   string;

  @Prop()
  domain: string;

  @Prop({
    isRequired: false
  })
  logo_url: string;

  @Prop({
    type: configurationSchema, required:false
  })
  configuration: Configuration

}

export const tenantSchema = SchemaFactory.createForClass(Tenant);