from datetime import datetime
from typing import Dict

from mongotransactions import Transaction
from pydantic import BaseModel


class Event(BaseModel):
    details: str
    date: datetime
    username: str
    meta: Dict = None


def create_event(details: str, username: str, meta: Dict = None):
    event = {
        'details': details,
        'date': datetime.now(),
        'username': username,
    }
    if meta is not None:
        event['meta'] = meta
    return event
