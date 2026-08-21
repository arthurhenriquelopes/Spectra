import os
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.api.websocket import router as ws_router
from src.api.routes import router as config_router

app = FastAPI()
app.include_router(ws_router)
app.include_router(config_router)

# Mount static files
app.mount("/static", StaticFiles(directory="web"), name="static")
if os.path.exists(os.path.join("web", "css")):
    app.mount("/css", StaticFiles(directory=os.path.join("web", "css")), name="css")
if os.path.exists(os.path.join("web", "js")):
    app.mount("/js", StaticFiles(directory=os.path.join("web", "js")), name="js")

@app.get("/")
async def read_index(request: Request):
    """Serves the main index.html file."""
    return FileResponse(os.path.join('web', 'index.html'))
