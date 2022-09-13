from datetime import datetime
from mongoengine.errors import ValidationError
import requests
import json
import os
import base64
import mimetypes

from api.service.helpers.logs import console_logger
from api.service.models import WhatsappSettings


def encodebase64(input_string):
    return base64.b64encode(input_string.encode("ascii")).decode("ascii")


class WAManager:

    def __init__(self) -> None:
        self.whatsappSettingsPresent = False
        self.whatsappSettingsInitialized = False
        self.expiry = None
        self.AdminAuthToken = None
        self.headers = {
            "Content-Type": "application/json",
        }
        self.whatsappSettingsObject = WhatsappSettings.objects.first()
        if self.whatsappSettingsObject:
            self.whatsappSettingsPresent = True

    def load_variables(self):
        if self.whatsappSettingsPresent:
            self.AdminAuthToken = self.whatsappSettingsObject.token
            self.AdminUsername = self.whatsappSettingsObject.username
            self.AdminPassword = self.whatsappSettingsObject.get_password(
                self.whatsappSettingsObject.password)
            self.URL = self.whatsappSettingsObject.url
            self.template_namespace = self.whatsappSettingsObject.namespace
            self.template_name = self.whatsappSettingsObject.template
            self.template_language = self.whatsappSettingsObject.language
            self.expiry = self.whatsappSettingsObject.expiredOn
            console_logger.debug(self.expiry)
            console_logger.debug(datetime.utcnow())
            if datetime.utcnow() > self.expiry:
                self.login()
            else:
                self.whatsappSettingsInitialized = True

            return True
        else:
            return False

    def add_settings(self, kwargs):
        try:
            password = kwargs.pop("password")

            self.AdminUsername = kwargs["username"]
            self.AdminPassword = password
            self.URL = kwargs["url"]

            if self.expiry and datetime.utcnow() > self.expiry or self.AdminAuthToken is None:
                if not self.login():
                    return False

            kwargs["expiredOn"] = self.expiry
            kwargs["token"] = self.AdminAuthToken
            kwargs["serviceStatus"] = True

            self.whatsappSettingsObject = WhatsappSettings(**kwargs)
            encryptedPassword = self.whatsappSettingsObject.set_password(
                password=password)
            self.whatsappSettingsObject.password = encryptedPassword
            self.whatsappSettingsObject.save()
            self.whatsappSettingsPresent = True
            self.load_variables()
            return True
        except ValidationError:
            return False

    def get_setting(self):
        if self.whatsappSettingsPresent:
            self.whatsappSettingsObject = WhatsappSettings.objects.first()
            data = self.whatsappSettingsObject.payload()
            decryptedPassword = self.whatsappSettingsObject.get_password(
                data["password"])
            data["password"] = decryptedPassword
            return data
        else:
            return None

    def delete_setting(self):
        self.whatsappSettingsObject = WhatsappSettings.objects.first()
        if self.whatsappSettingsObject:
            self.whatsappSettingsObject.delete()
            self.whatsappSettingsPresent = False

    def update_setting(self, kwargs):
        if self.whatsappSettingsPresent:
            updateDict = {}
            password = kwargs.pop("password")
            if self.expiry and datetime.utcnow() > self.expiry or self.AdminAuthToken is None:
                if not self.login():
                    return False

            kwargs["expiredOn"] = self.expiry
            kwargs["token"] = self.AdminAuthToken
            encryptedPassword = self.whatsappSettingsObject.set_password(
                password=password)
            kwargs["password"] = encryptedPassword

            for key in kwargs.keys():
                updateDict["set__{}".format(key)] = kwargs[key]
            self.whatsappSettingsObject.update(**updateDict)
            self.whatsappSettingsObject.contacts = kwargs["contacts"]
            self.load_variables()

    def login(self):
        payload = json.dumps({
            "new_password": self.AdminPassword
        })

        self.headers["Authorization"] = "Basic {}".format(
            encodebase64("{}:{}".format(self.AdminUsername, self.AdminPassword)))
        response = requests.request(
            "POST", "{}/v1/users/login".format(self.URL), headers=self.headers, data=payload)

        if response.status_code == 200:
            output = json.loads(response.content)
            self.AdminAuthToken = output.get("users")[0].get("token")
            self.expiry = datetime.strptime(output.get("users")[0].get(
                "expires_after").split("+")[0], "%Y-%m-%d %H:%M:%S")
            self.whatsappSettingsInitialized = True
            console_logger.debug(self.AdminAuthToken)
            return True
        else:
            self.AdminAuthToken = None
            console_logger.debug("Invalid Username Password")
            return False

    def verify_contacts(self, contact_list):
        if not self.AdminAuthToken:
            if not self.login():
                return "Login Attempt Failed Check Credentials"

        self.headers["Authorization"] = "Bearer {}".format(self.AdminAuthToken)

        payload = json.dumps({
            "blocking": "wait",
            "contacts": contact_list,
            "force_check": True
        })

        response = requests.request(
            "POST", "{}/v1/contacts".format(self.URL), headers=self.headers, data=payload)

        if response.status_code == 200:
            output = json.loads(response.content)
            return output.get("contacts")
        else:
            self.AdminAuthToken = None
            console_logger.debug("Invalid Username Password")
            return []

    def upload_media(self, media_path):
        if not self.AdminAuthToken:
            if not self.login():
                return "Login Attempt Failed Check Credentials"

        mime = mimetypes.guess_type(media_path)
        if any(mime):
            self.headers["Content-Type"] = mime[0]
        else:
            self.headers["Content-Type"] = "image/jpeg"
        self.headers["Authorization"] = "Bearer {}".format(self.AdminAuthToken)

        with open(os.path.join(media_path), "rb") as f:
            file_data = f.read()
        payload = file_data

        response = requests.request(
            "POST", "{}/v1/media".format(self.URL), headers=self.headers, data=payload)

        console_logger.debug(response.text)
        if response.status_code == 201:
            output = json.loads(response.content)
            return output.get("media")[0].get("id")
        else:
            self.AdminAuthToken = None
            console_logger.debug("Invalid Username Password")
            return []

    def send_message(self, media_path, message_text, individual_recipient):

        media_id = self.upload_media(media_path)

        payload = json.dumps({
            "to": "{}".format(individual_recipient),
            "type": "template",
            "template": {
                "namespace": "{}".format(self.template_namespace),
                "name": "{}".format(self.template_name),
                "language": {
                    "policy": "deterministic",
                    "code": "{}".format(self.template_language)
                },
                "components": [
                    {
                        "type": "header",
                        "parameters": [
                            {
                                "type": "image",
                                "image": {
                                    "id": "{}".format(media_id),
                                }
                            }
                        ]
                    },
                    {
                        "type": "body",
                        "parameters": [
                            {
                                "type": "text",
                                "text": "{}".format(message_text)
                            }
                        ]
                    }
                ]
            }
        })

        self.headers["Content-Type"] = "application/json"

        response = requests.request(
            "POST", "{}/v1/messages/".format(self.URL), headers=self.headers, data=payload)

        if response.status_code == 201:
            output = json.loads(response.content)
            return output
        else:
            self.AdminAuthToken = None
            console_logger.debug("Invalid Username Password")
            return []


whatsappHandler = WAManager()
