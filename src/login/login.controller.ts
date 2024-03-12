import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiResponse } from '@nestjs/swagger';
import { LoginService } from './login.service';
import UserService from '../user/user.service';
import { LoginDto } from './login.dto';
import { SessionService } from '../session/session.service';
import { SessionDTO } from '../session/session.dto';
import { SessionDocument } from '../session/session.schema';

const InvalidCredentialsMessage = 'Invalid credentials';

@Controller('login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
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
    return this.sessionService.createSession(user._id);
  }
}
