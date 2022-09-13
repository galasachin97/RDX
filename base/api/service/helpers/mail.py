from fastapi import (
    FastAPI, 
    BackgroundTasks, 
    UploadFile, File, 
    Form, 
    Query,
    Body,
    Depends
)
from starlette.responses import JSONResponse
from starlette.requests import Request
from fastapi_mail import FastMail, MessageSchema,ConnectionConfig
from pydantic import EmailStr, BaseModel
from typing import List, Dict
from fastapi_mail.email_utils import DefaultChecker
from api.service.models import *
import cryptocode
import os, asyncio, sys
from config import TestConfig as config
from urllib.parse import urlparse
from mongoengine.errors import *
import json

class Mail:
    def __init__(self, settings = None):
        # Fetching smtp settings
        self.fm = None
        try:            
            if settings:
                self.settings = settings
                console_logger.debug(self.settings)
                self.smtp_options = ConnectionConfig(
                    MAIL_USERNAME = self.settings.Smtp_user,
                    MAIL_PASSWORD = self.settings.Smtp_password,
                    MAIL_FROM = self.settings.Emails_from_email,
                    MAIL_PORT = int(self.settings.Smtp_port),
                    MAIL_SERVER = self.settings.Smtp_host,
                    MAIL_FROM_NAME=self.settings.Emails_from_name,
                    TEMPLATE_FOLDER='./api/service/helpers/email-templates'
                )
            else:
                self.settings = SmtpSettings.objects.first()
                if self.settings == None:
                    return None
                
                self.smtp_options = ConnectionConfig(
                    MAIL_USERNAME = self.settings.Smtp_user,
                    MAIL_PASSWORD = cryptocode.decrypt(self.settings.Smtp_password, os.environ.get("SECRET_KEY_ENCRYPT")),
                    MAIL_FROM = self.settings.Emails_from_email,
                    MAIL_PORT = int(self.settings.Smtp_port),
                    MAIL_SERVER = self.settings.Smtp_host,
                    MAIL_FROM_NAME=self.settings.Emails_from_name,
                    TEMPLATE_FOLDER='./api/service/helpers/email-templates'
                )
            self.fm = FastMail(self.smtp_options)
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
            console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            

    async def __send_email(self, message, template):
        try:
            console_logger.debug(message)
            console_logger.debug(template)
            if self.fm:
                await self.fm.send_message(message, template_name=template)            
            return True
        except asyncio.exceptions.CancelledError:
            console_logger.debug("cancelled")
            return False
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
            console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            return False

    async def send_reset_password_email(self, payload):
        try:
            message = MessageSchema(
                subject=f"OTP - Password recovery for user {payload.Username}",
                recipients=[payload.Email],  # List of recipients, as many as you can pass 
                body=payload.dict(),
                subtype="html",
            )
            console_logger.debug(message)
            response = await self.__send_email(message, "reset_password.html")

            if response:
                return "Success"
            else:
                return "Failed"
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
            console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            return "Failed"

    # Change in production
    async def send_alert_email(self, alert, email):
        try:
            # console_logger.debug(alert.payload(local=True)["Image_path"])
            files =[]
            if alert.Image_path:   
                console_logger.debug(alert.payload(local=True))             
                for image in alert.payload(local=True)["Image_path"]:
                    if alert.Alert == 'camera - inactive':
                        image = os.path.join(os.getcwd(),"static_server",config.STATIC_IMAGE)
                    img_file = UploadFile("Image.jpg", open(image, 'rb'))
                    files.append(img_file)

            if alert.Video_path:
                vid_file = UploadFile("Video.mp4", open(os.path.join(os.getcwd(), config.STATICFILE_DIR, alert.Video_path), 'rb'))
                files.append(vid_file)
            body = {
                "Alert": alert.Alert,
                "Location": alert.Location,
                "Ticket_number": alert.Ticket_number,
                "Camera_name": alert.Camera_name
            }

            alert = alert.payload()
            body["Date"] = str(alert["Date"])
            body["Time"] = str(alert["Time"])

            message = MessageSchema(
                subject = "Alert was recieved",
                recipients=[email],
                body = body,
                subtype="html",
                attachments=files
            )

            response = await self.__send_email(
                message,
                "alert.html"
            )

            if response:
                return "Success"
            else:
                return "Failed"
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
            console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
            return "Failed"



    async def send_test_email(self):
        body = {
            "project_name": "RDX", 
            "email": self.settings.Emails_from_email
        }
        message = MessageSchema(
            subject = f"This is a test email",
            recipients=[self.settings.Emails_from_email],
            body = body,
            subtype="html",
        )
        response =  await self.__send_email(
            message,
            "test_email.html"
        )
        console_logger.debug(response)
        if response:
            return "Success"
        else:
            return "Failed"
