import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { FlattenMaps, HydratedDocument, Types } from 'mongoose';

@Schema()
export class User {
  @Prop()
  username: string;

  @Prop()
  password: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: 0 })
  posts: number;

  @Prop({ default: 0 })
  comments: number;

  @Prop({ default: 0 })
  votes: number;
}
export type UserDocument = HydratedDocument<User>;
export type UserDocumentLean = FlattenMaps<User> & { _id: Types.ObjectId };
export const UserSchema = SchemaFactory.createForClass(User);
