import os, json

def get_host():
    env_file = os.path.join(os.getcwd(),'envs','env.json')
    with open(env_file) as f:
        data = json.load(f)
        return data
    
class Config:
    env_data = get_host()
    SECRET_KEY = "e61ce28e801e466eb3c1701432a8f60c6f7069d2602f43ebac3df93eb986bce8"
    ACCESS_SECRET_KEY = 'd62e127173364451800980af56ce47d6d62e127173364451800980af56ce47d6'
    SECRET = "8tFXLF46fRUkRFqJrfMjIbYAYeEJKyqB "
    ACCESS_TOKEN_EXPIRES_IN = 86400 #--seconds
    REFRESH_TOKEN_EXPIRES_IN = 86400 #--seconds
    OTP_INTERVAL = 600 #--seconds
    OTP_SECRET = "QHMPGBDM6QPR6UBT"
    ALGORITHM = "HS256"
    HTTP_PROTO = "http://"
    USER_MANAGEMENT = "http://user_info:8000/api/v1/user/"
    STATICFILESERVER = '/static_server/'     
    SERVICEMANAGEMENT = 'http://service:8000/api/v1/service/'
    SOCKETSERVERAPI = 'http://socketserver:8000/'
    BASE = 'http://base:8000/api/v1/base/'
    HOST = 'http://{}:80/api/v1/host/'.format(env_data["HOST"]) 
    SCHEDULER_DB = "CameraDB"
    SCHEDULER_COLLECTION = "jobs"
    SCHEDULER_URI = "mongodb://diycam:diycam123@mongo"
    VERIFY_REPEAT_TIME_HOURS = 12
    HARDWARE_VERSION = "jetson_nano"
    SOFTWARE_VERSION = "V1.0.1"
    CAMERAHEALTHCHECK = int(60*5)
    HARDWARE_TYPE = 'AI Box'
    STATIC_IMAGE = 'static_image/image_not_available.png'
    ALERT_REPORT = "Alert"
    ALERT_REPORT_SYNC_INTERVAL = 1800 #--seconds
    SOCKET_DELETE_ACK = 3600 #--seconds
    