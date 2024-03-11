import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  posts: number;

  @ApiProperty()
  comments: number;

  @ApiProperty()
  votes: number;
}
