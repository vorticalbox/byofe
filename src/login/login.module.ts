import { Module } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { UserModule } from '../user/user.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [UserModule, SessionModule],
  controllers: [LoginController],
  providers: [LoginService],
})
export class LoginModule {}
