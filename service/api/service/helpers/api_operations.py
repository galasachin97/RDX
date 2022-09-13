import requests
import datetime
import json
import os

from api.service.helpers.logs import console_logger

class APIOperations:
    def __init__(self) -> None:
        self.accessKey = None
        self.serialNumber = None
        self.softwareVersion = None

        if os.path.exists(os.path.join(os.getcwd(), "envs", "env.json")):
            with open(os.path.join(os.getcwd(), "envs", "env.json"), "r") as f:
                self.host = json.loads(f.read())["HOST"]

    def fetchManufacturer(self):
        try:
            url = "http://user_info:8000/api/v1/user/manufacturer/unprotected"
            response = requests.get(url=url, timeout=30)
            if response.status_code == 200:
                return json.loads(response.text)
            else:
                return None
        except requests.RequestException:
            console_logger.debug("user api call fail")
            return None
    

    def baseApiCall(self):
        try:
            url = "http://base:8000/api/v1/base/device/unprotected"
            response = requests.get(url=url, timeout=30)
            if response.status_code == 200:
                try:
                    self.accessKey = json.loads(response.text)["Access_key"]
                    if not self.accessKey:
                        mfgDetails = self.fetchManufacturer()
                        if mfgDetails:
                            self.accessKey = mfgDetails["detail"]["Username"]
                except Exception as e:
                    console_logger.debug(e)
                    mfgDetails = self.fetchManufacturer()
                    if mfgDetails:
                        self.accessKey = mfgDetails["detail"]["Username"]
                self.serialNumber = json.loads(response.text)["Serial_number"]
                self.softwareVersion = json.loads(response.text)["Software_version"]
                return True
            else:
                return False
        except requests.RequestException:
            console_logger.debug("base api call fail")
            return False

    def fetchSoftwareVersion(self):
        url = "http://base:8000/api/v1/base/software/version"
        response = requests.get(url=url, timeout=5)
        self.softwareVersion = json.loads(response.text)["detail"]
        return self.softwareVersion

    def updateSoftwareVersion(self, status, softwareVersion):
        url = "http://base:8000/api/v1/base/device/unprotected"
        data = {
            "Status": status,
            "Software_version": softwareVersion
        }
        response = requests.put(url=url, data=json.dumps(data), timeout=5)
        return response.status_code, json.loads(response.text)

    def fetchAssignedServices(self):
        """
        function to fetch assigned service for current device.
        """
        try:
            self.baseApiCall()
            url = "http://marketplace.diycam.com/api/v1/devices/service"
            headers = {
                "accessKey": self.accessKey
            }
            params = {
                "serialNumber": self.serialNumber
            }
            response = requests.get(
                url=url, headers=headers, params=params, timeout=5)
            return response.status_code, json.loads(response.text)
        except requests.RequestException:
            return 500, None

    def fetchServiceMetadata(self, serviceId):
        try:
            self.baseApiCall()
            url = "http://marketplace.diycam.com/api/v1/service_mgmt/owned"
            headers = {
                "accessKey": self.accessKey
            }
            params = {
                "serviceId": serviceId
            }
            response = requests.get(
                url=url, params=params, headers=headers, timeout=5)
            return response.status_code, json.loads(response.text)
        except requests.RequestException:
            return 500, None

    def fetchLatestServiceMetadata(self, serviceId):
        try:
            self.baseApiCall()
            url = "http://marketplace.diycam.com/api/v1/service_mgmt/device/update"
            headers = {
                "Content-Type": "application/json",
                "accessKey": self.accessKey
            }
            # console_logger.debug(serviceId)
            data = {
                "serviceId": serviceId
            }
            response = requests.post(url=url, data=json.dumps(
                data), headers=headers, timeout=5)
            # console_logger.debug(response)
            return response.status_code, json.loads(response.text)
        except requests.RequestException:
            return 500, None

    def fetchBaseServiceMetadata(self, serviceId, accessKey=None):
        try:
            self.baseApiCall()

            if accessKey is not None: 
                self.accessKey = accessKey

            url = "http://marketplace.diycam.com/api/v1/service_mgmt/device"
            headers = {
                "Content-Type": "application/json",
                "accessKey": self.accessKey
            }
            params = {
                "serviceId": serviceId
            }
            response = requests.get(
                url=url, headers=headers, params=params, timeout=5)
            return response.status_code, json.loads(response.text)
        except requests.RequestException:
            return 500, None

    def uninstallServiceFromCloud(self, serviceId):
        console_logger.debug(serviceId)
        try:
            self.baseApiCall()
            url = "http://marketplace.diycam.com/api/v1/devices/service/uninstall"
            headers = {
                "Content-Type": "application/json",
                "accessKey": self.accessKey,
                "serialNumber": self.serialNumber
            }
            data = {
                "serviceId": serviceId
            }
            response = requests.post(
                url=url, headers=headers, data=json.dumps(data), timeout=5)
            console_logger.debug(json.loads(response.text))
            return response.status_code, json.loads(response.text)
        except requests.RequestException:
            return 500, None

    def fetchLatestOSVersion(self):
        try:
            url = "http://marketplace.diycam.com/api/v1/service_mgmt/os"
            headers = {
                "Content-Type": "application/json"
            }
            params = {
                "onlyVersion": False,
                "isLatest": True
            }
            response = requests.get(
                url=url, headers=headers, params=params, timeout=5)
            # console_logger.debug(json.loads(response.text))
            return response.status_code, json.loads(response.text)
        except requests.RequestException:
            return 500, None

    def fetchCurrentOSDetails(self, version):
        try:
            url = "http://marketplace.diycam.com/api/v1/service_mgmt/os"
            headers = {
                "Content-Type": "application/json"
            }
            params = {
                "version": version
            }
            response = requests.get(
                url=url, headers=headers, params=params, timeout=5)
            # console_logger.debug(json.loads(response.text))
            return response.status_code, json.loads(response.text)
        except requests.RequestException:
            return 500, None

    def fetchCurrentSlotsData(self):
        try:
            url = "http://camera:8000/api/v1/camera/current_slot_data"
            response = requests.get(url=url, timeout=5)
            return response.status_code, json.loads(response.text)
        except requests.RequestException:
            return 500, None
    
    def fetch_host_logs(self,**kwargs):
        try:
            data = json.loads(open("./envs/env.json", 'r').read())
            url = "http://{}:{}/api/v1/host/hostlogs?since={}&until={}&tail={}".format(data["HOST"], '8750',kwargs["since"],kwargs["until"],kwargs["tail"])
            response = requests.post(url=url)
            return response.status_code, json.loads(response.text)
        except requests.RequestException:
            return 500, None
 
    def createFolder(self, path):
        try:
            url = "http://{}:80/api/v1/host/folder".format(self.host)
            headers = {
                "Content-Type": "application/json",
            }
            data = {
                "path": path
            }
            response = requests.post(url=url, headers=headers, data=json.dumps(data), timeout=5)
            console_logger.debug(response.status_code)
            return response.status_code, json.loads(response.text)
        except requests.RequestException:
            return 500, None

    def rebootSystem(self):
        try:
            url = "http://{}:80/api/v1/host/restart".format(self.host)
            headers = {
                "Content-Type": "application/json",
            }
            response = requests.get(url=url, headers=headers, timeout=60)
            console_logger.debug(response.status_code)
            return response.status_code, json.loads(response.text)
        except requests.RequestException:
            return 500, None
 
