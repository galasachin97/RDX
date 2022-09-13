import requests
import json
import os
import sys
import datetime
from fastapi import HTTPException
from api.service.helpers.logs import console_logger
from api.service.helpers.upload import Upload
from api.service.helpers.mail import Mail
from api.service.models import *
from api.service.serializers import *
from api.service.helpers.sync import SyncOperations
from urllib.parse import urlparse
from mongoengine.errors import DoesNotExist
from config import TestConfig as config
from api.service.helpers.telegramhandler import telegramHandler
from api.service.helpers.whatsapp import whatsappHandler
from api.service.helpers import check_internet

mail = Mail()

class AlertsOperations:
    def __init__(self, alert):
        self.alert = alert
        self.serial_number = DeviceInfo.objects.first().Serial_number
        self.device = None
        self.uploader = Upload()

    def doublecheck(self):
        server = Server.objects.get(Server_role="DoubleCheck")
        url = '{}/doublecheck'.format(server.Url) if(
            server.Url) else "http://{}:{}/doublecheck".format(server.Ip, server.Port)
        data = {
            "Serial_number": self.serial_number,
            "Alert": self.alert.Alert,
            "Service_id": self.alert.Service_id
        }
        uploadfile = open(os.path.join(
            os.getcwd(), config.STATICFILE_DIR, self.alert.Image_path), 'rb')

        files = [
            ('Image', ('Image.jpg', uploadfile, 'image/jpg'))
        ]
        headers = {
            "content-type": "multipart/form-data"
        }
        try:
            response = requests.post(
                url,
                headers=headers,
                data=data,
                files=files
            )
            console_logger.debug(response.status_code)
            return True if (response.status_code == 200) else False
        except Exception as e:
            console_logger.debug(e)
            return False

    def api_call(self, url, data, headers=None):
        # Api call
        try:
            console_logger.debug("calling ticketing")
            response = requests.post(
                url=url, data=json.dumps(data), headers=headers)
            code = response.status_code
            data = json.loads(response.text)
            console_logger.debug("successfully sync to cloud")
        except:
            code = 500
            data = {}
        return code, data

    async def send_alert_mail(self):
        global mail
        try:
            if not mail.fm:
                mail = Mail()  
            generalsettings = GeneralSettings.objects.first()
            if generalsettings == None:
                return "No email found"
            if generalsettings.Email_status:
                for email in generalsettings.Email:
                    status = await mail.send_alert_email(self.alert, email)
                    # console_logger.debug(
                    #     "Alert Email Status:{}".format(status))
                    # if not status:
                    #     return "Email Sending Failed"
            return True
            
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            return False

    async def send_telegram_alert(self):
        try:
            details = TelegramDetails.objects().first().payload()
            link = details["channel"].rsplit('/', 1)[-1]
            telegramHandler.start(details["token"], link)
            telegramHandler.sendAlertTest(self.alert)
            return True
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            return False

    async def send_wa_alert(self):
        try:
            if not self.device:
                self.device = DeviceInfo.objects.first()
            if not whatsappHandler.whatsappSettingsInitialized:
                whatsappHandler.load_variables()      
            alert_image = self.alert.payload(local=True)["Image_path"]
            alert_message = "{}: alert received at {} on device {} having camera {} camera".format((self.alert.Alert).title(), \
                                            self.alert.Location, self.device.Device_name, 
                                            self.alert.Camera_name)
            for WA_ID in whatsappHandler.whatsappSettingsObject.contacts.values():
                console_logger.debug(WA_ID)
                console_logger.debug(alert_image)
                console_logger.debug(alert_message)
                console_logger.debug(whatsappHandler.send_message(alert_image[0], alert_message, WA_ID))
            return True
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
            console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            return False

    '''---------------Old Function to Send alert to Cloud ----------------'''
    # async def send_alert_to_cloud(self):
    #     data = self.alert.payload()
    #     data["Serial_number"] = self.serial_number

    #     # Uploading files to cloud
    #     uploader = Upload()
    #     if self.alert.Image_path != None:
    #         client_img = "{}/alert/images/{}_{}.jpg".format(self.serial_number, datetime.datetime.utcnow().strftime("%m-%d-%Y_%H-%M-%S"), self.alert.Service_id)
    #         localpath = os.path.join(os.getcwd(), config.STATICFILE_DIR, self.alert.Image_path)
    #         console_logger.debug(localpath)
    #         img_status, img_url =  uploader.upload_file(localpath, client_img)
    #         if img_status:
    #             data["Image_path"] = img_url
    #         else:
    #             return "Image Upload Failed"

    #     if self.alert.Video_path != None:
    #         client_vid = "{}/alert/videos/{}_{}_{}.mp4".format(self.serial_number, datetime.datetime.utcnow().strftime("%m-%d-%Y_%H-%M-%S"), self.alert.Service_id)
    #         localpath = os.path.join(os.getcwd(), config.STATICFILE_DIR, self.alert.Video_path)
    #         vid_status, vid_url = uploader.upload_file(localpath, client_vid)
    #         if vid_status:
    #             data["Video_path"] = vid_url
    #         else:
    #             return "Video Upload Failed"

    #     server = Server.objects.get(Server_role = "Ticketing")
    #     alertUrl = '{}/{}'.format(server.Url, "/sendalert") if(server.Url) else 'http://{}:{}/sendalert'.format(server.Ip, server.Port)
    #     code, data = self.api_call(alertUrl, data)

    #     console_logger.debug("Alert sent to cloud")
    #     if code == 200:
    #         self.alert.update(Sync_status = True)
    #         return True
    #     else:
    #         return False

    async def send_alert_to_cloud(self, priority, type="alert"):
        try:
            # console_logger.debug(priority)
            data = self.alert.payload(local=True)
            self.device = DeviceInfo.objects.first()
            server = Server.objects(Server_role='Ticketing', Status=True).first()
            if server:
                alerturl = config.DIYCAMTICKETINGURL
                if server.Ownership == "Client":
                    alerturl = server.Url
                # console_logger.debug(data)
                headers = {"Content-Type": "application/json",
                        "accesstoken": self.device.Access_key}
                # make body of ticketing request
                body = {"subject": "{} in camera_id:{}".format(data.get('Alert'), data.get('Camera_name')),
                        "group": self.device.GroupID,
                        "type": self.device.TypeID,
                        "priority": self.device.Priorities.get(priority)}

                if data.get('Service_id') == "CAMV1":
                    type = "health"

                cloud_paths = list()
                # console_logger.debug(data['Image_path'])
                if any(data['Image_path']):
                    # console_logger.debug("sending to cloud")
                    image_body = ""
                    for image in data['Image_path']:
                        console_logger.debug(image)
                        client_img = image.split("/")[-1]
                        localpath = image 
                        cloudpath = "{}/{}/{}/{}/{}".format(self.serial_number, type, data.get('Camera_id'), str(data.get('Date')), client_img)

                        if client_img != "image_not_available.png":
                            # added local path to file
                            img_status, img_url = self.uploader.upload_file(
                                localpath, cloudpath)
                        else:
                            img_status = True
                            img_url = "https://infinityos.s3.ap-south-1.amazonaws.com/image_not_available.png"
                        if img_status:
                            image_body += "![image]({})".format(img_url)
                            cloud_paths.append(img_url)

                    #image upload status
                    if image_body != "":
                        console_logger.debug("Saving to Ticketing Cloud")
                        body["issue"] = image_body
                        # added ticketing url from config
                        code, data = self.api_call(alerturl, body, headers)
                        # console_logger.debug(data)
                        self.alert.Sync_status = True
                        self.alert.CloudImageURL = cloud_paths
                        self.alert.save()
                        # console_logger.debug(self.alert.Sync_status)
                        return True
                    else:
                        return "Image Upload Failed"
                else:
                    return "success"

        except Exception as e:
            return "Sending To Cloud Failed"

    async def perform_alert_actions(self):
        try:
            alertsettings = AlertSettings.objects(Service_id = self.alert.Service_id).first()
            alert_priority = "Critical"
            if alertsettings and check_internet.is_internet_present():
                if alertsettings.Alert_priority == "Low":
                    alert_priority = "Normal"
                elif alertsettings.Alert_priority == "Medium":
                    alert_priority = "Urgent"
                elif alertsettings.Alert_priority == "High":
                    alert_priority = "Critical"

                
                if "email" in alertsettings.Alert_action:
                    if await self.send_alert_mail():
                        pass
                    else:
                        return "Mail Failed"

                if "telegram" in alertsettings.Alert_action: 
                    telegramObject = TelegramDetails.objects.first()
                    if telegramObject and telegramObject.ServiceStatus:
                        if await self.send_telegram_alert():
                            pass
                        else:
                            return "Telegram alert send failed"

                if "whatsapp" in alertsettings.Alert_action:
                    if whatsappHandler.whatsappSettingsInitialized and whatsappHandler.whatsappSettingsObject.serviceStatus:
                        console_logger.debug("whatsapp")
                        await self.send_wa_alert()

                if "ticketing" in alertsettings.Alert_action:
                    if any(Server.objects(Server_role__icontains="Ticketing", Status=True)):
                        return "Success" if (await self.send_alert_to_cloud(alert_priority)) else "Failed"

            # get priority names as per ticketing database
            # if alertsettings:
            #     if alertsettings.Alert_priority == 'Low':
            #         alert_priority = "Normal"
            #     elif alertsettings.Alert_priority == 'Medium':
            #         alert_priority = "Urgent"
            #     elif alertsettings.Alert_priority == 'High':
            #         alert_priority = "Critical"

                # if "Red Light" in alertsettings.Alert_action:
                #     res = requests.post(host_url + "?operation={}".format("Red Light"))
                #     if res.status_code!=200:
                #         return "Hardware Action Failed"

                # if "Green Light" in alertsettings.Alert_action:
                #     res = requests.post(host_url + "?operation={}".format("Green Light"))
                #     if res.status_code!=200:
                #         return "Hardware Action Failed"

                # if "Orange Light" in alertsettings.Alert_action:
                #     res = requests.post(host_url + "?operation={}".format("Orange Light"))
                #     if res.status_code!=200:
                #         return "Hardware Action Failed"

                # if "Hooter" in alertsettings.Alert_action:
                #     res = requests.post(host_url + "?operation={}".format("Hooter"))
                #     if res.status_code!=200:
                #         return "Hardware Action Failed"

                # hostname = "www.google.com"
                # syncer = SyncOperations()
                # if syncer.internet_present(hostname):
                    # if "Mail" in alertsettings.Alert_action:
                    #     if await self.send_alert_mail():
                    #         pass
                    #     else:
                    #         return "Mail Failed"

                    # data = json.loads(open("./mounts/env.json", 'r').read())
                    # host_url = "http://{}:{}/api/v1/host/hw".format(data["HOST"], data["PORT"])

                    # if "Telegram" in alertsettings.Alert_action and any(TelegramDetails.objects()):
                    #     if TelegramDetails.objects().first().ServiceStatus:
                    #         if await self.send_telegram_alert():
                    #             pass
                    #         else:
                    #             return "Telegram alert send failed"

                    # if Server.objects(Server_role__icontains = "Ticketing"):
                    #     return "Success" if (await self.send_alert_to_cloud(alert_priority)) else "Failed"
                # else:
                #     console_logger.debug("no internet present")
                #     return "Success"
            else:
                return "Success"
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            return "Failed"

    async def verify_send_alert(self):
        status = await self.perform_alert_actions()
        return status
