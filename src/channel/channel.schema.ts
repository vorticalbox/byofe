import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { FlattenMaps, HydratedDocument, Types } from 'mongoose';

@Schema()
export class Channel {
  @Prop({ required: true, minlength: 1 })
  name: string;

  @Prop({ required: true, minlength: 10, maxlength: 100 })
  description: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: 0 })
  subscribers: number;

  @Prop({ default: 0 })
  posts: number;

  @Prop({ required: true })
  owners: Types.ObjectId[];

  @Prop({ default: false })
  readonly: boolean;

  @Prop({ default: () => new Date() })
  updatedAt: Date;
}
export type ChannelDocument = HydratedDocument<Channel>;
export type ChannelDocumentLean = FlattenMaps<Channel> & {
  _id: Types.ObjectId;
};
export const UserSchema = SchemaFactory.createForClass(Channel);
