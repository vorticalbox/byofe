from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HeartBeat(BaseModel):
    message: str = "Hello World"

@router.get('/heartbeat', response_model=HeartBeat)
def beat():
    return {"message": "Hello World"}
