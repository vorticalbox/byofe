import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { randomBytes } from 'node:crypto';
import { Session, SessionDocumentLean } from './session.schema';
import { SessionDTO } from './session.dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}

  async createSession(
    userID: Types.ObjectId,
    session: ClientSession,
  ): Promise<SessionDTO> {
    const token = `byofe_${randomBytes(16).toString('hex')}`;
    await this.sessionModel.deleteMany({ userID }, { session });
    const [loginSession] = await this.sessionModel.create([{ userID, token }], {
      session,
    });
    return {
      token: loginSession.token,
      createdAt: loginSession.createdAt.toISOString(),
    };
  }

  async findSessionByToken(token: string): Promise<SessionDocumentLean> {
    const session = await this.sessionModel.findOne({ token }).lean().exec();
    if (!session) {
      return null;
    }
    return session;
  }
}
