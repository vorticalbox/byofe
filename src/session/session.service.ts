import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { randomBytes } from 'node:crypto';
import { Session } from './session.schema';
import { SessionDTO } from './session.dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async createSession(userID: Types.ObjectId): Promise<SessionDTO> {
    const token = `byofe_${randomBytes(16).toString('hex')}`;
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.sessionModel.deleteMany({ userID }, { session });
      const [loginSession] = await this.sessionModel.create(
        [{ userID, token }],
        { session },
      );
      await session.commitTransaction();
      return {
        token: loginSession.token,
        createdAt: loginSession.createdAt.toISOString(),
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
