import requests
import json
from api.service.models import *
import os
import sys
import pyAesCrypt
from fastapi import HTTPException
from api.service.helpers.logs import console_logger
from config import TestConfig as config
from api.service.helpers.upload import Upload
import socket


class Authentication:
    # Authentication related helpers
    def __init__(self):
        self.uploadDataHandler = Upload()
        self.deviceInfo = None
        # server = Server.objects.get(Server_role = "Authentication")
        # self.hostname = server.Url if(server.Url) else 'http://{}:{}'.format(server.Ip, server.Port)

    def fetch_service_metadata(self, accessKey):
        response = requests.request(
            method="GET",
            url="http://service:8000/api/v1/service/startup",
            params={
                "accessKey": accessKey
            }
        )
        return response.status_code


    def check_unique_device_name(self, accessKey, serialNumber, deviceName):
        if self._checkInternetPresent():
            response = requests.request(
                method="GET",
                url="http://marketplace.diycam.com/api/v1/devices/unique/device_name",
                headers={
                    "accessKey": accessKey,
                    "serialNumber": serialNumber
                },
                params={
                    "deviceName": deviceName
                }
            )
            return response.status_code, json.loads(response.text)
        else:
            return 500, False

    def _fetchAvailableAlertActions(self, accessKey, serialNumber):
        console_logger.debug(accessKey)
        console_logger.debug(serialNumber)
        response = requests.request(
            method="GET",
            url="http://marketplace.diycam.com/api/v1/devices/alert/actions",
            headers={
                "accessKey": accessKey,
                "serialNumber": serialNumber
            }
        )
        if response.status_code == 200:
            alertActions = AlertActions.objects.first()
            if alertActions:
                alertActions.actions = json.loads(response.text)["detail"]['actions']
                alertActions.save()
            else:
                AlertActions(**json.loads(response.text)["detail"]).save()

    def _checkInternetPresent(self):
        try:
            host = socket.gethostbyname("marketplace.diycam.com")
            sock = socket.create_connection((host, 80), 2)
            if sock:
                sock.close()
                return True
            else:
                return False
        except:
            return False

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

    def fetchUserSerialNumber(self, accessKey):
        if self._checkInternetPresent():
            self.fetch_os_values()

            response = requests.request(
                method="POST",
                url="http://marketplace.diycam.com/api/v1/devices/user/serial_number",
                data=json.dumps({
                    "macId": self.Mac_id,
                    "sdCardNumber": self.Sd_card_id,
                    "accessKey": accessKey
                })
            )

            return response.status_code, json.loads(response.text)
        else:
            return 406, {"detail": "internet not present"}

    def fetchDeviceRegistration(self):
        if self._checkInternetPresent():
            self.fetch_os_values()

            response = requests.request(
                method="GET",
                url="http://marketplace.diycam.com/api/v1/devices/register/info",
                params={
                    "sdCardNumber": self.Sd_card_id,
                    "macId": self.Mac_id
                }
            )
            return response.status_code, json.loads(response.text)
        else:
            return 406, {"detail": "internet not present"}

    def authenticateAccessKey(self, accessKey):
        if self._checkInternetPresent():
            response = requests.request(
                method="GET",
                url="http://marketplace.diycam.com/api/v1/users/info",
                params={"accessKey": accessKey}
            )
            return response.status_code, json.loads(response.text)
        else:
            return 406, {"detail": "internet not present"}

    def verifyDeviceActivation(self, accessKey):
        if self._checkInternetPresent():
            self.fetch_os_values()

            response = requests.request(
                method="POST",
                url="http://marketplace.diycam.com/api/v1/devices/activate",
                headers={
                    "accessKey": accessKey
                },
                data=json.dumps({
                    "macId": self.Mac_id,
                    "sdCardNumber": self.Sd_card_id
                })
            )

            return response.status_code, json.loads(response.text)
        else:
            return 406, {"detail": "internet not present"}

    def activateDevice(self, accessKey, serialNumber, password, hardwareType="standAlone"):
        if self._checkInternetPresent():
            self.fetch_os_values()

            response = requests.request(
                method="POST",
                url="http://marketplace.diycam.com/api/v1/devices/mfg/auth",
                headers={
                    "accessKey": accessKey
                },
                data=json.dumps({
                    "password": password,
                    "serialNumber": serialNumber,
                    "macId": self.Mac_id,
                    "sdCardNumber": self.Sd_card_id,
                    "hardwareType": hardwareType
                })
            )

            return response.status_code, json.loads(response.text)
        else:
            return 406, {"detail": "internet not present"}

    def validateDevice(self, accessKey, serialNumber):
        if self._checkInternetPresent():
            self.fetch_os_values()

            response = requests.request(
                method="POST",
                url="http://marketplace.diycam.com/api/v1/devices/validate",
                headers={
                    "accessKey": accessKey
                },
                data=json.dumps({
                    "serialNumber": serialNumber,
                    "macId": self.Mac_id,
                    "sdCardNumber": self.Sd_card_id
                })
            )

            self.deviceInfo = DeviceInfo.objects.first()

            if response.status_code == 200:
                self.deviceInfo.update(Status="Active")
            if response.status_code == 401:
                self.deviceInfo.update(Status="Suspended")
            if response.status_code == 404:
                self.deviceInfo.update(Status="Blocked")

            return json.loads(response.text), response.status_code
        else:
            return 406, {"detail": "internet not present"}

    def fetchLimitations(self, accessKey, hardwareVersion):
        if self._checkInternetPresent():
            response = requests.request(
                method="GET",
                url="http://marketplace.diycam.com/api/v1/devices/limitations",
                headers={
                    "accessKey": accessKey
                },
                params={
                    "hardwareVersion": hardwareVersion
                })

            return response.status_code, json.loads(response.text)
        else:
            return 406, {"detail": "internet not present"}

    def createManufacturer(self, accessKey, password):
        response = requests.request(
            method="POST",
            url="http://user_info:8000/api/v1/user/register/manufacturer",
            data=json.dumps({
                "ID": accessKey,
                "Password": password
            })
        )

        return response.status_code, json.loads(response.text)

    def createUser(self, **kwargs):
        response = requests.request(
            method="POST",
            url="http://user_info:8000/api/v1/user/register",
            data=json.dumps(kwargs)
        )

        return response.status_code, json.loads(response.text)

    def createConfigFile(self, key, configFile, configJson):
        metadata = {
            'SD_CARD_NUMBER': self.Sd_card_id,
            'MAC_ID': self.Mac_id
        }

        json_object = json.dumps(metadata, indent=4)

        with open(configJson, "w") as outfile:
            outfile.write(json_object)

        pyAesCrypt.encryptFile(configJson, configFile, key, 64*1024)
        os.remove(configJson)

    def readConfigFile(self, key, configFile, configJson):
        pyAesCrypt.decryptFile(configFile, configJson, key, 64*1024)
        auth = json.loads(open('./mounts/auth.json', 'r').read())
        os.remove("./mounts/auth.json")
        osvalues = self.fetch_os_values()
        if auth["SD_CARD_NUMBER"] == osvalues["SD_card_id"] and auth["MAC_ID"] == osvalues["Mac_id"]:
            pass
        else:
            self.deviceInfo.update(Status="Blocked")
        return "Success"

    def assignDevice(self, accessKey, serialNumber, deviceName):
        if self._checkInternetPresent():
            self.fetch_os_values()

            response = requests.request(
                method="POST",
                url="http://marketplace.diycam.com/api/v1/devices/assign",
                data=json.dumps({
                    "accessKey": accessKey,
                    "serialNumber": serialNumber,
                    "deviceName": deviceName,
                    "location": []
                })
            )

            if response.status_code == 200:
                responseDict = json.loads(response.text)
                data = {
                    "GroupID": responseDict["detail"]["group_id"],
                    "Priorities": responseDict["detail"]["priorities"],
                    "TypeID": responseDict["detail"]["type_id"]
                }

                # validate device to get warrenty information
                validatedData, code = self.validateDevice(
                    accessKey, serialNumber)
                console_logger.debug(validatedData)

                if code == 200:
                    self._fetchAvailableAlertActions(accessKey, serialNumber)
                    data["Warranty_duration"] = validatedData["Warranty_validity"]
                else:
                    data["Warranty_duration"] = 0
                return code, data
            else:
                return response.status_code, json.loads(response.text)
        else:
            return 406, {"detail": "internet not present"}

    def api_call(self, url, data=None, headers=None):
        try:
            response = requests.post(
                url=url, headers=headers, data=json.dumps(data))
            code = response.status_code
            data = json.loads(response.text)
        except Exception as e:
            console_logger.debug(e)
            code = 500
            data = {}
        return code, data

    def authenticate_device(self, data):
        try:
            # authenticates the device
            # registers macid and sd card number against the serial number
            # url = config.CLOUD_URL+"/api/v1/devices/mfg/auth"
            url = config.CLOUD_URL+"/api/v1/devices/mfg/auth"
            self.fetch_os_values()

            console_logger.debug(url)

            headers = {
                "accessKey": data["Manufacturer_key"]
            }
            del data["Manufacturer_key"]

            payload = {
                "serialNumber": data["Serial_number"],
                "macId": self.Mac_id,
                "sdCardNumber": self.Sd_card_id,
                "hardwareType": 'aiBox' if data["Hardware_type"] == 'AI Box' else 'standAlone'
            }
            console_logger.debug(payload)

            # uncomment when the serial numbers are valid
            code, data = self.api_call(url, payload, headers)
            console_logger.debug(code)
            return code
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            raise HTTPException(
                status_code=500, detail='Internal Server Error')

    def create_config_file(self):
        # create the auth.aes file
        config_file = {
            'SD_CARD_NUMBER': self.Sd_card_id,
            'MAC_ID': self.Mac_id
        }
        json_object = json.dumps(config_file, indent=4)

        auth_json_path = os.path.join(os.getcwd(), "mounts", "auth.json")
        auth_file_path = os.path.join(os.getcwd(), "mounts", "auth.aes")

        # Writing to auth.json
        with open(auth_json_path, "w") as outfile:
            outfile.write(json_object)
        pyAesCrypt.encryptFile(auth_json_path, auth_file_path, os.environ.get(
            "SECRET_KEY_ENCRYPT"), 64*1024)
        os.remove(auth_json_path)

    def activate_device(self, data):
        url = config.CLOUD_URL+"/api/v1/devices/assign"
        accessKey = data['accessKey']
        srNo = data['serialNumber']
        console_logger.debug(data)
        code, data = self.api_call(url, data, headers=None)
        console_logger.debug(data)
        data = {
            "GroupID": data["detail"]["group_id"],
            "Priorities": data["detail"]["priorities"],
            "TypeID": data["detail"]["type_id"]
        }
        # validate device to get warrenty information
        valid_data, code = self.validate_device(accessKey, srNo)
        if code == 200:
            data["Warranty_duration"] = valid_data["Warranty_validity"]
        else:
            data["Warranty_duration"] = 0
        return code, data

    def fetch_limitations(self, data):
        # fetch device limitations
        url = self.hostname + "/fetch/limitations"
        console_logger.debug(url)
        code, data = self.api_call(url, data)
        console_logger.debug(code)
        return code, data

    def fetch_os_values(self):
        # fetch macid and sdcardid from the host server
        baseUrl = self.fetch_os_url()

        r = requests.get(baseUrl)
        if r.status_code == 200:
            data = json.loads(r.text)
            self.Mac_id = data["Mac_id"]
            self.Sd_card_id = data["SD_card_id"]
            data = json.loads(r.text)
        else:
            console_logger.debug(r.status_code)
            raise HTTPException(status_code=500)

    @staticmethod
    def fetch_os_url():
        # genrates host server url
        data = json.loads(open("./mounts/env.json", 'r').read())
        baseUrl = "http://{}:{}/api/v1/host/osvalues".format(
            data["HOST"], data["PORT"])
        return baseUrl

    def update_device(self):
        # Updating base services
        device = DeviceInfo.objects.first()
        if not device:
            raise SystemError

        # fetches base services from the service management server
        url = "{}/systemupdate/unprotected".format(config.FETCH_SERVICES)
        requests.post(url)

        # If standalone pull containers
        # Change value as per cloud
        if device.Hardware_type == "Standalone":
            console_logger.debug("standalone device fetching containers")

            # fetching all owned services
            url = self.hostname + "/services/owned"
            data = {"Serial_number": device.Serial_number}
            try:
                r = requests.post(url, data=json.dumps(data))
                if r.status_code == 200:
                    # downloading all pre owned services
                    for service in data['Services']:
                        downloadUrl = config.FETCH_SERVICES + "/download"
                        data = {"Service_id": service["Service_id"]}
                        r = requests.post(downloadUrl, data=json.dumps(data))
                        if r.status_code == 200:
                            pass
                        else:
                            console_logger.debug(r.status_code)
                            return "Failed"
                    return "Success"
                else:
                    console_logger.debug(r.status_code)
                    return "Failed"
            except Exception as e:
                console_logger.debug(e)
                return "Failed"
        else:
            return "Success"

    def validate_device(self, accessKey, serialno):
        try:
            osvalues = self.fetch_os_values()
            headers = {
                "accessKey": accessKey
            }
            console_logger.debug(osvalues)
            data = {
                "serialNumber": serialno,
                "sdCardNumber": self.Sd_card_id,
                "macId": self.Mac_id
            }
            console_logger.debug(headers)
            console_logger.debug(data)
            # url= self.hostname + "/verify/device"
            url = config.CLOUD_URL+"/api/v1/devices/validate"
            code, data = self.api_call(url, data, headers=headers)
            console_logger.debug(code)
            self.device = DeviceInfo.objects.first()
            if code == 200:
                self.device.update(Status="Active")
            if code == 401:
                self.device.update(Status="Suspended")
            if code == 404:
                self.device.update(Status="Blocked")
            return data, code
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            raise HTTPException(
                status_code=500, detail='Internal Server Error')
    
    def fetch_manufacturer_detail(self,access_key):
        response = requests.request(
            method="GET",
            url="https://marketplace.diycam.com/api/v1/users/mfg/details",
            headers={
                "accessKey": access_key,
            }
        )
        return response.status_code, json.loads(response.text)
