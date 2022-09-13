from config import Config
from api.service.helpers.logs import console_logger


''' User Management urls '''
send_activity_log   = Config.USER_MANAGEMENT+'log/activity'  #<------- send activity info to user management


''' Base Container urls '''
get_device_info     = Config.BASE+'device/unprotected'  #<------------ get device information from base container 
send_camera_alert   = Config.BASE+'alert'               #<------------ send camera as alert to base
send_camera_alert_url = Config.BASE+'cameraalert'       #<------------ direct camera alert sending functionality in base
send_sync_trigger = Config.BASE+'synctrigger'


''' Socket Server Urls '''
# refresh_deepstreams = Config.SOCKETSERVERAPI+'deepstream'
# refresh_rooms       = Config.SOCKETSERVERAPI+'rooms'
# send_socket = Config.SOCKETSERVERAPI+"camera"           #<------------ Notify about new added camera to socket server
# send_schedule = Config.SOCKETSERVERAPI+"scheduler"      #<------------ send current schedule info to socket server
# send_modules = Config.SOCKETSERVERAPI+"service"         #<------------ Send modules changed after service added / camera restart
# restart_service = Config.SOCKETSERVERAPI+"restart"      #<------------ update camera info in socket if service is restare or added 
# give_updates_to_service = Config.SOCKETSERVERAPI+"stop" #<------------ delete the camera
# update_parameters = Config.SOCKETSERVERAPI+"parameters" #<------------ Update the config parameters at socket

send_socket = Config.SOCKETSERVERAPI+"socket/camera"
send_schedule = Config.SOCKETSERVERAPI+"socket/scheduler"
send_modules = Config.SOCKETSERVERAPI+"socket/service"
restart_service = Config.SOCKETSERVERAPI+"socket/restart"
give_updates_to_service = Config.SOCKETSERVERAPI+"socket/stop"
update_parameters = Config.SOCKETSERVERAPI+"socket/parameters"
delete_acknowlegement = Config.SOCKETSERVERAPI+"socket/acknowledgement"
service_status = Config.SOCKETSERVERAPI+"socket/service/status"



''' ServiceManager Urls '''
# activate_services   = Config.SERVICEMANAGEMENT+'activate'
activate_services   = 'http://service:8000/api/v1/service/'+'activate'
deactivate_services   = 'http://service:8000/api/v1/service/'+'deactivate'
# deactivate_services = Config.SERVICEMANAGEMENT+'deactivate'
get_services_full = "http://service:8000/"+"api/v1/service/"


''' Host Url '''
image_capture       = Config.HOST+'capture'
health_check        = Config.HOST+'health'
usb_list            = Config.HOST+'usblist'


''' Socket Urls '''
# send_socket = "http://192.168.1.123:8000/camera"
# send_schedule = "http://192.168.1.123:8000/scheduler"
# send_modules = "http://192.168.1.123:8000/service"
# restart_service = "http://192.168.1.123:8000/restart"
# send_socket = "http://192.168.0.155:8000/camera"
# send_schedule = "http://192.168.0.155:8000/scheduler"
# send_modules = "http://192.168.0.155:8000/service"
# restart_service = "http://192.168.0.155:8000/restart"



