from controllers.database import metadata, database, Post
from controllers.auth import getUserByApiKey
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List

router = APIRouter()

postColumns = ["id", "title", "body", "username", "date"]


class PostBody(BaseModel):
    title: str
    body: str


class PostStored(PostBody):
    id: int
    date: datetime
    username: str


async def insertPost(post: PostBody, username: str):
    date = datetime.now()
    query = Post.insert().values(username=username,
                                 title=post.title, body=post.body, date=date)
    return await database.execute(query)


async def getPosts(skip: int, limit: int):
    query = Post.select().offset(skip).limit(limit)
    return await database.fetch_one(query)


async def getPost(id: int):
    query = Post.select().where(Post.c.id == id)
    post = await database.fetch_all(query)
    return dict(zip(postColumns, post[0]))


@router.get('/', response_model=List[PostStored])
async def posts(skip: int = 0, limit: int = 20, apiUser=Depends(getUserByApiKey)):
    return await getPosts(skip, limit)


@router.get('/{id}', response_model=PostStored)
async def posts(id: int = 0, apiUser=Depends(getUserByApiKey)):
    return await getPost(id)


@router.post('/')
async def savePost(body: PostBody, apiUser=Depends(getUserByApiKey)):
    return await insertPost(body, apiUser)
