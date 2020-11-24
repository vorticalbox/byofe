# byofe
simple message board

# Dev

create a .env file with a sqlite or postgre uri

```
DATABASE_URL=sqlite:///./byofe.db
```

to have the app reload on changes run

```
uvicorn main:app --reload 
```

or to get the most speed -w is the number of workers

```
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```
