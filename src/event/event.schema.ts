import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { FlatRecord, HydratedDocument, Types } from 'mongoose';

export type EventType = 'login' | 'register' | 'post';

export type EventMetadata = { postID: string };

@Schema()
export class Event {
  @Prop({ enum: ['login', 'register', 'post'] })
  eventType: EventType;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: false, type: Types.ObjectId, default: null })
  postId: Types.ObjectId;

  @Prop({ required: false, type: Object, default: null })
  metadata: Record<string, unknown> | null;
}

export type EventDocument = HydratedDocument<Event>;
export type EventDocumentLean = FlatRecord<EventDocument>;
export const EventSchema = SchemaFactory.createForClass(Event);
