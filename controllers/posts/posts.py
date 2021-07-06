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
from controllers.votes import Votes

router = APIRouter()


class PostBody(BaseModel):
    title: constr(min_length=5, max_length=150)
    body: constr(min_length=10, max_length=500)


class PostStored(PostBody):
    id: PyObjectId = Field(..., alias="_id")
    date: datetime
    username: str
    closed_date: datetime = None
    updated_at: datetime = None
    votes: Votes = {"up": 0, "down": 0}


@router.get("", response_model=List[PostStored])
async def get_posts(
    skip: conint(gt=-1) = 0, limit: conint(le=100) = 20, _=Depends(get_user_by_apikey)
):
    cursor = (
        database.posts.aggregate(
            [
                {"$match": {"closed_date": {"$eq": None}}},
                {"$skip": skip},
                {"$limit": limit},
                {
                    "$lookup": {
                        "from": "votes",
                        "let": {"id": "$_id"},
                        "pipeline": [
                            {"$match": {"$expr": {"$eq": ["$$id", "$post_id"]}}},
                            {"$group": {"_id": "$vote_type", "count": {"$sum": 1.0}}},
                            {"$project": {"_id": 0.0, "k": "$_id", "v": "$count"}},
                            {
                                "$group": {
                                    "_id": None,
                                    "data": {"$push": {"k": "$k", "v": "$v"}},
                                }
                            },
                            {"$replaceRoot": {"newRoot": {"$arrayToObject": "$data"}}},
                        ],
                        "as": "votes",
                    }
                },
                {
                    "$project": {
                        "title": "$title",
                        "body": "$body",
                        "date": "$date",
                        "username": "$username",
                        "closed_date": "$closed_date",
                        "updated_at": "$updated_at",
                        "votes": {"$arrayElemAt": ["$votes", 0]},
                    }
                },
            ]
        )
        # database.posts.find()
        # .sort("date", -1)
        # .skip(skip)
        # .limit(limit)
    )
    return [doc async for doc in cursor]


@router.post("", response_model=PostStored)
async def save_post(post: PostBody, username=Depends(get_user_by_apikey)):
    date = datetime.now()
    post_id = ObjectId()
    post = PostStored(
        **{"_id": post_id, "date": date, "username": username, **post.dict()}
    )
    event = create_event("created new post", username, "posts", {"post_id": post_id})
    async with await client.start_session() as s:
        async with s.start_transaction():
            await database.events.insert_one(event.dict())
            await database.posts.insert_one(post.dict())
            await database.users.update_one(
                {"username": username}, {"$inc": {"posts": 1}}
            )
    return {**post.dict(), "_id": post_id}


@router.put("/{_id}", response_model=PostStored)
async def update_post(body: PostBody, _id: str, username=Depends(get_user_by_apikey)):
    # body = body.dict()
    post_id = ObjectId(_id)
    post = await database.posts.find_one({"_id": post_id, "closed_date": {"$eq": None}})
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    if post.get("username", None) != username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You may not edit this post"
        )
    date = datetime.now()

    # post = PostStored(
    #     **{"_id": post_id, "date": date, "username": username, **post.dict()}
    # )
    event = create_event("edited post", username, "posts", {"post_id": post_id})
    async with await client.start_session() as s:
        async with s.start_transaction():
            await database.events.insert_one(event.dict())
            await database.posts.update_one(
                {"_id": post_id},
                {
                    "$set": {
                        "title": body.title,
                        "body": body.body,
                        "updated_at": date,
                    }
                },
            )
    return {**post, **body.dict(), "_id": post_id, "updated_at": date}


# delete
@router.delete("/{_id}", response_model=PostStored)
async def close_post(_id: str, username=Depends(get_user_by_apikey)):
    post = await database.posts.find_one(
        {"_id": ObjectId(_id), "closed_date": {"$eq": None}}
    )
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    if post.get("username", None) != username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You may not close this post"
        )
    event = create_event("post closed", username, "posts")
    closed_date = datetime.now()
    async with await client.start_session() as s:
        async with s.start_transaction():
            await database.events.insert_one(event.dict())
            await database.posts.update_one(
                {"_id": ObjectId(_id)}, {"$set": {"closed_date": closed_date}}
            )

    return {"closed_date": closed_date, **post}


# vote
# inc post up/down
# inc user karma
