from datetime import datetime
from typing import List, Dict

from bson.objectid import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, constr, conint, Field
from starlette import status

from controllers.auth import get_user_by_apikey
from controllers.database import database, client
from controllers.events import create_event
from controllers.helpers import PyObjectId

router = APIRouter()


class PostBody(BaseModel):
    title: constr(min_length=5, max_length=150)
    body: constr(min_length=10, max_length=500)


class PostStored(PostBody):
    id: PyObjectId = Field(..., alias="_id")
    date: datetime
    username: str
    closed_date: datetime = None
    # up_vote: int = 0
    # down_vote: int = 0


async def get_posts(skip: int, limit: int):
    cursor = (
        database.posts.find({"closed_date": {"$eq": None}})
        .sort("date", -1)
        .skip(skip)
        .limit(limit)
    )
    return [doc for doc in cursor]


@router.get("", response_model=List[PostStored])
async def get_posts_handler(
    skip: conint(gt=-1) = 0, limit: conint(le=100) = 20, _=Depends(get_user_by_apikey)
):
    return await get_posts(skip, limit)


@router.post("", response_model=PostStored)
async def save_post(post: PostBody, username=Depends(get_user_by_apikey)):
    date = datetime.now()
    post_id = ObjectId()
    post = PostStored(
        **{"_id": post_id, "date": date, "username": username, **post.dict()}
    )
    event = create_event("created new post", username, {"post_id": post_id})
    async with await client.start_session() as s:
        async with s.start_transaction():
            await database.events.insert_one(event.dict())
            await database.posts.insert_one(post.dict())
            await database.users.update_one(
                {"username": username}, {"$inc": {"posts": 1}}
            )
    return {**post.dict(), "_id": post_id}


# delete
@router.put("/{_id}", response_model=PostStored)
async def close_post_handler(_id: str, username=Depends(get_user_by_apikey)):
    post = await database.posts.find_one({"_id": ObjectId(_id)})
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    if post.get("username", None) != username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You my not close this post"
        )
    event = create_event("post closed", username)
    closed_date = datetime.now()
    async with await client.start_session() as s:
        async with s.start_transaction():
            await database.events.insert_one(event.dict())
            await database.posts.update_one(
                {{"_id": ObjectId(_id)}}, {"$set": {"closed_date": closed_date}}
            )

    return {"closed_date": closed_date, **post}


# vote
# inc post up/down
# inc user karma
