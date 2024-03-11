import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService } from './health-check.service';
import HealthCheckDto from './health-check.dto';

@Controller('health-check')
export class HealthCheckController {
  constructor(private readonly healthService: HealthCheckService) {}

  @Get()
  @ApiOkResponse({
    description: 'returns hello world if server is ready to accept requests',
  })
  @ApiResponse({ type: HealthCheckDto })
  getHello(): HealthCheckDto {
    const healthy = this.healthService.heartBeat();
    if (!healthy) {
      throw new InternalServerErrorException('MongoDB is not healthy');
    }
    return { message: 'Hello World' };
  }
}
