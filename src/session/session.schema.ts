import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { FlattenMaps, HydratedDocument, Types } from 'mongoose';

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
export type SessionDocumentLean = FlattenMaps<Session> & {
  _id: Types.ObjectId;
};
