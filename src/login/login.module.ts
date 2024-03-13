import { Module } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { UserModule } from '../user/user.module';
import { SessionModule } from '../session/session.module';
import { EventModule } from '../event/event.module';

@Module({
  imports: [UserModule, SessionModule, EventModule],
  controllers: [LoginController],
  providers: [LoginService],
})
export class LoginModule {}
