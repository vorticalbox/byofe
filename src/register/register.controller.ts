import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody } from '@nestjs/swagger';
import UserService from '../user/user.service';
import { RegisterDTO } from './register.dto';

@Controller('register')
export class RegisterController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiBody({ type: RegisterDTO })
  @ApiBadRequestResponse({ description: 'User already exists' })
  async registerUser(@Body() body: RegisterDTO): Promise<void> {
    const user = await this.userService.findByUsername(body.username);
    if (user) {
      throw new BadRequestException('User already exists');
    }
    await this.userService.createUser(body.username, body.password);
  }
}
