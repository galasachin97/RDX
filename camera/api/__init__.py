from fastapi import FastAPI
import mongoengine
from fastapi.middleware.cors import CORSMiddleware

# mongoengine.connect(db="CameraDB",)
def dbinit():
    mongoengine.connect(db="CameraDB", host='mongo', username='diycam',
                    password='diycam123', authentication_source='admin')


def create_app():
    app = FastAPI(
        title="Camera Service",
        description="Contains camera info and camera settings",
        version="1.0.0",
        openapi_url="/api/v1/camera/openapi.json",
        docs_url="/api/v1/camera/docs",
        # docs_url=None,
        # redoc_url=None,
    )
    from .service.routes import router as service_router
    app.include_router(service_router, prefix="/api/v1/camera")
    dbinit()
    return app


app = create_app()

origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
