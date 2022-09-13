from fastapi_utils.tasks import repeat_every
import os
import requests
import json
import pyAesCrypt
from config import TestConfig as config
from api.service.models import *
from api.service.helpers.logs import console_logger
from fastapi import HTTPException
from api.service.helpers.general_helpers import retry
from requests import ConnectionError
from api.service.helpers.api_operations import APIOperations

class RestartOpertaions:
    def __init__(self):
        # Fetching authentication server
        # server = Server.objects.get(Server_role="Authentication")
        # self.hostname = server.Url if(
        #     server.Url) else 'http://{}:{}'.format(server.Ip, server.Port)
        self.device = DeviceInfo.objects.first()

    def api_call(self, url, data, headers=None, timeout=50):
        # Api call
        try:
            response = requests.post(url=url, data=json.dumps(
                data), headers=headers, timeout=timeout)
            code = response.status_code
            console_logger.debug(code)
            data = json.loads(response.text)
        except:
            console_logger.debug("got an exception")
            code = 500
            data = {}
        return code, data

    def fetchAvailableAlertActions(self):
        if self.device:
            response = requests.request(
                method="GET",
                url="http://marketplace.diycam.com/api/v1/devices/alert/actions",
                headers={
                    "accessKey": self.device.Access_key,
                    "serialNumber": self.device.Serial_number

                }
            )
            console_logger.debug(json.loads(response.text))
            if response.status_code == 200:
                alertActions = AlertActions.objects.first()
                if alertActions:
                    alertActions.actions = json.loads(response.text)["detail"]['actions']
                    alertActions.save()
                else:
                    console_logger.debug(json.loads(response.text)["detail"])
                    AlertActions(**json.loads(response.text)["detail"]).save()
        return True

    @retry(exceptions=(TimeoutError, ConnectionError), delay=1, times=3)
    def verify_device(self):
        # Checking if the authentication file is presetn or not
        if os.path.isfile("./mounts/auth.aes") and self.device:
            try:
                # Validating online
                osvalues = self.fetch_os_values()
                self.fetchAvailableAlertActions()
                headers = {
                    "accessKey": self.device.Access_key
                }
                data = {
                    "serialNumber": self.device.Serial_number,
                    "sdCardNumber": osvalues["SD_card_id"],
                    "macId": osvalues["Mac_id"]
                }
                console_logger.debug(headers)
                console_logger.debug(data)
                # url= self.hostname + "/verify/device"
                url = config.CLOUD_URL+"/api/v1/devices/validate"
                code, data = self.api_call(
                    url, data, headers=headers, timeout=30)
                console_logger.debug(code)
                if code == 200:
                    self.device.update(Status="Active")
                if code == 401:
                    self.device.update(Status="Suspended")
                    apioperation = APIOperations()
                    apioperation.service_validity()
                if code == 404:
                    self.device.update(Status="Blocked")
                return "Success"
            except Exception as e:
                console_logger.debug(e)
                # Decrypting the file
                pyAesCrypt.decryptFile(
                    "./mounts/auth.aes", "./mounts/auth.json", self.device.Access_key, 64*1024)
                auth = json.loads(open('./mounts/auth.json', 'r').read())
                os.remove("./mounts/auth.json")
                osvalues = self.fetch_os_values()
                # Validating the contents of the file
                if auth["SD_CARD_NUMBER"] == osvalues["SD_card_id"] and auth["MAC_ID"] == osvalues["Mac_id"]:
                    pass
                else:
                    self.device.update(Status="Blocked")
                return "Success"
        else:
            return "Success"

    @retry(exceptions=(TimeoutError, ConnectionError), delay=1, times=3)
    def verify_access(self):
        if self.device != None:
            if self.device.Access_key != None:
                try:
                    # Validating the device
                    payload = {
                        "Serial_number": self.device.Serial_number
                    }
                    url = self.hostname + "/verify/access"
                    code, data = self.api_call(url, payload)

                    if code == 200:
                        self.device.update(Status="Active")
                    if code == 403:
                        console_logger.debug("suspending from here")
                        self.device.update(Status="Suspended")
                    return "Success"
                except:
                    return "Failed"
            else:
                return "Success"
        else:
            return "Success"

    def fetch_os_values(self):
        baseUrl = self.fetch_os_url()
        r = requests.get(baseUrl)
        if r.status_code == 200:
            data = json.loads(r.text)
            return data
        else:
            raise HTTPException(status_code=500)

    @staticmethod
    def fetch_os_url():
        # Genrateing baseUrl for fetching sdcard macid
        data = json.loads(open("./mounts/env.json", 'r').read())
        baseUrl = "http://{}:{}/api/v1/host/osvalues".format(
            data["HOST"], data["PORT"])
        return baseUrl
