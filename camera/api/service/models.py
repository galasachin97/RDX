from enum import unique
from typing import List
from mongoengine.document import Document, EmbeddedDocument
from mongoengine.fields import BooleanField, DateField, DateTimeField, DictField, IntField, ListField, StringField
from werkzeug.security import generate_password_hash, check_password_hash
from mongoengine import *
import datetime, os
from config import Config
import cryptocode
from api.service.helpers.logs import console_logger
import urllib.parse


class ScheduleRunTime(Document):
    OpenTime = StringField()
    CloseTime = StringField()
    HolidayList = ListField(DateTimeField())
    

    def payload(self):
        return {
            "Opentime": self.OpenTime,
            "CloseTime": self.CloseTime,
            "HolidayList": self.HolidayList,
        }


class CameraHealthCheck(Document):
    HealthCheck = BooleanField(default=True)
    HealthCheckInterval = IntField(default=300, help='time in seconds')
    GetAlert = BooleanField(default=False)
    UserConsent = BooleanField(default=False)
    Checkhealth = BooleanField(default=False)
    def payload(self):
        return {
            "HealthCheck": self.HealthCheck,
            "HealthCheckInterval": self.HealthCheckInterval/60,
            "GetAlert": self.GetAlert,
            "UserConsent": self.UserConsent
        }
                


class ScheduleFlag(Document):
    Status = StringField()


class Module(Document):        
    ServiceID = StringField()
    ParentContainerID = ListField(StringField())  
    DeveloperParameters = DictField()
    UseCaseParameteres = DictField()
    ScheduleRunTime = StringField(default=None)
    TScreated = DateTimeField(default=datetime.datetime.utcnow())
    TSmodified = DateTimeField()

    def payload(self):
        local_timestamp = self.TScreated.replace(tzinfo=datetime.timezone.utc).astimezone(tz=None)
        mlocal_timestamp = self.TSmodified.replace(tzinfo=datetime.timezone.utc).astimezone(tz=None) if self.TSmodified else None
        return {            
            "ServiceID": self.ServiceID,
            "Parent_container_id": self.ParentContainerID,            
            "TScreated": str(datetime.datetime.strftime(local_timestamp.replace(microsecond=0),"%Y-%m-%d %H:%M:%S")),
            "TSmodified": str(datetime.datetime.strftime(mlocal_timestamp.replace(microsecond=0),"%Y-%m-%d %H:%M:%S")) if mlocal_timestamp else None
        }


class CameraSource(Document):
    SourceName = StringField(unique=True)

    def payload(self):
        return {
            "SourceName": self.SourceName
        }


class ReferenceImage(Document):
    Camera_id = StringField()
    ImageType = StringField()
    ImagePath = StringField()
    TScreated = DateTimeField(default=datetime.datetime.utcnow())
    TSmodified = DateTimeField()

    def payload(self):
        local_timestamp = self.TScreated.replace(tzinfo=datetime.timezone.utc).astimezone(tz=None)
        mlocal_timestamp = self.TSmodified.replace(tzinfo=datetime.timezone.utc).astimezone(tz=None) if self.TSmodified else None
        return {
            "Camera_id": self.CameraID,
            "ImageType": self.ImageType,
            "Path": self.ImagePath,
            "TScreated": str(datetime.datetime.strftime(local_timestamp.replace(microsecond=0),"%Y-%m-%d %H:%M:%S")),
            "TSmodified": str(datetime.datetime.strftime(mlocal_timestamp.replace(microsecond=0),"%Y-%m-%d %H:%M:%S")) if mlocal_timestamp else None
        }


