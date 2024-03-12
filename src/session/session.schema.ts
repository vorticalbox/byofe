import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema()
export class Session {
  @Prop()
  token: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  userID: Types.ObjectId;
}

export type SessionDocument = HydratedDocument<Session>;
export const SessionSchema = SchemaFactory.createForClass(Session);
