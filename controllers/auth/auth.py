
from controllers.database import database, User, Session
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from uuid import uuid4
import bcrypt
import sqlalchemy


api_key_header = APIKeyHeader(name='access_token', auto_error=False)

router = APIRouter()


class Login(BaseModel):
    username: str
    password: str


class UserClass(BaseModel):
    ID: int
    username: str
    password: str


class Whoami(BaseModel):
    username: str


async def findUser(username: str):
    query = User.select().where((User.c.username == username))
    return await database.fetch_all(query)


async def deleteSession(username: str):
    query = Session.delete().where((Session.c.username == username) and (Session.c.expires > datetime.now()))
    await database.execute(query)


async def generateSession(username: str):
    key = str(uuid4())
    expires = datetime.now() + timedelta(hours=12)
    query = Session.insert().values(username=username, key=key, expires=expires)
    await database.execute(query)
    return {"key": key, "expires": expires}


async def findSession(key: str):
    query = Session.select().where(Session.c.key == key)
    return await database.fetch_all(query)


async def getUserByApiKey(api_key_header: str = Security(api_key_header)):
    session = await findSession(api_key_header)

    if len(session) == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or missing 'access_token' header"
        )
    return session[0]['username']


@router.post('/login')
async def login(body: Login):
    user = await findUser(body.username)
    if(len(user) == 0):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No such user",
        )
    username: str = user[0]['username'].lower()
    hashed: str = user[0]['password']
    if not bcrypt.checkpw(body.password.encode(), hashed.encode()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Incorrect password",
        )
    await deleteSession(username)
    return await generateSession(username)


@router.post('/register')
async def register(body: Login):
    user = await findUser(body.username)
    if(len(user) > 0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username taken",
        )
    username = body.username.lower()
    hashed = bcrypt.hashpw(body.password.encode('utf8'), bcrypt.gensalt())
    query = User.insert().values(username=username, password=hashed.decode())
    await database.execute(query)
    session = await generateSession(username)
    return {'username': username, **session}


@router.delete('/logout')
async def logout(apiUser: str = Depends(getUserByApiKey)):
    await deleteSession(apiUser)
    return {'message': f'{apiUser} logged out'}


@router.get('/whoami', response_model=Whoami)
async def whoami(apiUser: str = Depends(getUserByApiKey)):
    return {"username": apiUser}
