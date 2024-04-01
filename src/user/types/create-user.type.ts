import { ClientSession, Model, Types } from 'mongoose';
export class CreateUser {
  userId: Types.ObjectId;
  username: string;
  password: string;
  session: ClientSession;
}
export default CreateUser;
