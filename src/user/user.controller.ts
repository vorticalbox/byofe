import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiResponse } from '@nestjs/swagger';
import UserService from './user.service';
import { UserDto } from './dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Get user by username',
    type: UserDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserByUsername(
    @Param('username') username: string,
  ): Promise<UserDto> {
    const user = await this.userService.findByUsername(username);
    if (user === null) {
      throw new NotFoundException();
    }
    return {
      username: user.username,
      posts: user.posts,
      comments: user.comments,
      votes: user.votes,
      createdAt: user.createdAt,
    };
  }
}
