from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from controllers import heart, auth, posts, gdpr

app = FastAPI(name='BYOFE', docs_url='/docs', version='0.2.5')


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
# release once api is complete
# app.include_router(
#     gdpr.router,
#     prefix="/gdpr",
#     tags=["gdpr"]
# )