class Camera(Document):
    Camera_id = StringField(unique=True)
    Camera_name = StringField(required=True)
    Location = StringField()
    Username = StringField(default=None, null=True)
    Password = StringField(default=None, null=True)    
    Link = StringField()
    Camera_source = StringField(required=True)
    Resolution = StringField()
    Camera_status = BooleanField(default=True)  
    Added_by = StringField()
    RefImage = ListField(ReferenceField('ReferenceImage',reverse_delete_rule=CASCADE))
    Modules = ListField(ReferenceField('Module',reverse_delete_rule=CASCADE))    
    TScreated = DateTimeField(default=datetime.datetime.utcnow())
    TSmodified = DateTimeField()  

    def payload(self):
        local_timestamp = self.TScreated.replace(tzinfo=datetime.timezone.utc).astimezone(tz=None)
        mlocal_timestamp = self.TSmodified.replace(tzinfo=datetime.timezone.utc).astimezone(tz=None) if self.TSmodified else None
        return {
            "Camera_id": self.Camera_id,
            "Camera_name": self.Camera_name,
            "Location": self.Location,
            "Rtsp_link": self.getRTSPwithoutCredentials(),
            "Camera_status": self.Camera_status,
            "Camera_source": self.Camera_source,            
            "RefImage": self.RefImage,        
            "Modules":self.Modules,
            "Created": str(datetime.datetime.strftime(local_timestamp.replace(microsecond=0),"%Y-%m-%d %H:%M:%S")),
            "Modified": str(datetime.datetime.strftime(mlocal_timestamp.replace(microsecond=0),"%Y-%m-%d %H:%M:%S")) if mlocal_timestamp else None            
        }

    # def check_password(self, password):
    #     return check_password_hash(self.Password, password)

    # def set_password(self, password):
    #     self.Password = generate_password_hash(password)
    def set_password(self, password):
        console_logger.debug(Config.SECRET)
        console_logger.debug(password)
        self.Password = cryptocode.encrypt(password, Config.SECRET)
    
    def get_password(self):
        return cryptocode.decrypt(self.Password, Config.SECRET)

    def getRTSP(self):
        link = self.Link
        if self.Username != None or self.Password != None:
            pUsername = urllib.parse.quote_plus(self.Username)
            pPassword = urllib.parse.quote_plus(self.get_password())
            link = "rtsp://{}:{}@{}".format(pUsername,pPassword,"/".join(self.Link.split("/")[2:]))
        return link

    def getRTSPwithoutCredentials(self):
        link = self.Link
        if self.Username != None or self.Password != None:
            link = "rtsp://{}".format("/".join(self.Link.split("/")[2:]))
        return link



class Taskmeta(Document):
    Task_name = StringField()
    Task_time = DateTimeField(default=datetime.datetime.utcnow())
    Status = StringField()
    Traceback = StringField()


ServiceHours = (('ScheduledHours','Schedule Hours'),
                ('UnScheduledHours','UnSchedule Hours',),)

class UseCaseRuntime(Document):
    Camera_id = StringField()
    ScheduledUsecase = ListField()
    ScheduledParent = ListField()
    UnScheduledUseCase = ListField()
    UnScheduledParent = ListField()


class ServiceScheduleBucket(Document):
    ScheduledUsecase = ListField()
    ScheduledParent = ListField()
    UnScheduledUseCase = ListField()
    UnScheduledParent = ListField()

    def payload(self):
        return {
            "ScheduledUC" : self.ScheduledUsecase,
            "ScheduledDP" : self.ScheduledParent,
            "UnScheduledUC" : self.UnScheduledUseCase,
            "UnScheduledDP" : self.UnScheduledParent,
        }

    
class ServiceCamMap(Document):
    ServiceID = StringField()
    ScheduleCameras = ListField()
    UnScheduleCameras = ListField()


class ServiceStatus(Document):
    ServiceName = StringField()
    Status = BooleanField()

    def payload(self):
        return {
            "ServiceName" : self.ServiceName,
            "Status" : self.Status
        }

class Global(Document):
    Cameras = ListField()
    Usecases = ListField()
    Dependent = ListField()
    AI = ListField()

    def payload(self):
        return {
            "Cameras": self.Cameras,
            "Usecases": self.Usecases,
            "Dependent": self.Dependent,
            "AI": self.AI
        }


 
class Local(Document):
    CameraID = StringField(default=None)
    Usecases = ListField()
    Dependent = ListField()
    AI = ListField()
    Status = BooleanField(default=False)

    def payload(self):
        return {
            self.CameraID : {
                "Usecases": self.Usecases,
                "Dependent": self.Dependent,
                "AI": self.AI                
            }
        }
 
class TimeSlots(Document):
    TimeSlot = StringField(unique=True, required=True)
    Global = ReferenceField("Global")
    Local = ListField(ReferenceField("Local"))