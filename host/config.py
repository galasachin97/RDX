import os
class Config:
    NETPLAN_CONFIG_FOLDER = "/etc/netplan"
    NETWORKMANAGER_PATH = "/etc/network/interfaces"

class TestConfig(Config):
    BUFFER_MEMEORY_PERCENT = 0.2
    DESTINATION_PATH = os.path.join(os.getcwd(), "..", "static_server")
    BACKUP_PATH = os.path.join(os.getcwd(), "..", "static_server_backup")
    TARGET_PATH = "/home/diycam/test"
    BASE_HEALTH_URL = "http://localhost:80/api/v1/base/health"
    SERVICE_HEALTH_URL = "http://localhost:80/api/v1/service/health"
    CAMERA_HEALTH_URL = "http://localhost:80/api/v1/camera/service/health"
    USER_HEALTH_URL = "http://localhost:80/api/v1/user/service/health"
    SOCKET_HEALTH_URL = "http://localhost:80/health"
    USB_DEVICE_DISCONNECT_WEBHOOK = "http://localhost:80/api/v1/host/eject"
    GENERAL_SETTINGS_URL = "http://localhost:80/api/v1/base/staticstorage/unprotected"
    SOCKETSERVER_URL = "http://localhost:80/socket"
    SERVICE_ENV_UPDATE_URL = "http://localhost:80/api/v1/service/update/envs"
    THEME_META =  { 
        "label":"Diycam",
        "logo_white_theme":"/static_server/theme/default/logo.png",
        "logo_black_theme":"/static_server/theme/default/logo_dark.png",
        "startup_video":"/static_server/theme/default/Splash_Screen.mp4",
        "favicon":"/static_server/theme/default/favicon.ico",
        "primary_colour":"#013aa2",
        "secondary_colour":"#2d62ed",
        "button_colour1":"#00b4ff",
        "button_colour2_primary":"#0083c9",
        "button_colour2_secondary":"#0064b9",
        "status": True
    }
    SOFTWARE_VERSION = "2.0.8"
    
