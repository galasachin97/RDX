from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mongoengine
from api.service.helpers import responses

def dbinit():
    #mongoengine.connect(db="TestDB", host='mongo', username='root', password='example', authentication_source='admin')
    mongoengine.connect(db="BaseDB", host='mongo', username='diycam', password='diycam123', authentication_source='admin')

def create_app():
    dbinit()
    app = FastAPI(
        title="Base Service",
        description="Contains device auth, device activation and alerts",
        version="1.0.0",
        openapi_url="/api/v1/base/openapi.json",
        docs_url="/api/v1/base/docs",
        # docs_url=None, 
        # redoc_url=None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    response = {
        500: responses._500()
    }
    from .service.routes import router as service_router
    app.include_router(service_router, prefix="/api/v1/base", responses=response)
    return app

app = create_app()       