import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Plan } from "src/constant";



@Schema()
export class Configuration extends Document{

  @Prop()
  plan:                 string;

  @Prop()
  limit_voting:         number;

  @Prop({
    default: true
  })
  blockchain:           boolean;

  @Prop({
    default: true
  })
  facial_recognition:   boolean;

  @Prop({
    default: false
  })
  document_recognition: boolean;

  @Prop({
    default: false
  })
  firewall:             boolean;

}

export const configurationSchema = SchemaFactory.createForClass(Configuration);