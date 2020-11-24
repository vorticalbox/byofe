from dotenv import load_dotenv
import os
import databases
import sqlalchemy
load_dotenv()

DATABASE_URL: str = os.getenv('DATABASE_URL') or ''

database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

engine = sqlalchemy.create_engine(
    DATABASE_URL
)

User = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, unique=True),
    sqlalchemy.Column("username", sqlalchemy.String,
                      nullable=False, index=True, unique=True),
    sqlalchemy.Column("password", sqlalchemy.String, nullable=False),
)

Session = sqlalchemy.Table(
    "sessions",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, unique=True),
    sqlalchemy.Column("username", sqlalchemy.String,
                      nullable=False, index=True),
    sqlalchemy.Column("key", sqlalchemy.String,
                      nullable=False, index=True, unique=True),
    sqlalchemy.Column("expires", sqlalchemy.TIMESTAMP, nullable=False),
)

Post = sqlalchemy.Table(
    "posts",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer,
                      primary_key=True, index=True, unique=True),
    sqlalchemy.Column("title", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("body", sqlalchemy.Text, nullable=False),
    sqlalchemy.Column("username", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("date", sqlalchemy.TIMESTAMP, nullable=False),
)


metadata.create_all(engine)
