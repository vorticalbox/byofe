import { ApiBadRequestResponse, ApiResponse } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

import UserService from '../user/user.service';
import { LoginDto } from './login.dto';
import { LoginService } from './login.service';
import { SessionDTO } from '../session/session.dto';
import { SessionService } from '../session/session.service';
import { EventService } from '../event/event.service';

const InvalidCredentialsMessage = 'Invalid credentials';

@Controller('login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly eventService: EventService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Login successful',
    type: SessionDTO,
  })
  @ApiBadRequestResponse({ description: InvalidCredentialsMessage })
  async login(@Body() body: LoginDto): Promise<SessionDTO> {
    const user = await this.userService.findByUsername(body.username);
    if (!user) {
      throw new BadRequestException(InvalidCredentialsMessage);
    }
    const passwordMatch = await this.loginService.comparePasswords(
      body.password,
      user.password,
    );
    if (!passwordMatch) {
      throw new BadRequestException(InvalidCredentialsMessage);
    }
    const session = await this.connection.startSession();
    return session.withTransaction(async () => {
      await this.eventService.createLoginEvent(user._id, session);
      return this.sessionService.createSession(user._id, session);
    });
  }
}
