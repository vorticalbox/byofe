import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';

@Injectable()
/**
 * Service class for managing user data.
 */
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  /**
   * Find a user by their username.
   * @param {string} username - The username of the user to find.
   * @returns {User|null} A promise that resolves to the found user, or undefined if not found.
   */
  findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }
}
export default UserService;
