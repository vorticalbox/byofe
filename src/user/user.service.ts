import { Injectable } from '@nestjs/common';
import { ClientSession, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocumentLean } from './user.schema';
import CreateUser from './types/create-user.type';

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
   *  Create a new user.
   * @param {CreateUser} param - The parameters for creating a user.
   * @param {Types.ObjectId} param.userId - The ID of the user to create.
   * @param {string} param.username - The username of the user to create.
   * @param {string} param.password - The password of the user to create.
   * @param {ClientSession} param.session - The session to use for the transaction.
   * @returns {Promise<User>} A promise that resolves to the created user.
   */
  async createUser({
    userId,
    username,
    password,
    session,
  }: CreateUser): Promise<User> {
    const hashedPassword = bcrypt.hashSync(
      password,
      this.configService.get<number>('app.saltRounds'),
    );
    const [user] = await this.userModel.create(
      [{ _id: userId, username, password: hashedPassword }],
      {
        session,
      },
    );
    return user;
  }
}
export default UserService;
