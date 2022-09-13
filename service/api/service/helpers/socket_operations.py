import requests
import json

from api.service.helpers.logs import console_logger


class SocketOperations:
    def __init__(self) -> None:
        self.socketUrl = "http://socketserver:8000/socket" 

    def sendSocketData(self, taskName, status):
        console_logger.debug(taskName)
        console_logger.debug(status)
        data = {
            "detail": {
                "taskName": taskName,
                "status": status
            }
        }
        console_logger.debug(data)
        if taskName == "updating system":
            self.sendSystemUpdateStatus(data)
        elif taskName.find("downloading") != -1:
            self.sendServiceDownloadStatus(data)
        elif taskName.find("uninstall") != -1:
            self.sendServiceUninstallStatus(data)
        elif taskName.find("updating") != -1:
            self.sendServiceUpdateStatus(data)
        elif taskName == "download_apps":
            self.downloadAllStatus(data)
        elif taskName == "update_apps":
            self.updateAllStatus(data)
            
    def sendSystemUpdateStatus(self, data):
        try:
            url = "{}/system/update".format(self.socketUrl)
            headers = {
                "Content-Type": "application/json"
            }
            response = requests.post(url=url, headers=headers, data=json.dumps(
                data), timeout=30)
            
            return response.status_code
        except requests.RequestException:
            console_logger.debug("socket api call fail")
            return False

    def sendServiceDownloadStatus(self, data):
        try:
            url = "{}/service/download".format(self.socketUrl)
            headers = {
                "Content-Type": "application/json"
            }
            response = requests.post(url=url, headers=headers, data=json.dumps(
                data), timeout=30)
            
            return response.status_code
        except requests.RequestException:
            console_logger.debug("socket api call fail")
            return False

    def sendServiceUninstallStatus(self, data):
        try:
            url = "{}/service/uninstall".format(self.socketUrl)
            headers = {
                "Content-Type": "application/json"
            }
            console_logger.debug(url)
            response = requests.post(url=url, headers=headers, data=json.dumps(
                data), timeout=30)
            
            return response.status_code
        except requests.RequestException:
            console_logger.debug("socket api call fail")
            return False

    def sendServiceUpdateStatus(self, data):
        try:
            url = "{}/service/update".format(self.socketUrl)
            headers = {
                "Content-Type": "application/json"
            }
            response = requests.post(url=url, headers=headers, data=json.dumps(data), timeout=30)
            
            return response.status_code
        except requests.RequestException:
            console_logger.debug("socket api call fail")
            return False
        
    def downloadAllStatus(self, data):
        try:
            url = "{}/downloadall".format(self.socketUrl)
            headers = {
                "Content-Type": "application/json"
            }
            response = requests.post(url=url, headers=headers, data=json.dumps(data), timeout=30)
            
            return response.status_code
        except requests.RequestException:
            console_logger.debug("socket api call fail")
            return False
    
    def updateAllStatus(self, data):
        try:
            url = "{}/updateall".format(self.socketUrl)
            headers = {
                "Content-Type": "application/json"
            }
            response = requests.post(url=url, headers=headers, data=json.dumps(data), timeout=30)
            
            return response.status_code
        except requests.RequestException:
            console_logger.debug("socket api call fail")
            return False
        
    def restartService(self, data):
        try:
            url = "{}/restart".format(self.socketUrl)
            headers = {
                "Content-Type": "application/json"
            }
            response = requests.post(url=url, headers=headers, data=json.dumps(data), timeout=30)
            
            return response.status_code
        except requests.RequestException:
            console_logger.debug("socket api call fail")
            return False

socketOperationsHandler = SocketOperations()