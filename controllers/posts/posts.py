from controllers.database import metadata, database, Post
from controllers.auth import getUserByApiKey
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
import sqlalchemy

router = APIRouter()


class PostBody(BaseModel):
    title: str
    body: str


class PostStored(PostBody):
    ID: int
    date: datetime
    username: str


async def savePost(post: PostBody, username: str):
    date = datetime.now()
    query = Post.insert().values(username=username,
                                 title=post.title, body=post.body, date=date)
    return await database.execute(query)


async def getPosts(skip: int, limit: int):
    query = Post.select().offset(skip).limit(limit)
    return await database.fetch_all(query)


@router.get('/', response_model=List[PostStored])
async def Posts(skip: int = 0, limit: int = 20, apiUser = Depends(getUserByApiKey)):
    return await getPosts(skip, limit)
