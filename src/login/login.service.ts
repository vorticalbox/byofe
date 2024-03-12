import { Injectable } from '@nestjs/common';
import { compare } from 'bcrypt';

@Injectable()
export class LoginService {
  // eslint-disable-next-line class-methods-use-this
  comparePasswords(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }
}
