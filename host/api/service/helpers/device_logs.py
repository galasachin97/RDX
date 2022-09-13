import imp
from api.service.models import *
from api.service.helpers.logs import console_logger
import subprocess, pytz
import datetime, pytz
from datetime import timezone
from api.service.helpers import timesettings
from fastapi_utils.tasks import repeat_every
import time

def save_device_logs(event, log_type, description, logtime=None):
    if logtime:
        DeviceLogs(Event=event, Type=log_type, Description = description, TSCreated=logtime).save()
    else:
        DeviceLogs(Event=event, Type=log_type, Description = description).save()
    return 1

def retrive_device_logs():
    logs = DeviceLogs.objects()
    log_list = []
    for log in logs:
        log_list.append(logs.payload())
    return log_list

# def get_uptime():
#     command = ["uptime", "-s"]
#     process = subprocess.Popen(command, stdout=subprocess.PIPE)
#     d = []
#     for line in process.stdout:            
#         d.append(line.decode("utf-8").replace("\n",""))        
#     local_zone = pytz.timezone(timesettings.get_timezone()[0])
#     local_time = datetime.datetime.strptime(d[0],"%Y-%m-%d %H:%M:%S")
#     console_logger.debug(timesettings.get_timezone()[0])
#     local_t = local_zone.localize(local_time)    
#     return local_t.astimezone(pytz.utc)

def get_uptime():
    return datetime.datetime.utcnow()    

def get_last_shutdown():
    try:
        if DeviceLogs.objects.order_by('-id').first().Event not in ["shutting down","reboot"]:
            save_device_logs("unexpected shutdown","warning","device improperly shutdown",DeviceHealth.objects.first().TSCreated)
    except AttributeError:
        save_device_logs("unexpected shutdown","warning","device improperly shutdown",datetime.datetime.utcnow())
    # command = ["last","-x","|","head","|","tac","|","grep","(to lvl 5)"]
    # process = subprocess.Popen(command, stdout=subprocess.PIPE)
    # d = []
    # for line in process.stdout:            
    #     d.append(line.decode("utf-8").replace("\n",""))        
    # return datetime.datetime.strptime(d[0],"%Y-%m-%d %H:%M:%S")
    # last -x | head | tac | grep "(to lvl 5)"

@repeat_every(seconds=60)
def device_up():
    """ function to check device is up and running after certain interval """    
    if DeviceHealth.objects():
        # console_logger.debug("checking device health")
        DeviceHealth.objects.first().update(Activity="Device is up", TSCreated=datetime.datetime.utcnow())
    else:
        DeviceHealth(Activity="Device is up").save()

def host_logs(**kwargs):
    since_unix_to_local = timesettings.unix_to_local(kwargs['since'])
    until_unix_to_local = timesettings.unix_to_local(kwargs['until'])
    # console_logger.debug(f'journalctl -u host.service --since "{since_unix_to_local}" --until "{until_unix_to_local}" -n {str(kwargs["tail"])}')
    result = subprocess.check_output(f'journalctl -u host.service --since "{since_unix_to_local}" --until "{until_unix_to_local}" -n {str(kwargs["tail"])}', shell=True, stderr=subprocess.STDOUT)
    logs = result.decode('utf-8')
    return logs
