from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from controllers.auth import get_user_by_apikey
from controllers.database import database, client
from controllers.events import create_event, Event
from pydantic import BaseModel, constr, conint, Field
from controllers.posts import PostStored
from controllers.auth import UserClass
from typing import Dict, List


class GDPR(BaseModel):
    posts: List[PostStored]
    comments: List
    events: List[Event]
    user: UserClass


router = APIRouter()


def parse_object(obj: Dict):
    # objectIds aren't json parsable this function turns _id into str
    if isinstance(obj, Dict):
        m = {}
        for k, v in obj.items():
            m[k] = str(v) if ObjectId.is_valid(v) else v
        return m
    return obj


@router.get("/generate", response_model=GDPR)
async def get_posts_handler(username=Depends(get_user_by_apikey)):
    report = {
        "posts": [],
        "comments": [],
        "events": [],
        "user": await database.users.find_one({"username": username}),
    }
    event = create_event("requested gdpr data", username, "gdpr")
    await database.events.insert_one(event.dict())
    cursor = database.posts.find({"username": username}).sort("date", -1)
    async for doc in cursor:
        report["posts"].append(doc)
    cursor = database.comments.find({"username": username}).sort("date", -1)
    async for doc in cursor:
        report["comments"].append(doc)
    cursor = database.events.find({"username": username}, {"_id": 0}).sort("date", -1)
    async for doc in cursor:
        if "meta" in doc:
            doc["meta"] = parse_object(doc.get("meta", {}))

        report["events"].append(doc)
    return report
