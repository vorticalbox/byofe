import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type UserDocument = HydratedDocument<User>;
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
export const UserSchema = SchemaFactory.createForClass(User);
