import os
import sys
import telegram
from config import TestConfig as config
from api.service.helpers.logs import console_logger
from api.service.models import *
from telegram import InputMediaPhoto
from telegram.ext import Updater
import string


class Telegramhandler:
    def __init__(self):
        self.__token = None
        self.__chat_id = None
        self.__message = "Hello user, this is to verify the channel created by you."
        self.initialized = False

    def start(self, token, chat_id):
        self.__token = token
        self.__chat_id = chat_id
        self.initialized = True

    def stop(self):
        self.__token = None
        self.__chat_id = None
        self.initialized = False

    async def sendAlert(self, picture, message):
        bot = telegram.Bot(token=self.__token)

        status = bot.send_photo(chat_id=self.__chat_id,
                                photo=picture,
                                caption=message)

    def sendAlertTest(self, alert):
        try:
            device_name = DeviceInfo.objects.first().Device_name
            bot = telegram.Bot(token=self.__token)
            # console_logger.debug(alert.Camera_name)
            msg = "<strong>{}</strong>: <i>alert received at</i> <strong>{}</strong> \
                    on device <strong>{}</strong> having camera <strong>{}</strong> \
                    <i>camera</i>".format((alert.Alert).title(),
                                          alert.Location, device_name,
                                          alert.Camera_name)

            if alert.Image_path:
                files = []
                for i, image in enumerate(alert.payload(local=True)["Image_path"]):
                    if alert.Alert == 'camera - inactive':
                        with open(os.path.join(os.getcwd(), "static_server", config.STATIC_IMAGE), 'rb') as static:
                            f = InputMediaPhoto(static)
                            if i == 0:
                                f.caption = msg
                                f.parse_mode = "HTML"
                            files.append(f)
                    else:
                        if os.path.exists(image):
                            with open(image, 'rb') as file:
                                f = InputMediaPhoto(file)
                                if i == 0:
                                    f.caption = msg
                                    f.parse_mode = "HTML"
                                files.append(f)
                                # console_logger.debug(f)

            if any(files):
                bot.send_media_group(
                    chat_id="@{}".format(self.__chat_id), media=files)
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))

    def credetialsCheck(self, message=None):
        try:
            bot = telegram.Bot(token=self.__token)
        
            status = bot.send_message(
                chat_id=self.__chat_id,
                text=self.__message if not message else message,
                parse_mode=telegram.ParseMode.HTML)
            console_logger.debug(status)
        except:
            return False
        

    def sendMsgBeforeDelete(self, username, device_name):
        # console_logger.debug(self.__token)
        bot = telegram.Bot(token=self.__token)

        msg = "You will no more receive notification on telegram as <strong>{}</strong> has removed these channel from device <strong>{}</strong>".format(
            username, device_name)

        status = bot.send_message(
            chat_id=self.__chat_id,
            text=msg,
            parse_mode=telegram.ParseMode.HTML)


telegramHandler = Telegramhandler()
