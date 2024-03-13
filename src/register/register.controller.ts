import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody } from '@nestjs/swagger';
import mongoose, { Types } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

import UserService from '../user/user.service';
import { RegisterDTO } from './register.dto';
import { EventService } from '../event/event.service';

@Controller('register')
export class RegisterController {
  constructor(
    private readonly userService: UserService,
    private readonly eventService: EventService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  @Post()
  @ApiBody({ type: RegisterDTO })
  @ApiBadRequestResponse({ description: 'User already exists' })
  async registerUser(@Body() body: RegisterDTO): Promise<void> {
    const user = await this.userService.findByUsername(body.username);
    if (user) {
      throw new BadRequestException('User already exists');
    }
    const userId = new Types.ObjectId();
    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      await this.userService.createUser(userId, body.username, body.password, session);
      await this.eventService.createRegisterEvent(userId, session);
    });
  }
}
