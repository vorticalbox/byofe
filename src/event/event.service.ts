import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Event, EventDocument } from './event.schema';

@Injectable()
export class EventService {
  constructor(@InjectModel(Event.name) private eventModel: Model<Event>) {}

  createPostEvent(
    userId: Types.ObjectId,
    postId: Types.ObjectId,
  ): Promise<EventDocument> {
    return this.eventModel.create({
      eventType: 'post',
      userId,
      postId,
    });
  }

  async createLoginEvent(
    userId: Types.ObjectId,
    session: ClientSession,
  ): Promise<EventDocument> {
    const [event] = await this.eventModel.create(
      [
        {
          eventType: 'login',
          userId,
        },
      ],
      { session },
    );
    return event;
  }

  async createRegisterEvent(
    userId: Types.ObjectId,
    session: ClientSession,
  ): Promise<EventDocument> {
    const [event] = await this.eventModel.create(
      [
        {
          eventType: 'register',
          userId,
        },
      ],
      { session },
    );
    return event;
  }
}
