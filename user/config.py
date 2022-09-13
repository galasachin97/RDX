import os, sys, json


def get_host():
    env_file = os.path.join(os.getcwd(),'envs','env.json')
    with open(env_file) as f:
        data = json.load(f)
        return data

class Config:
    SECRET_KEY = "e61ce28e801e466eb3c1701432a8f60c6f7069d2602f43ebac3df93eb986bce8"
    ACCESS_SECRET_KEY = 'd62e127173364451800980af56ce47d6d62e127173364451800980af56ce47d6'
    EMAIL_URL = 'http://base:8000/api/v1/base/send/email'
    ACCESS_TOKEN_EXPIRES_IN = 600 #--seconds
    REFRESH_TOKEN_EXPIRES_IN = 86400 #--seconds
    DEFAULT_EMAIL_COUNT_EXPIRY = 86400 #--seconds
    DEFAULT_EMAIL_ATTEMPTS_ALLOWED = 5 # number of attempts allowed
    OTP_INTERVAL = 600 #--seconds
    OTP_SECRET = "QHMPGBDM6QPR6UBT"
    ALGORITHM = "HS256"    
    HTTP_PROTO = "http://"
    CAMERA_MANAGEMENT = "http://camera:8000/api/v1/camera/"
    STATICFILESERVER = 'http://'+get_host().get('HOST')+':8000/static_server/'       
    SERVICEMANAGEMENT = 'http://service:8000/api/v1/service/'
    SOCKETSERVERAPI = 'http://socketserver:8000/'
    BASE = 'http://base:8000/api/v1/base/'
    HOST = 'http://'+get_host().get('HOST')+':8000/api/v1/host/'
    HARDWARE_VERSION = "jetson_nano"
    SOFTWARE_VERSION = "2.0.8"
    OTPATTEMPTSLIMIT = 8
    # OTP_MAIL = "https://onp5pv8s07.execute-api.ap-south-1.amazonaws.com/dev/send-otp"
    OTP_MAIL = "http://marketplace.diycam.com/api/v1/users/otp"

class TESTConfig:
    BASE = 'http://'+get_host().get('HOST')+':8000/api/v1/base/'
    SECRET_KEY = "e61ce28e801e466eb3c1701432a8f60c6f7069d2602f43ebac3df93eb986bce8"
    ACCESS_SECRET_KEY = 'd62e127173364451800980af56ce47d6d62e127173364451800980af56ce47d6'
    EMAIL_URL = 'http://'+get_host().get('HOST')+':8000/api/v1/base/send/email'
    ACCESS_TOKEN_EXPIRES_IN = 600 #--seconds
    REFRESH_TOKEN_EXPIRES_IN = 86400 #--seconds
    DEFAULT_EMAIL_COUNT_EXPIRY = 86400 #--seconds
    DEFAULT_EMAIL_ATTEMPTS_ALLOWED = 5 # number of attempts allowed
    OTP_INTERVAL = 600 #--seconds
    OTP_SECRET = "QHMPGBDM6QPR6UBT"
    ALGORITHM = "HS256"    
    HTTP_PROTO = "http://"
    CAMERA_MANAGEMENT = 'http://'+get_host().get('HOST')+":8000/api/v1/camera/"
    STATICFILESERVER = 'http://'+get_host().get('HOST')+':8000/static_server/'       
    SERVICEMANAGEMENT = 'http://'+get_host().get('HOST')+':8000/api/v1/service/'
    SOCKETSERVERAPI = 'http://'+get_host().get('HOST')+':8000/'
    BASE = 'http://'+get_host().get('HOST')+':8000/api/v1/base/'
    HOST = 'http://'+get_host().get('HOST')+':8000/api/v1/host/'
    HARDWARE_VERSION = "jetson_nano"
    SOFTWARE_VERSION = "2.0.8"
    OTPATTEMPTSLIMIT = 8