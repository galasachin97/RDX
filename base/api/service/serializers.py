from typing import List, Optional, Tuple
from fastapi import UploadFile, File
from pydantic import BaseModel, EmailStr, HttpUrl, validator, constr
from enum import Enum
import datetime
from api.service.helpers import util_models


def normalize(name: str) -> str:
    # it removes the space from input
    return name.strip()


class ManufacturerPostIn(BaseModel):
    Manufacturer_key: str
    Hardware_type: str
    Serial_number: str


class DeviceActivationPostIn(BaseModel):
    Access_key: str
    Device_name: str
    Installation_address: Optional[str]
    Branch_code: Optional[str]
    Map_address: Optional[List[float]]


class DevicePutInUP(BaseModel):
    Status: Optional[str] = None
    Software_version: Optional[str] = None


class DevicePutIn(BaseModel):
    Device_name: Optional[str] = None
    Branch_code: Optional[str] = None
    Map_address: Optional[str] = None


class DeviceGetOut(BaseModel):
    Device_name: Optional[str] = None
    Access_key: Optional[str] = None
    Serial_number: str
    Branch_code: Optional[str] = None
    Map_address: List[float]
    Mac_id: Optional[str] = None
    Software_version: str
    Hardware_type: str
    Limitations: dict
    Warranty_validity: datetime.date
    Status: str
    Consent: bool


class AlertsPostIn(BaseModel):
    Camera_id: str
    Camera_name: str
    Location: str
    Service_id: str
    Alert: str
    Timestamp: datetime.datetime
    Video_path: Optional[List[str]] = None
    Image_path: Optional[List[str]] = None


class ServerPostIn(BaseModel):
    Ip: Optional[str]
    Port: Optional[str]
    Server_role: str
    Ownership: str
    Url: Optional[HttpUrl]


class TicketingPostIn(BaseModel):
    type: str
    state: str


class AddEmailPostIn(BaseModel):
    emails: List[EmailStr]


class DeleteEmailDeleteIn(BaseModel):
    Email: EmailStr


class UpdateEmailPutIn(BaseModel):
    Prev_email: EmailStr
    New_email: EmailStr


class AddPhonePostIn(BaseModel):
    Phone: str


class DeletePhoneDeleteIn(BaseModel):
    Phone: str


class UpdatePhonePutIn(BaseModel):
    Prev_phone: str
    New_phone: str


class SendMailPostIn(BaseModel):
    Username: str
    Email: EmailStr
    OTP: str
    OTP_interval: str


class AwsParams(BaseModel):
    Bucket: str
    Secret_key: str
    Access_key: str
    Path: Optional[str] = None


class AzureParams(BaseModel):
    Connection_string: str
    Container_name: str
    Path: Optional[str] = None


class FTP(BaseModel):
    Secure: str
    Server_ip: str
    Port: str
    Username: str
    Password: str
    Path: str


class CloudSettingsPostIn(BaseModel):
    Cloudtype: str
    Aws_params: Optional[AwsParams]
    Azure_params: Optional[AzureParams]
    FTP_params: Optional[FTP]


default_aws = {
    "Bucket": "",
    "Secret_key": "",
    "Access_key": "",
    "Path": ""
}

default_azure = {
    "Connection_string": "",
    "Container_name": "",
    "Path": ""
}

default_ftp = {
    "Secure": "",
    "Server_ip": "",
    "Port": "",
    "Username": "",
    "Password": "",
    "Path": ""
}


class CloudSettingsGetOut(BaseModel):
    Cloudtype: str
    Aws_params: Optional[AwsParams] = default_aws
    Azure_params: Optional[AzureParams] = default_azure
    FTP_params: Optional[FTP] = default_ftp


class CloudSettingsUpdateIn(BaseModel):
    Cloudtype: Optional[str]
    Aws_params: Optional[AwsParams]
    Azure_params: Optional[AzureParams]
    FTP_params: Optional[FTP]


class SmtpSettingsPostIn(BaseModel):
    Smtp_ssl: bool
    Smtp_port: int
    Smtp_host: str
    Smtp_user: str
    Smtp_password: str
    Emails_from_email: EmailStr
    Emails_from_name: str


class SmtpSettingsGetOut(BaseModel):
    Smtp_ssl: bool
    Smtp_port: int
    Smtp_host: str
    Smtp_user: str
    Emails_from_email: EmailStr
    Emails_from_name: str


