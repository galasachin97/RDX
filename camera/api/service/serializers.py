from typing import Dict, List, Optional
from mongoengine.fields import ListField
from pydantic import BaseModel, validator


def normalize(name: str) -> str:
    return name.strip().replace(" ", "_")


def reset_state(Timeslots: dict) -> bool:
    if any(Timeslots):
        return True
    return False


def add_space(name: str) -> str:
    return name.replace("_", " ")


def remove_extra_space(name: str) -> str:
    return name.strip()


class CameraSourcePostIn(BaseModel):
    SourceName: List[str]


class CameraSource(BaseModel):
    SourceName: str


class CameraSourceGetOut(BaseModel):
    Data: Optional[List[CameraSource]] = None


class ServiceStatusPostIn(BaseModel):
    ServiceName: str
    Status: bool


class CameraInfoPostIn(BaseModel):
    Camera_name: str
    Camera_source: str
    Location: str
    link: str
    Username: Optional[str] = None
    Password: Optional[str] = None
    TestImage: str = None
    RefImgDay: Optional[str] = None
    RefImgNight: Optional[str] = None
    Resolution: Optional[str] = None

    _normalize_name = validator('Camera_name', allow_reuse=True)(normalize)
    _normalize_link = validator('link', allow_reuse=True)(remove_extra_space)
    _normalize_location = validator(
        'Location', allow_reuse=True)(remove_extra_space)


class CameraInfoDefaultPostIn(BaseModel):
    Camera_name: Optional[str] = None
    Camera_source: str
    Location: Optional[str] = None
    link: str
    Resolution: Optional[str] = None

    _normalize_link = validator('link', allow_reuse=True)(remove_extra_space)
    _normalize_location = validator(
        'Location', allow_reuse=True)(remove_extra_space)


class CameraInfoPostOut(BaseModel):
    Camera_id: Optional[str] = None


class CameraInfoPutIn(BaseModel):
    CameraID: str
    Camera_name: Optional[str] = None
    Location: Optional[str] = None
    Test_image: Optional[str] = None
    RefImgDay: Optional[str] = None
    RefImgNight: Optional[str] = None
    Resolution: Optional[str] = None

    _normalize_name = validator('Camera_name', allow_reuse=True)(normalize)
    _normalize_location = validator(
        'Location', allow_reuse=True)(remove_extra_space)


class CameraData(BaseModel):
    Camera_id: str
    Camera_name: str
    Location: Optional[str] = None
    Camera_status: bool
    Ai_status: Optional[bool] = False
    Camera_source: str
    Location: str
    Rtsp_link: str
    Test_image: Optional[str] = None
    Day: Optional[str] = None
    Night: Optional[str] = None
    Type: Optional[str] = None

    _normalize_space = validator('Camera_name', allow_reuse=True)(add_space)


class CameraCaptureGetOut(BaseModel):
    image_path: str


class UsbCamera(BaseModel):
    Camera: str


class USBCameraListGetOut(BaseModel):
    Data: Optional[List] = None


class CameraInfoGetOut(BaseModel):
    Data: Optional[List[CameraData]] = None
    Page_size: Optional[int] = None
    Page_number: Optional[int] = None
    Total_count: Optional[int] = None


class ServiceUsecaseData(BaseModel):
    CameraID: str
    ServiceID: str
    UseCaseSettings: Optional[Dict] = None


class CameraModulesPostIn(BaseModel):
    Services: List[ServiceUsecaseData]


class CameraDevSettingModulesPutIn(BaseModel):
    CameraID: str
    ServiceID: str
    DeveloperSettings: Optional[Dict] = None


class CameraModulesGetIn(BaseModel):
    CameraID: str
    ServiceID: str


class CameraModulesAddData(BaseModel):
    ServiceID: str


class CameraParentContainer(BaseModel):
    ServiceID: str
    Parent_container_id: str
    ROI: Optional[list] = None
    Line1: Optional[list] = None
    Line2: Optional[list] = None
    Direction: Optional[str] = None
    DetectionThreshold: Optional[str] = None


class ParentContainer(BaseModel):
    Service_id: str
    Parent_container_id: List[str]


class CameraModulesListAdd(BaseModel):
    CameraID: str
    ModuleList: Optional[List[ParentContainer]] = None


class CameraModulesListAddData(BaseModel):
    CameraID: str
    Link: str
    ModuleList: Optional[List[CameraParentContainer]] = None


class CameraTestPostIn(BaseModel):
    Link: str
    CameraSource: str


class HolidayListUpdatePutIn(BaseModel):
    HolidayList: List[str]


class CameraCapturePostIn(BaseModel):
    Link: str
    CameraSource: str
    Type: str
    Username: Optional[str] = None
    Password: Optional[str] = None

    _normalize_location = validator(
        'Link', allow_reuse=True)(remove_extra_space)


class CheckDuplicatesPostIn(BaseModel):
    Camera_name: Optional[str]
    Link: Optional[str]

    _normalize_name = validator('Camera_name', allow_reuse=True)(normalize)
    _normalize_location = validator(
        'Link', allow_reuse=True)(remove_extra_space)


class ModuleScheduleGetIn(BaseModel):
    CameraID: str
    ServiceID: str


class ModuleSchedulePostIn(BaseModel):
    CameraID: str
    ServiceID: str
    Schedule: str


class ScheduleModuleTime(BaseModel):
    OpenTime: Optional[str] = None
    CloseTime: Optional[str] = None


class ModulesData(BaseModel):
    ServiceID: str


class CameraScheduleData(BaseModel):
    ScheduleHoursList: Optional[List] = None
    UnScheduleHoursList: Optional[List] = None


class CameraModuleListGetOut(BaseModel):
    Data: Optional[List] = None
    CameraSchedule: Optional[CameraScheduleData] = None
    CurrentTime: Optional[str] = None


class DefaultResponseModel(BaseModel):
    detail: str


class HolidayListGetOut(BaseModel):
    Data: Optional[List[str]] = None


class ScheduleTime(BaseModel):
    OpenTime: Optional[str] = None
    CloseTime: Optional[str] = None


class ScheduleTimeGetOut(BaseModel):
    Data: ScheduleTime


class CameraHealthStatePostIn(BaseModel):
    CheckHealth: Optional[bool] = None
    CheckInterval: Optional[int] = None
    GetAlert: Optional[bool] = None
    UserConsent: Optional[bool] = None


class DeviceScheduleDetail(BaseModel):
    ScheduledUC: List[str]
    ScheduledDP: List[str]
    UnScheduledUC: List[str]
    UnScheduledDP: List[str]


class CamModuleSchedulePostIn(BaseModel):
    CameraID: str
    currentScheduleDetails: DeviceScheduleDetail
    ModuleList: Optional[List[ParentContainer]] = None
    Flag: int


class TimeSlotRemovePostIn(BaseModel):
    ServiceId: str
    TimeSlots: Optional[Dict] = None


class TimeSlotPostIn(BaseModel):
    CameraID: str
    Timeslots: Optional[Dict] = None


class RemoveUsecaseCameras(BaseModel):
    Timeslots: Optional[Dict] = None
    # _validate_state = validator(Timeslots, allow_reuse=True)(reset_state)


class UpdateCameraRtspDetailsPostIn(BaseModel):
    CameraID: str
    Username: str
    Password: str
