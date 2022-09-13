
class Config:
    SECRET_KEY = "e61ce28e801e466eb3c1701432a8f60c6f7069d2602f43ebac3df93eb986bce8"

    # jwt config
    ALGORITHM = "HS256"
    DECODING = "utf-8"

    ACCESS_TOKEN_EXPIRE = 60 # in seconds
    REFRESH_TOKEN_EXPIRE = 3600 # in seconds

class TestConfig(Config):
    VERIFY_REPEAT_TIME = 86400
    STATIC_SERVER_SIZE = 20000
    FETCH_SERVICES = "http://service:8000/api/v1/service"
    TEMPLATE_PATH = "api/service/helpers/email-templates"
    STATICFILE_DIR = "static_server"
    FIFO_DIR = "alertreport"
    DATA_COLLECTION_DIR = "health"
    HARDWARE_VERSION = "JETSON_NANO"
    HARDWARE_TYPE = "DN4G"
    GET_CAMERA_URL = "http://camera:8000/api/v1/camera/unprotected?CameraID={}"
    SOFTWARE_VERSION = "2.0.8"
    RESET_MAIL_URL = 'http://marketplace.diycam.com/api/v1/users/otp'    
    VERIFY_USER_URL = 'http://marketplace.diycam.com/api/v1/users/otp'
    CAMERA_INACTIVE_ALERT_EMAIL = 'http://marketplace.diycam.com/api/v1/users/alert/camera/device'
    CLOUD_URL = "http://marketplace.diycam.com"
    Warrenty = 365
    DIYCAMTICKETINGURL = 'https://ticket.diycam.com/api/v1/tickets/create'
    STATIC_IMAGE = 'static_image/image_not_available.png'