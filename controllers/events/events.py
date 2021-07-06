from datetime import datetime
from typing import Dict
from pydantic import BaseModel


class Event(BaseModel):
    details: str
    date: datetime = datetime.now()
    username: str
    meta: Dict = None
    controller: str


def create_event(
    details: str, username: str, controller: str, meta: Dict = None
) -> Event:
    return Event(details=details, username=username, controller=controller, meta=meta)
