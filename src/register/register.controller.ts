import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiResponse } from '@nestjs/swagger';
import mongoose, { Types } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

import UserService from '../user/user.service';
import { RegisterDTO } from './register.dto';
import { EventService } from '../event/event.service';
import { Public } from '../auth.guard';

@Controller('register')
export class RegisterController {
  constructor(
    private readonly userService: UserService,
    private readonly eventService: EventService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  @Post()
  @Public()
  @ApiBody({ type: RegisterDTO })
  @ApiResponse({
    status: 201,
    description: 'User registered',
  })
  @ApiBadRequestResponse({ description: 'User already exists' })
  async registerUser(@Body() body: RegisterDTO): Promise<void> {
    const user = await this.userService.findByUsername(body.username);
    if (user) {
      throw new BadRequestException('User already exists');
    }
    const userId = new Types.ObjectId();
    const session = await this.connection.startSession();
    const { username, password } = body;
    await session.withTransaction(async () => {
      await this.userService.createUser({
        userId,
        username,
        password,
        session,
      });
      await this.eventService.createRegisterEvent(userId, session);
    });
  }
}
