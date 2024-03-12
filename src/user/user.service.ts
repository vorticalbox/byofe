import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocumentLean } from './user.schema';

@Injectable()
/**
 * Service class for managing user data.
 */
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService,
  ) {}

  /**
   * Find a user by their username.
   * @param {string} username - The username of the user to find.
   * @returns {User|null} A promise that resolves to the found user, or undefined if not found.
   */
  findByUsername(username: string): Promise<UserDocumentLean | null> {
    return this.userModel.findOne({ username }).lean().exec();
  }

  /**
   * Creates a new user with the given username and password.
   * @param {string} username - The username of the user.
   * @param {string} password - The password of the user.
   * @returns {Promise<User>} A promise that resolves to the created user.
   */
  createUser(username: string, password: string): Promise<User> {
    const hashedPassword = bcrypt.hashSync(
      password,
      this.configService.get<number>('app.saltRounds'),
    );
    return this.userModel.create({ username, password: hashedPassword });
  }
}
export default UserService;
