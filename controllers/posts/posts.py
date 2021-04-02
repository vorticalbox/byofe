from datetime import datetime
from typing import List, Dict

from bson.objectid import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from mongotransactions import Transaction
from pydantic import BaseModel, constr, conint, Field
from starlette import status

from controllers.auth import get_user_by_apikey
from controllers.database import database
from controllers.events import create_event
from controllers.helpers.helpers import PydanticObjectId

router = APIRouter()

Post = database.get_collection('posts')


class PostBody(BaseModel):
    title: constr(min_length=5, max_length=150)
    body: constr(min_length=10, max_length=500)


class PostStored(PostBody):
    id: PydanticObjectId = Field(None, alias='_id')
    date: datetime
    username: str
    closed_date: datetime = None
    # up_vote: int = 0
    # down_vote: int = 0


def get_posts(skip: int, limit: int):
    return list(Post.find().sort('date', -1).skip(skip).limit(limit))


@router.get('/', response_model=List[PostStored])
def get_posts_handler(skip: conint(gt=-1) = 0, limit: conint(le=100) = 20, _=Depends(get_user_by_apikey)):
    return get_posts(skip, limit)


@router.get('/{_id}', response_model=PostStored)
def get_post(_id: str, _=Depends(get_user_by_apikey)):
    return Post.find_one({'_id': ObjectId(_id)})


@router.post('/', response_model=PostStored)
def save_post(post: PostBody, username=Depends(get_user_by_apikey)):
    trx = Transaction(database)
    date = datetime.now()
    post_id = ObjectId()
    post: Dict = PostStored(**{'_id': post_id, 'date': date, 'username': username, **post.dict()}).dict()
    trx.insert('posts', post)
    create_event(trx, 'created new post', username, {'post_id': post_id})
    trx.update('users', {'username': username}, {'$inc': {'posts': 1}})
    trx.run()
    return {**post, '_id': post_id}


# delete
@router.put('/{_id}', response_model=PostStored)
def close_post_handler(_id: str, username=Depends(get_user_by_apikey)):
    post = get_post(_id, username)
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    if post.get('username', None) != username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You my not close this post"
        )
    trx = Transaction(database)
    create_event(trx, 'post closed', username)
    closed_date = datetime.now()
    trx.update_one('posts', {'_id': ObjectId(_id)}, {'$set': {'closed_date': closed_date}})
    trx.run()
    return {'closed_date': closed_date, **post}

# vote
# inc post up/down
# inc user karma
