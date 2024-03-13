import { Module } from '@nestjs/common';

import { EventModule } from '../event/event.module';
import { RegisterController } from './register.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule, EventModule],
  controllers: [RegisterController],
})
export class RegisterModule {}
