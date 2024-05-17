import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Channel } from './channel.schema';

@Injectable()
export class ChannelService {
  constructor(
    @InjectModel(Channel.name) private channelModel: Model<Channel>,
  ) {}
}

// get new channels
// get most recently active channels
// get most popular channels (posts + subscribers)
// search by name?? regex?
// find by user
