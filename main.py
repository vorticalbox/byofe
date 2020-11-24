from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from controllers import heart, auth, database, posts
app = FastAPI(name='BYOFE', docs_url=None, redoc_url='/docs')


@app.on_event("startup")
async def startup():
    await database.database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.database.disconnect()


@app.get("/")
async def docs():
    return RedirectResponse("/docs")

app.include_router(heart.router)

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"],
)

app.include_router(
    posts.router,
    prefix="/post",
    tags=["posts"]
)