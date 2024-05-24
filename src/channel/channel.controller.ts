import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ChannelService } from './channel.service';
import { Channel, ChannelDocument } from './channel.schema';

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @ApiResponse({
    status: 200,
    description: 'Get new channels',
    type: Channel,
    isArray: true,
  })
  @Get('new')
  getNewChannels(): Promise<ChannelDocument[]> {
    return this.channelService.getNewChannels();
  }
}
