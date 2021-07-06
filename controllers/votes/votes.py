from pydantic import Field, BaseModel
from controllers.helpers import PyObjectId
from enum import Enum
from datetime import datetime


class vote_type(Enum):
    up = "up"
    down = "down"


class Vote(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    post_id: PyObjectId
    date: datetime
    username: str
    vote_type: vote_type

class Votes(BaseModel):
  up: int = 0
  down: int = 0
