import requests
from requests.exceptions import Timeout, ConnectionError
import json
import os

from helpers.logs import console_logger

class ApiHandler:
    def __init__(self) -> None:
        self.envs = {}
        self.current_hours = False
    
        with open(os.path.join(os.getcwd(), "envs", "env.json"), "r") as f:
            self.envs = json.loads(f.read())
        
        # self.url = "http://camera:8000/".format(self.envs["HOST"])
        self.url = "http://camera:8000/"
        self.baseUrl = "http://base:8000/"

    def fetchHours(self) -> bool:
        try:
            resp = requests.get("{}api/v1/camera/schedulehours".format(self.url, timeout=5))
            runtime = json.loads(resp.text)['data']
            if runtime == "ScheduledHours":
                self.current_hours = True
            else:
                self.current_hours = False
            return True
        except Timeout:
            return False
        except ConnectionError:
            return False

    def cameraInfoFetch(self):
        try:
            console_logger.debug("{}api/v1/camera/test/socket".format(self.url))
            resp = requests.get("{}api/v1/camera/test/socket".format(self.url), timeout=5)
            return resp.status_code, json.loads(resp.text)
        except Timeout:
            return 500, None
        except ConnectionError:
            return 500, None

    def usecaseSettingsFetch(self, service_id, camera_id):
        try:
            headers = {"content-type": "application/json"}
            data = {
                "CameraID": camera_id,
                "ServiceID": service_id
            }
            resp = requests.get(
                "{}api/v1/camera/modules/usecase/settings/unprotected".format(self.url), 
                headers=headers, params=data, timeout=5)
            return resp.status_code, json.loads(resp.text)
        except Timeout:
            return 500, None
        except ConnectionError:
            return 500, None

    def logAlert(self, payload):
        try:
            headers = {"content-type": "application/json"}
            data = json.dumps(payload)
            requests.post(
                "{}api/v1/base/alert".format(self.baseUrl), 
                headers=headers, data=data, timeout=5)
        except Timeout:
            return 500, None
        except ConnectionError:
            return 500, None

    def logReport(self, payload):
        try:
            headers = {"content-type": "application/json"}
            data = json.dumps(payload)
            requests.post(
                "{}api/v1/base/report".format(self.baseUrl), 
                headers=headers, data=data, timeout=5)
        except Timeout:
            return 500, None
        except ConnectionError:
            return 500, None


    def updateStatusService(self, data):
        try:
            headers = {"content-type":"application/json"}
            payload = {
                    "ServiceName": data.get("room"),
                    "Status": data.get("data")
                }
            data = json.dumps(payload)
            response = requests.post(
                "{}api/v1/camera/service/status".format(self.url), 
                headers=headers, data=data, timeout=5)
            return response.status_code, json.loads(response.text)
        except Timeout:
            return 500, None
        except ConnectionError:
            return 500, None

    def getStatusService(self):
        try:
            resp = requests.get("{}api/v1/camera/service/status".format(self.url), timeout=5)
            return resp.status_code, json.loads(resp.text)
        except Timeout:
            return 500, None
        except ConnectionError:
            return 500, None
        
api_handler = ApiHandler()