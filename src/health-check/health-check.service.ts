import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class HealthCheckService {
  constructor(@InjectConnection() private connection: Connection) {}
  heartBeat(): boolean {
    return this.connection.readyState === 1;
  }
}
