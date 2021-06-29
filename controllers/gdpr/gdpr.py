from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from controllers.auth import get_user_by_apikey
from controllers.database import database, client
from controllers.events import create_event, Event
from pydantic import BaseModel, constr, conint, Field
from controllers.posts import PostStored
from controllers.auth import UserClass
from typing import List


class GDPR(BaseModel):
    posts: List[PostStored]
    comments: List
    events: List[Event]
    user: UserClass


router = APIRouter()


@router.get("/generate", response_model=GDPR)
async def get_posts_handler(username=Depends(get_user_by_apikey)):
    report = {
        "posts": [],
        "comments": [],
        "events": [],
        "user": await database.users.find_one({"username": username}),
    }
    event = create_event("requested gdpr data", username)
    await database.events.insert_one(event.dict())
    c = database.posts.find({"username": username}).sort("date", -1)
    async for doc in c:
        report["posts"].append(doc)
    c = database.events.find({"username": username}, {"_id": 0}).sort("date", -1)
    async for doc in c:
        if "meta" in doc:
            m = {}
            for k, v in doc.get("meta").items():
                m[k] = str(v) if ObjectId.is_valid(v) else v
            doc["meta"] = m

        report["events"].append(doc)
    return report
