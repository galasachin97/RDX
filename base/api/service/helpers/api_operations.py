import requests
import datetime
import json
import os

from api.service.helpers.logs import console_logger



class APIOperations:
    def __init__(self) -> None:
        self.suspended_apps = []
    
    def get_user_details(self,acces_token):
        try:
            user_url = "http://user_info:8000/api/v1/user"
            refresh_url = "http://user_info:8000/api/v1/user/refresh"
            
            headers = {
                "Authorization" : "Bearer {}".format(acces_token)                
                }

            response = requests.get(url=user_url, timeout=5,headers=headers)  
            
            if response.status_code == 200:
                return json.loads(response.text)
            else:
                return False
        except Exception as e:
            console_logger.debug(e)
    
    def fifo_soc(self,data):
        try:
            socket_url = "http://socketserver:8000/socket/fifo"
            headers = {
                "content-type": "application/json"
            }
            console_logger.debug(str(data.result()))
            payload = {"detail": str(data.result())}
            response = requests.request("POST", socket_url, headers=headers, data=json.dumps(payload), timeout=10)
            return True
        except Exception as e:
            console_logger.debug(e)
            return False
        
    def storage_info(self):
        data = json.loads(open("./mounts/env.json", 'r').read())
        response = requests.request(
            method="GET",
            url="http://{}:{}/api/v1/host/device/details".format(data["HOST"], data["PORT"]),
        )
        
        return json.loads(response.text)
    

    def service_validity(self):
        try:
            url = "http://service:8000/api/v1/service/validity"

            response = requests.get(url=url, timeout=5)  
            
            if response.status_code == 200:
                console_logger.debug(response.text)
                return json.loads(response.text)
            else:
                return False
        except Exception as e:
            console_logger.debug(e)
    
    def fetchAppStatus(self,api_call:bool = False):
        try:
            if api_call:
                console_logger.debug("calling service api")
                url = "http://service:8000/api/v1/service/?all=true&status=suspended"
                response = requests.get(url=url, timeout=5)  
                if response.status_code == 200:
                    # console_logger.debug(response.text)
                    apps_data = json.loads(response.text)
                    console_logger.debug(apps_data)
                    for data in apps_data["detail"]:
                        console_logger.debug(data["Service_name"])
                        self.suspended_apps.append(data["Service_name"])
                
            return self.suspended_apps
        except Exception as e:
            console_logger.debug(e)
            return self.suspended_apps