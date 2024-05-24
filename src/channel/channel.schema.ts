import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { FlattenMaps, HydratedDocument, Types } from 'mongoose';

@Schema()
export class Channel {
  @Prop({ required: true, minlength: 1, maxlength: 50 })
  @ApiProperty({ example: 'Bring Your Own Users' })
  name: string;

  @Prop({ required: true, minlength: 10, maxlengh: 100 })
  @ApiProperty({ example: 'A channel for BYOU users to hang out' })
  description: string;

  @Prop({ default: () => new Date() })
  @ApiProperty({ example: new Date() })
  createdAt: Date;

  @Prop({ default: 0 })
  @ApiProperty({ example: 12 })
  subscribers: number;

  @Prop({ default: 0 })
  @ApiProperty({ example: 34 })
  posts: number;

  @Prop({ required: true })
  @ApiProperty({ example: ['60f6e2b8d9b8c0e4f4d9c3a3'] })
  owners: Types.ObjectId[];

  @Prop({ default: false })
  @ApiProperty({ example: false })
  readonly: boolean;

  @Prop({ default: () => new Date() })
  @ApiProperty({ example: new Date() })
  updatedAt: Date;
}
export type ChannelDocument = HydratedDocument<Channel>;
export type ChannelDocumentLean = FlattenMaps<Channel> & {
  _id: Types.ObjectId;
};
export const ChannelSchema = SchemaFactory.createForClass(Channel);
