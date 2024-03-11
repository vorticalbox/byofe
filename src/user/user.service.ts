import { Injectable } from '@nestjs/common';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
/**
 * Service class for managing user data.
 */
export class UserService {
  constructor(@InjectModel(User.name) private catModel: Model<User>) {}

  /**
   * Find a user by their username.
   * @param {string} username - The username of the user to find.
   * @returns {User|null} A promise that resolves to the found user, or undefined if not found.
   */
  findByUsername(username: string): Promise<User | null> {
    return this.catModel.findOne({ username: username }).exec();
  }
}
