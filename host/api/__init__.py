from doctest import Example
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mongoengine

from fastapi.staticfiles import StaticFiles
from pathlib import Path

from api.service.helpers.logs import console_logger

def dbinit():
    while True:
        try:
            mongoengine.connect(db="HostDB", port=27017, host = "localhost", username = "diycam", password = "diycam123", authentication_source='admin')
            break
        except Exception as e:
            console_logger.debug(e)
            pass

def create_app():
    app = FastAPI(
        title="Host Service",
        description="Contains network and other host operations",
        version="1.0.0",
        openapi_url="/api/v1/host/openapi.json",
        docs_url="/api/v1/host/docs"
        # docs_url=None, 
        # redoc_url=None,
    )
    dbinit()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from .service.routes import router as service_router
    app.include_router(service_router, prefix="/api/v1/host")
    return app


app = create_app()