import json
import os

class Config:
    SECRET_KEY = "e61ce28e801e466eb3c1701432a8f60c6f7069d2602f43ebac3df93eb986bce8"

    # jwt config
    ALGORITHM = "HS256"
    DECODING = "utf-8"

    ACCESS_TOKEN_EXPIRE = 60 # in seconds
    REFRESH_TOKEN_EXPIRE = 3600 # in seconds
    STATICFILESERVER = "/static_server/"

    __version__ = "2.0.8"
    
class TestConfig(Config):
    def read_env():
        data = json.loads(open(os.path.join(os.getcwd(), "env.json"), 'r').read())
        return data

    CAMERA_SERVICE_ROUTE = "http://cameras:8000/api/v1/camera/modules"    
    BASE_SERVICE_URL = "http://base:8000/api/v1/base"
    VERIFY_REPEAT_TIME_HOURS = 12
    HOST_PORT = 8750

class ProductionConfig(Config):
    BASE_SERVICE_URL = "http://base:8000/api/v1/base"
    CAMERA_SERVICE_URL = "http://camera:8000/api/v1/camera"