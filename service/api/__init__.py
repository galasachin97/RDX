from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mongoengine
# from api.service.helpers import responses

def dbinit():
    mongoengine.connect(
        db="ServiceDB", 
        host='mongo', 
        username='diycam', 
        password='diycam123', 
        authentication_source='admin'
    )

def create_app():
    dbinit()
    app = FastAPI(
        title="Service Management Service",
        description="Manages service and service registry",
        version="1.0.0",
        openapi_url="/api/v1/service/openapi.json",
        docs_url="/api/v1/service/docs",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # response = {
    #     500: responses._500()
    # }
    from api.service.routes import router as service_router
    app.include_router(service_router, prefix="/api/v1/service")
    return app

app = create_app()