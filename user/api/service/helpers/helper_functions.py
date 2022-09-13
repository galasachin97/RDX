import pyotp
import os, sys, requests, json
from .logs import console_logger
from config import Config
from .utils import get_host
from api.service.models import OtpAttempts, OtpCounter
from api.utils import requesthandler
import datetime, random

BASE = None

class OTPGeneration():
    # This Class is Used to Generate/Verify OTP using Package pyotp
    def __init__(self):
        # self.otp = pyotp.TOTP(Config.OTP_SECRET, interval=int(Config.OTP_INTERVAL))
        self.otp = pyotp.HOTP(Config.OTP_SECRET)

    def generate_otp(self, count):
        # return self.otp.now()
        return self.otp.at(count)

    def validate_otp(self,otpString, count):
        return self.otp.verify(otpString, count)

    async def send_otp_mail(self, data):
        headers = {"content-type": "application/json"}
        try:
            console_logger.debug(data)
            response = requests.post(Config.OTP_MAIL, headers=headers, data=json.dumps(data), timeout=5)
            console_logger.debug(Config.OTP_MAIL)
            console_logger.debug(json.loads(response.text))
            return json.loads(response.text)
        except requests.exceptions.ConnectionError:
            return False


def sendEmail(user_data, type):
    try:
        ''' Send email using Base service '''
        count = random.randint(1111,9999)  
        # random id is genereated and stored in the database and sent to the frontend as response      
        OTP = OTPGeneration()
        new_otp = OTP.generate_otp(count)
        OtpCounter(Count=count).save()
        if type == "verification":
            data = {
                    "Username": user_data.get("Username"),
                    "Email": user_data.get("Email"),
                    "OTP": new_otp,
                    "OTP_interval": str(int(int(Config.OTP_INTERVAL)/60))
                    }
            console_logger.debug(data)
            sent_status = requesthandler.send_verification_mail(data)            
            if sent_status:
                return count
            return False

        if type == "forgotpass":
            data = {
                    "Username": user_data.get("Username"),
                    "Email": user_data.get("Email"),
                    "OTP": new_otp,
                    "OTP_interval": str(int(int(Config.OTP_INTERVAL)/60))
                    }
            console_logger.debug(data)
            sent_status = requesthandler.reset_password_mail(data)            
            if sent_status:
                return count
            return False
        
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return 0
        


# def check_email_attempt_limit():
#     ''' Function to check Device has its own otp settings then set the flags in database '''
#     try:       
#         setting = requesthandler.get_email_settings()
#         console_logger.debug(setting)
#         if setting:
#             has_settings = True
#             LimitReached = False
#         else:
#             has_settings = False            
#         if any(OtpAttempts.objects()):
#             if OtpAttempts.objects().first().Attempts >= Config.OTPATTEMPTSLIMIT and not setting:
#                 LimitReached = True
#             OtpAttempts.objects().first().update(HasOwnSettings=has_settings,LimitReached=LimitReached,TSmodified=datetime.datetime.utcnow())    
#             return OtpAttempts.objects().first().LimitReached
#         OtpAttempts(Attempts = 0, LimitReached=False, HasOwnSettings = has_settings).save()
#         return OtpAttempts.objects().first().LimitReached
#     except Exception as e:
#         console_logger.debug(e)
#         exc_type, exc_obj, exc_tb = sys.exc_info()
#         fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
#         console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))



def check_email_attempt_limit():
    ''' Function to check Device has its own otp settings then set the flags in database '''
    try:       
        # check smtp settings are present in base database
        setting = requesthandler.get_email_settings()
        LimitReached = False
        if any(OtpAttempts.objects()):
            # makame otp attempt collection if not exist
            OTP_Object = OtpAttempts.objects().first()
            console_logger.debug(OTP_Object.Attempts)
            console_logger.debug(setting)
            # count otp attempts and if attempts reached then update in database that limit has reached
            if OTP_Object.Attempts >= Config.OTPATTEMPTSLIMIT and not setting:
                LimitReached = True
            OTP_Object.update(HasOwnSettings=setting,LimitReached=LimitReached,TSmodified=datetime.datetime.utcnow())    
            return OtpAttempts.objects().first().LimitReached
        OtpAttempts(Attempts = 0, LimitReached=LimitReached, HasOwnSettings = setting).save()
        return OtpAttempts.objects().first().LimitReached
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))