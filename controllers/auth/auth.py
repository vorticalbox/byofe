from datetime import datetime, timedelta
from uuid import uuid4

import bcrypt
from fastapi import APIRouter, HTTPException, status, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from mongotransactions import Transaction
from pydantic import BaseModel
from controllers.database import database, client
from controllers.events import create_event

Users = database['users']
Sessions = database['sessions']
Events = database['events']

api_key_header = APIKeyHeader(name='access_token', auto_error=False)

router = APIRouter()


class Session(BaseModel):
    username: str
    token: str
    expires: datetime


class Login(BaseModel):
    username: str
    password: str


class UserClass(BaseModel):
    username: str
    password: str
    posts: int = 0
    comments: int = 0
    karma: int = 0


class Whoami(BaseModel):
    username: str


def generate_session(username: str):
    key = str(uuid4())
    expires = datetime.now() + timedelta(hours=12)
    session = {"token": key, "expires": expires, 'username': username}
    return session


async def find_session(key: str) -> dict:
    return await Sessions.find_one({'token': key})


async def get_user_by_apikey(api_key_header: str = Security(api_key_header)):
    session = await find_session(api_key_header)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or missing 'access_token' header"
        )
    return session.get('username', None)


@router.post('/login', response_model=Session)
async def login(body: Login):
    user = await database.users.find_one({'username': body.username})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No such user",
        )
    username: str = user.get('username')
    hashed: str = user.get('password')
    if not bcrypt.checkpw(body.password.encode(), hashed.encode()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Incorrect password",
        )
    session = generate_session(username)
    async with await client.start_session() as s:
        async with s.start_transaction():
            await Sessions.delete_one({'username': username}, session=s)
            await Sessions.insert_one(session, session=s)
    return session


@router.post('/register', response_model=Session)
async def register(body: Login):
    user = await database.users.find_one({'username': body.username})
    if user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username taken",
        )
    username = body.username.lower()
    hashed = bcrypt.hashpw(body.password.encode('utf8'), bcrypt.gensalt())
    user = UserClass(**{'username': username, 'password': hashed.decode()})
    event = create_event('user created account', username)
    session = generate_session(username)
    async with await client.start_session() as s:
        async with s.start_transaction():
            await Events.insert_one(event, session=s)
            await Users.insert_one(user.dict(), session=s)
            await Sessions.delete_one({'username': username}, session=s)
            await Sessions.insert_one(session, session=s)
    return {'username': username, **session}


@router.delete('/logout')
async def logout(api_user: str = Depends(get_user_by_apikey)):
    async with await client.start_session() as s:
        async with s.start_transaction():
            await Events.insert_one(create_event('user logged out', api_user), session=s)
            await Sessions.delete_one({'username': api_user}, session=s)
    return {'message': f'{api_user} logged out'}


@router.get('/whoami', response_model=Whoami)
def whoami(api_user: str = Depends(get_user_by_apikey)):
    return {"username": api_user}
