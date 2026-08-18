import os
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.api.websocket import router as ws_router
from src.api.routes import router as config_router

app = FastAPI()
app.include_router(ws_router)
app.include_router(config_router)

# Mount the 'web' directory to serve static files (CSS, JS)
app.mount("/static", StaticFiles(directory="web"), name="static")

@app.get("/")
async def read_index(request: Request):
    """Serves the main index.html file."""
    return FileResponse(os.path.join('web', 'index.html'))
