from datetime import datetime
from typing import Dict
from pydantic import BaseModel


class Event(BaseModel):
    details: str
    date: datetime = datetime.now()
    username: str
    meta: Dict = None


def create_event(details: str, username: str, meta: Dict = None) -> Event:
    event = Event(details=details, username=username, meta=meta)
    if meta is not None:
        event["meta"] = meta
    return event
