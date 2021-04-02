import os

from dotenv import load_dotenv
from mongotransactions import Database

load_dotenv()

DATABASE_URL: str = os.getenv('DATABASE_URL', '')
DATABASE: str = os.getenv('DATABASE', None)
database = Database(DATABASE_URL)
if DATABASE is not None:
    database.set_database(DATABASE)