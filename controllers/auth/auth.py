from datetime import datetime, timedelta
from uuid import uuid4

import bcrypt
from fastapi import APIRouter, HTTPException, status, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from mongotransactions import Transaction
from pydantic import BaseModel
from pymongo.collection import Collection

from controllers.database import database
from controllers.events import create_event

Users: Collection = database.get_collection('users')
Sessions: Collection = database.get_collection('sessions')

api_key_header = APIKeyHeader(name='access_token', auto_error=False)

router = APIRouter()


class Session(BaseModel):
    username: str
    key: str
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


def find_user(username: str):
    return Users.find_one({'username': username})


def save_user(trx: Transaction, user: UserClass):
    trx.insert('users', user.dict())


def delete_session(trx: Transaction, username: str) -> None:
    trx.remove('sessions', {'username': username})
    trx.run()


def generate_session(trx: Transaction, username: str):
    key = str(uuid4())
    expires = datetime.now() + timedelta(hours=12)
    session = {"key": key, "expires": expires, 'username': username}
    trx.insert('sessions', session)
    return session


def find_session(key: str):
    return Sessions.find_one({'key': key})


def get_user_by_apikey(api_key_header: str = Security(api_key_header)):
    session = find_session(api_key_header)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or missing 'access_token' header"
        )
    return session.get('username', None)


@router.post('/login', response_model=Session)
def login(body: Login):
    user = find_user(body.username)
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
    trx = Transaction(database)
    delete_session(trx, username)
    session = generate_session(trx, username)
    trx.run()
    return session


@router.post('/register', response_model=Session)
def register(body: Login):
    user = find_user(body.username)
    if user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username taken",
        )
    trx = Transaction(database)
    username = body.username.lower()
    hashed = bcrypt.hashpw(body.password.encode('utf8'), bcrypt.gensalt())
    user = UserClass(**{'username': username, 'password': hashed.decode()})
    save_user(trx, user)
    create_event(trx, 'user logged in', username)
    session = generate_session(trx, username)
    trx.run()
    return {'username': username, **session}


@router.delete('/logout')
def logout(api_user: str = Depends(get_user_by_apikey)):
    trx = Transaction(database)
    create_event(trx, 'user logged out', api_user)
    delete_session(trx, api_user)
    return {'message': f'{api_user} logged out'}


@router.get('/whoami', response_model=Whoami)
def whoami(api_user: str = Depends(get_user_by_apikey)):
    return {"username": api_user}
