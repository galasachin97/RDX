import requests, os, json
from api.utils import urls
from api.service.helpers.logs import console_logger

def get_device_info():
    # get device info from base
    headers = {"content-type":"application/json"}
    response = requests.request("GET", urls.get_device_info, timeout=20)
    if response.status_code==200:
        return json.loads(response.content)
    else:
        return 0

def reset_factory_base(data):
    # reset factory endpoint to base
    headers = {
        "content-type":"application/json"
    }
    payload = {"hardreset":data}
    response = requests.request("POST", urls.reset_factory_base, params=payload, headers=headers, timeout=20)
    console_logger.debug(response.content)
    return 0


def reset_factory_service(data):
    # reset factory endpoint to service management
    headers = {
        "content-type":"application/json"
    }
    payload = {"hardreset":data}
    response = requests.request("POST", urls.reset_factory_service, params=payload, headers=headers, timeout=20)
    console_logger.debug(response.content)
    return 0


def reset_factory_camera(data):
    # factory reset endpoint to camera
    try:        
        headers = {
            "content-type":"application/json"            
        }      
        payload = {"hardreset":data}  
        response = requests.request("GET", urls.reset_factory_camera, params=payload, headers=headers, timeout=20)
        console_logger.debug(response.content)
        return 1
    except Exception as e:
        return 0


def send_verification_mail(data):
    # send email to check email is valid
    try:
        headers = {
            "content-type":"application/json",            
        }
        response = requests.request("POST", urls.verification_email, headers=headers, data=json.dumps(data), timeout=20)
        if response.status_code == 200:
            return 1
        else:
            return 0
    except Exception as e:
        return 0



def reset_password_mail(data):
    # send forgot password email to base
    try:
        headers = {
            "content-type":"application/json",            
        }
        response = requests.request("POST", urls.reset_password_email, headers=headers, data=json.dumps(data), timeout=20)
        if response.status_code == 200:
            return 1
        else:
            return 0
    except Exception as e:
        return 0

def get_email_settings():
    # get email settings from base
    try:
        headers = {
            "content-type":"application/json",            
        }
        response = requests.request("GET", urls.check_email_setting, headers=headers, timeout=20)
        if response.status_code == 200:
            return True
        else:
            return False
    except Exception as e:
        return 0