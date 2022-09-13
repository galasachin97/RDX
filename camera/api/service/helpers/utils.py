import os, json, subprocess
from api.service.models import *
import uuid, requests
import config
from .logs import console_logger



def get_host():
    try:
        console_logger.debug(os.getcwd())
        env_file = os.path.join(os.getcwd(),'envs','env.json')
        with open(env_file) as f:
            data = json.load(f)
            return data
    except Exception as e:
        console_logger.debug(e)
        return None



def validate_rtsp(link:str):
    # this function validates the unique ip exist in database    
    try:           
        data = link.split('@')[0].split('/')[-1].split(':')
        ip = link.split('@')[1].split('/')[0]        
        return data
    except:
        return 0

def generate_unique_cam_id():
    cam_id = str(uuid.uuid4().hex)
    while Camera.objects(Camera_id=cam_id):
        cam_id = str(uuid.uuid4().hex)
    return cam_id
    


async def getUSBCameras():
    # same endpoint added host code
    CamOutput = subprocess.Popen(['v4l2-ctl --list-devices | grep /dev/video'], shell=True, stdout=subprocess.PIPE)
    line_data = []
    for line in CamOutput.stdout:
        line_data.append(line.decode('utf8').strip('\t').strip('\n'))    
    
    device_list = []
    for link in line_data:
        command = 'v4l2-ctl --list-formats --device {}'.format(link)                
        CamOutput = subprocess.Popen([command], shell=True, stdout=subprocess.PIPE)                                
        lines= []        
        for line_new in CamOutput.stdout:                                            
            lines.append(line_new.decode().strip('\t').strip('\n'))            
        if len(lines)>3:    
            print(lines)
            device_list.append(link)    
    return device_list



def fetchuserdata(token, activity=None):
    # fetch user information from user container
    console_logger.debug("Getting User Details")
    headers = {
        'x-access-token': token
    }
    payload = {"data":None}
    response = requests.request("GET", config.Config.UserManagementUrl, headers=headers, data=payload)

    return response

