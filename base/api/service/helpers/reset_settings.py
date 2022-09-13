import requests
import json
import os

from api.service.models import *
from api.service.helpers.whatsapp import whatsappHandler
from api.service.helpers.telegramhandler import telegramHandler
from api.service.helpers.logs import console_logger

class ResetSettings:
    def __init__(self) -> None:
        self.envData = json.loads(
            open(os.path.join(os.getcwd(), "mounts", "env.json"), 'r').read())

    def resetTimeSettings(self):
        timezone = str(open('/etc/timezone').read()).replace("\n", "")

        data = {
            "Timezone": timezone,
            "SyncronizeWithNTP": False,
            "AutoTimeZone": True
        }

        headers = {
            "content-type": "application/json"
        }

        response = requests.request(
            method="POST", 
            url="http://{}:{}/api/v1/host/timesettings".format(self.envData["HOST"], self.envData["PORT"]),
            headers=headers,
            data=json.dumps(data)
        )

        if response.status_code == 200:
            return True
        else:
            return False

    def resetCameraHealthCheck(self):
        data = {
            "CheckHealth": False,
            "CheckInterval": 5.0,
            "GetAlert": False,
            "UserConsent": False
        }

        headers = {
            "content-type": "application/json"
        }

        response = requests.request(
            method="POST",
            url="http://{}:{}/api/v1/camera/health/unprotected".format(self.envData["HOST"], self.envData["PORT"]),
            headers=headers,
            data=json.dumps(data)
        )

        if response.status_code == 200:
            return True
        else:
            return False

    def resetSmtpSettings(self):
        smtpSettings = SmtpSettings.objects.all()
        for setting in smtpSettings:
            setting.delete()
        return True
    
    def resetNotificationSettings(self):
        alertActionSettings = AlertActionsSettings.objects.all()
        for alertAction in alertActionSettings:
            alertAction.delete()
        
        serverSettings = Server.objects.all()
        for setting in serverSettings:
            setting.delete()

        telegramSettings = TelegramDetails.objects.all()
        for setting in telegramSettings:
            setting.delete()
        telegramHandler.stop()

        generalSettings = GeneralSettings.objects.all()
        for setting in generalSettings:
            setting.Email = []
            setting.Email_status = False
            setting.save()

        whatsappHandler.delete_setting()
        return True

    def resetSystemUpdate(self):
        data = {
            "auto_update": False
        }

        headers = {
            "content-type": "application/json"
        }

        response = requests.request(
            method="POST",
            url="http://{}:{}/api/v1/service/system/update/schedule".format(self.envData["HOST"], self.envData["PORT"]),
            headers=headers,
            data=json.dumps(data)
        )

        if response.status_code == 200:
            return True
        else:
            return False

    def resetSettings(self):

        if not self.resetCameraHealthCheck():
            console_logger.debug("reset camera health fail")
            return False
        console_logger.debug("reset camera health success")
        
        if not self.resetSmtpSettings():
            console_logger.debug("reset smtp setting fail")
            return False
        console_logger.debug("reset smtp setting success")

        if not self.resetNotificationSettings():
            console_logger.debug("reset notification setting fail")
            return False
        console_logger.debug("reset notification setting success")

        if not self.resetSystemUpdate():
            console_logger.debug("reset system update setting fail")
            return False
        console_logger.debug("reset system update setting success")

        if not self.resetTimeSettings():
            console_logger.debug("reset time setting fail")
            return False
        console_logger.debug("reset time setting success")

        return True
        

resetSettingsHandler = ResetSettings()