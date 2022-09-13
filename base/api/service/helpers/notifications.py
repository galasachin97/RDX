import requests
import datetime
import json

from api.service.models import Notifications
from api.service.helpers.logs import console_logger


class NotificationHandler:
    def __init__(self) -> None:
        self.url = "http://socketserver:8000/socket/notification"
        self.headers = {
            "content-type": "application/json"
        }
        self.notificationObject = None

    def addNotification(self, data):
        added_date = datetime.datetime.now(datetime.timezone.utc) # UTC time
        data["created"] = added_date
        console_logger.debug(data["created"])
        notificationObject = Notifications(**data)
        notificationObject.save()
        return notificationObject.payload()

    def sendNotification(self, data):
        data = self.addNotification(data)
        console_logger.debug(data)
        response = requests.request("POST", self.url, headers=self.headers, data=json.dumps(data))
        if response.status_code == 200:
            return True
        else:
            return False


notificationHandler = NotificationHandler()
