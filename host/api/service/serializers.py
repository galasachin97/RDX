from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel, HttpUrl
from ipaddress import IPv4Address

class WifiData(BaseModel):
    SSID: Optional[str] = None
    Password: Optional[str] = None

class LanData(BaseModel):
    Ip: str = None
    Subnet_mask: str = None
    Gateway: Optional[str] = None
    Dns: Optional[list] = None

class NetworkConfigurePost(BaseModel):
    Network_priority: str = None
    Wifis: Optional[WifiData] = None
    Ethernets: Optional[LanData] = None

class ConfigMountPostIn(BaseModel):
    Device_kname: str
    Backup: Optional[bool] = False

class EjectDevicePostIn(BaseModel):
    Device_kname: str

class TimeSettingsPostIn(BaseModel):
    Timezone: Optional[str] = None
    Current_datetime: Optional[str] = None
    Ntp_url: Optional[str] = None
    SyncronizeWithNTP: Optional[bool] = None
    AutoTimeZone: Optional[bool] = False
    Region: Optional[str] = None

class CameraCapturePostIn(BaseModel):
    Source: str
    Link: str
    ImageType: str

class CameraHealthPostIn(BaseModel):
    Source: str
    Link: str
    Consent: bool

class FolderPostIn(BaseModel):
    path: str