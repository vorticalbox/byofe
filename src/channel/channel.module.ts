import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { Channel } from './channel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Channel.name, schema: Channel }]),
  ],
  controllers: [ChannelController],
  providers: [ChannelService],
  exports: [ChannelService],
})
export class ChannelModule {}
