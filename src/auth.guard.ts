import {
  Injectable,
  CanActivate,
  ExecutionContext,
  CustomDecorator,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionService } from './session/session.service';
import UserService from './user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionService: SessionService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const noAuth = this.reflector.get<boolean>('noAuth', context.getHandler());
    if (noAuth) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-auth-token'];
    if (!token) {
      return false;
    }
    const session = await this.sessionService.findSessionByToken(
      token as string,
    );
    if (!session) {
      return false;
    }
    request.user = await this.userService.findById(session.userID);
    return true;
  }
}

export const Public = (): CustomDecorator => SetMetadata('noAuth', true);
