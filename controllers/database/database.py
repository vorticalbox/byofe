import os

from dotenv import load_dotenv
import motor.motor_asyncio

load_dotenv()

DATABASE_URL: str = os.getenv('DATABASE_URL', '')
DATABASE: str = os.getenv('DATABASE', 'byofe')

client = motor.motor_asyncio.AsyncIOMotorClient(DATABASE_URL)
database = client[DATABASE]
