import requests
import json

from api.service.helpers.logs import console_logger


class SocketManager:
    def __init__(self) -> None:
        self.url = "http://socketserver:8000/socket/notification"
        self.headers = {
            "content-type": "application/json"
        }

    def sentNotification(self, data):
        data = json.dumps({
            "message": data["Alert"],
            "title": data["Service_id"]
        })
        console_logger.debug(data)
        response = requests.request("POST", url=self.url, headers=self.headers, data=data)
        if response.status_code == 200:
            return True
        else:
            return False


socketManager = SocketManager()
