import { ApiProperty } from '@nestjs/swagger';

class HealthCheckDto {
  @ApiProperty({ example: 'Hello World' })
  message: string;
}
export default HealthCheckDto;
