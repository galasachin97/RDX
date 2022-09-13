import os
import requests
import pyAesCrypt
import json

from api.service.models import *
from api.service.helpers.auth_helpers import *
from api.service.helpers.logs import console_logger

class Startup:
    def __init__(self) -> None:
        self.authenticator = Authentication()
        self.aesFilePath = os.path.join(os.getcwd(), "mounts", "auth.aes")
        self.jsonFilePath = os.path.join(os.getcwd(), "mounts", "auth.json")
        self.envFile = os.path.join(os.getcwd(), "mounts", "env.json")
        self.retryCount = 20
        self.Mac_id = None
        self.Sd_card_id = None


    def fetch_os_values(self):
        baseUrl = self.fetch_os_url()

        response = requests.get(baseUrl)
        if response.status_code == 200:
            data = json.loads(response.text)
            self.Mac_id = data["Mac_id"]
            self.Sd_card_id = data["SD_card_id"]
        else:
            console_logger.debug(response.status_code)
            raise HTTPException(status_code=500)

    def fetch_os_url(self):
        data = json.loads(open(self.envFile, 'r').read())
        baseUrl = "http://{}:{}/api/v1/host/osvalues".format(data["HOST"], data["PORT"])
        return baseUrl

    def fetchUserInfo(self, userType):
        try:
            response = requests.request(
                method="GET",
                url="http://user_info:8000/api/v1/user/check",
                params={
                    "user_type": userType
                },
                timeout=5
            )
            return response.status_code
        except requests.exceptions.ConnectionError:
            return 500

    def performStartupActivity(self):
        deviceInfo = DeviceInfo.objects.first()
        if deviceInfo:
            if os.path.isfile(self.aesFilePath):
                status = None
                while self.retryCount:
                    status = self.fetchUserInfo("Superadmin")
                    if status != 500:
                        break
                if status == 200 and deviceInfo.Status == "Active":
                    return 200
                elif status == 200 and deviceInfo.Status != "Active":
                    return 403
                else:
                    return status
            else:
                status, response = self.authenticator.verifyDeviceActivation(
                    deviceInfo.Access_key
                )
                if status == 200:
                    self.authenticator.createConfigFile(
                        response["detail"]["accessKey"], 
                        self.aesFilePath, 
                        self.jsonFilePath
                    )

                    if deviceInfo.Status == "Active":
                        return 200
                    else:
                        return 403
                else:
                    pyAesCrypt.decryptFile(self.aesFilePath, self.jsonFilePath, deviceInfo.Access_key, 64*1024)
                    auth = json.loads(open(self.jsonFilePath, 'r').read())
                    os.remove(self.jsonFilePath)
                    osvalues = self.fetch_os_values()
                    if auth["SD_CARD_NUMBER"] == osvalues["SD_card_id"] and auth["MAC_ID"] == osvalues["Mac_id"]:
                        pass
                    else:
                        self.device.update(Status = "Blocked")
                    return "Success"
                # else:
                #     return status
        else:
            console_logger.debug(self.aesFilePath)
            if not os.path.isfile(self.aesFilePath):
                return 400
            else:
                return 403
            