class SmtpSettingsUpdateIn(BaseModel):
    Smtp_ssl: Optional[bool]
    Smtp_port: Optional[int]
    Smtp_host: Optional[str]
    Smtp_user: Optional[str]
    Smtp_password: Optional[str]
    Emails_from_email: Optional[EmailStr]
    Emails_from_name: Optional[str]


class AlertContactsGetOut(BaseModel):
    Email: Optional[List[EmailStr]]
    Phone: Optional[List[str]]
    Language: str


class ServerOut(BaseModel):
    Ip: Optional[str]
    Port: Optional[str]
    Server_role: str
    Ownership: str
    Status: Optional[str]
    Url: Optional[HttpUrl]


class ServerGetOut(BaseModel):
    Servers: List[ServerOut]


class FetchVersionsGetOut(BaseModel):
    Avail_versions: List[str]


class TaskGetOut(BaseModel):
    Status: Optional[str] = None


class AlertSettingsPost(BaseModel):
    Service_id: str
    Alert_priority: str
    Alert_action: List[str]
    Alert_frequency: Optional[str] = None


class AlertSettingsPostIn(BaseModel):
    Settings: List[AlertSettingsPost]


class AlertSettingsPutIn(BaseModel):
    Service_id: str
    Alert_priority: str
    Alert_action: List[str]
    Alert_frequency: str


class AlertSettingGetOut(BaseModel):
    Service_id: str
    Alert_priority: str
    Alert_action: List[str]
    Alert_frequency: Optional[str]


class AlertSettingGetOutAll(BaseModel):
    data: List[AlertSettingGetOut]

# class AlertsOut(BaseModel):
#     Ticket_number: str
#     Camera_id: str
#     Camera_name: str
#     Location: str
#     Service_id: str
#     Alert: str
#     Date: datetime.date
#     Time: datetime.time
#     Video_path: Optional[HttpUrl] = None
#     Image_path: Optional[List[HttpUrl]] = None
#     Sync_status: Optional[bool] = None


class AlertsOut(BaseModel):
    Ticket_number: str
    Camera_id: str
    Camera_name: str
    Location: str
    Service_id: str
    Alert: str
    Date: datetime.date
    Time: datetime.time
    Video_path: Optional[List] = None
    Image_path: Optional[List] = None
    Sync_status: Optional[bool] = None
    CloudImage: Optional[List] = None


class AlertDownloadPostIn(BaseModel):
    ticket_nos: Optional[list] = []


class SyncAlerts(BaseModel):
    Alerts: List[AlertsOut]


class AlertsGetOut(util_models.PagiantionModel):
    alerts: List[AlertsOut]


class StaticStoragePostIn(BaseModel):
    Size: int


class UpdateAlertPutIn(BaseModel):
    False_detection: bool
    Ticket_number: str


class CameraAlertPostIn(BaseModel):
    CameraName: str
    Status: str


class CameraReport(BaseModel):
    Report_number: str
    Camera_id: str
    Camera_name: str
    Location: str
    Service_id: str
    Date: datetime.date
    Time: datetime.time
    Report_data: List[dict]
    Metrics: List[str]
    Sync_status: Optional[bool] = None


class CameraReportPostIn(BaseModel):
    Camera_id: str
    Service_id: str
    Data: dict


class CameraReportGetOut(util_models.PagiantionModel):
    reports: List[CameraReport]


class TelegramDataPostIn(BaseModel):
    token: Optional[str] = None
    channel: Optional[str] = None
    state: Optional[bool] = True

    _fix_token = validator('token', allow_reuse=True)(normalize)
    _fix_channel = validator('channel', allow_reuse=True)(normalize)


class TelegramDataGetOut(BaseModel):
    token: Optional[str] = None
    channel: Optional[str] = None
    state: Optional[bool] = False


class AuthenticateAccessKey(BaseModel):
    access_key: str


class ActivateDevice(BaseModel):
    # access_key: str
    serial_number: str
    password: constr(min_length=8)


class RegisterDevice(BaseModel):
    serialNumber: str
    accessKey: str
    deviceName: str
    fullName: str
    emailId: str
    username: str
    phone: str
    password: str


class AlertActionsPostIn(BaseModel):
    action: str


class WhatsappMobileVerify(BaseModel):
    mobile: str


class WhatsappSettingsPostIn(BaseModel):
    url: str
    username: str
    password: str
    namespace: str
    template: str
    language: str
    contacts: Optional[dict] = {}


##### sachin
class AnprReportsDownloadPostIn(BaseModel):
    record_ids: Optional[list] = []