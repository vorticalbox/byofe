import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SessionDTO {
  @IsString()
  @ApiProperty()
  token: string;

  @IsString()
  @ApiProperty()
  createdAt: string;
}
