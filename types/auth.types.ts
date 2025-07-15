export class User {
  username: string;
  password: string;
  createdAt: Date;
  postCount: number;
  commentCount: number;

  constructor(username: string, hash: string) {
    this.username = username;
    this.password = hash;
    this.createdAt = new Date();
    this.postCount = 0;
    this.commentCount = 0;
  }
}

export class Session {
  token: string;
  username: string;
  createdAt: Date;
  expiresAt: Date;
  constructor(token: string, username: string, expiresIn: number) {
    this.token = token;
    this.username = username;
    this.createdAt = new Date();
    this.expiresAt = new Date(this.createdAt.getTime() + expiresIn * 1000);
  }
}
