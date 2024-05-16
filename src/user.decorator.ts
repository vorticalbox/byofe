import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocumentLean } from './user/user.schema';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserDocumentLean => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
export default CurrentUser;
