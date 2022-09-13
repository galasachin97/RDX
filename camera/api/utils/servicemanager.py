from mongoengine.errors import DoesNotExist
from api.service.helpers.logs import console_logger
import os
import sys
import json
import shutil
import requests
from api.service.models import *
from api.service import routes
from api.service.helpers import utils
from api.utils import requesthandler


class ServiceManager():

    def GetAllServiceList(self, CameraID=None):
        try:
            # get camera vise service list
            args = {}
            if CameraID:
                args = {"Camera_id": CameraID}

            ServicesData = []
            for camera in Camera.objects(**args):
                data = {'CameraID': camera.Camera_id}
                serviceList = set()
                deepstreamList = set()
                for service in camera.Modules:
                    serviceList.add(service.ServiceID)
                    for dp in service.ParentContainerID:
                        deepstreamList.add(dp)
                data['Services'] = list(serviceList)
                data['ParentContainers'] = list(deepstreamList)
                ServicesData.append(data)

            return ServicesData
        except Exception as e:
            console_logger.debug(e)
            return 0

    def GetListofServicesWithStatus(self):
        ''' Get Total Number of Active Services and Total Active Services during Current Hours'''
        try:
            CurrentHours = 'AllTime'
            schedular = ScheduleFlag.objects()
            if any(schedular):
                # get current Schedule Hours
                CurrentHours = schedular.first().Status
            AserviceList = set()
            DserviceList = set()
            AdeepstreamList = set()
            DdeepstreamList = set()
            data = dict()
            for camera in Camera.objects():
                for service in camera.Modules:
                    console_logger.debug(service.ScheduleRunTime)
                    console_logger.debug(CurrentHours)
                    if service.ScheduleRunTime in ['AllTime', CurrentHours] and camera.Camera_status == True:
                        # if service.ScheduleRunTime in ['AllTime', CurrentHours]:
                        AserviceList.add(service.ServiceID)
                        for dp in service.ParentContainerID:
                            AdeepstreamList.add(dp)
                            if dp in DdeepstreamList:
                                DdeepstreamList.remove(dp)
                        if service.ServiceID in DserviceList:
                            DserviceList.remove(service.ServiceID)
                    else:
                        if service.ServiceID not in AserviceList:
                            DserviceList.add(service.ServiceID)
                        for dp in service.ParentContainerID:
                            if dp not in AdeepstreamList:
                                DdeepstreamList.add(dp)
            data['ActiveServices'] = list(AserviceList)
            data['ActiveParentContainers'] = list(AdeepstreamList)
            data['InactiveServices'] = list(DserviceList)
            data['DactiveParentContainers'] = list(DdeepstreamList)
            console_logger.debug(
                "GET LIST OF ACTIVE SERVICES: {}".format(data))
            return data
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            return 0

    def GetListofServicesAllCamera(self):
        ''' Get Total Number of Active Services and Total Active Services during Current Hours'''
        try:
            CurrentHours = 'AllTime'
            schedular = ScheduleFlag.objects()
            if any(schedular):
                # get current Schedule Hours
                CurrentHours = schedular.first().Status
            AserviceList = set()
            DserviceList = set()
            AdeepstreamList = set()
            DdeepstreamList = set()
            data = dict()
            for camera in Camera.objects():
                for service in camera.Modules:
                    console_logger.debug(service.ScheduleRunTime)
                    console_logger.debug(CurrentHours)
                    if service.ScheduleRunTime in ['AllTime', CurrentHours] and camera.Camera_status == True:
                        AserviceList.add(service.ServiceID)
                        for dp in service.ParentContainerID:
                            AdeepstreamList.add(dp)
                            if dp in DdeepstreamList:
                                DdeepstreamList.remove(dp)
                        if service.ServiceID in DserviceList:
                            DserviceList.remove(service.ServiceID)
                    else:
                        if service.ServiceID not in AserviceList:
                            DserviceList.add(service.ServiceID)
                        for dp in service.ParentContainerID:
                            if dp not in AdeepstreamList:
                                DdeepstreamList.add(dp)
            data['ActiveServices'] = list(AserviceList)
            data['ActiveParentContainers'] = list(AdeepstreamList)
            data['InactiveServices'] = list(DserviceList)
            data['DactiveParentContainers'] = list(DdeepstreamList)
            console_logger.debug(
                "GET LIST OF ACTIVE SERVICES: {}".format(data))
            return data
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            return 0


class CameraManager():
    def ChangeCameraStatus(self, CameraID, Status='active'):
        try:
            camera = Camera.objects.get(Camera_id=CameraID)
            services = ServiceManager().GetAllServiceList(CameraID=CameraID)
            camera.Camera_status = True if Status == 'active' else False
            camera.save()
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            return 0


class SocketsManager():

    def getscheduletime(self):
        try:
            schedular = ScheduleFlag.objects()
            if any(schedular):
                schedule = schedular.first().Status
                return schedule
            return "AllTime"

        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            return 0

    def getmodules(self, CameraID=None):
        try:
            # logic provides data of modules after adding camera / changing camera status to socket
            data = []
            current_time = self.getscheduletime()
            if CameraID:
                cameras = Camera.objects(Camera_id=CameraID)
            else:
                cameras = Camera.objects()

            for cam in cameras:
                camera = {"camera_id": cam.Camera_id, "link": cam.getRTSP(
                ), "camera_name": cam.Camera_name, "location": cam.Location, "usecases": []}
                for module in cam.Modules:
                    usecase = {}
                    usecase["service_id"] = module.ServiceID
                    usecase["parent_ids"] = module.ParentContainerID
                    usecase["scheduled"] = True
                    usecase['runtime'] = 1
                    camera["usecases"].append(usecase)
                data.append(camera)
            return data

        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            return 0

    def ChangeOfScheduleHours(self):
        try:
            # This checks the status of the camera & module during schedule/unschedule hours
            current_time = self.getscheduletime()
            console_logger.debug(
                "current Hours at ChangeOFScheduleHours:{}".format(current_time))
            ''' Get the required container status '''
            servicedata = ServiceManager().GetListofServicesWithStatus()
            ''' Deactivate the Services if any '''
            if servicedata.get('DactiveParentContainers') or servicedata.get('InactiveServices'):
                # call to deactivate not usable containers
                requesthandler.stop_service_socket_many(
                    servicedata.get('InactiveServices'))
                requesthandler.deactivate_services(servicedata.get(
                    'DactiveParentContainers')+servicedata.get('InactiveServices'))
            # call to activate services and ai containers
            requesthandler.activate_services(servicedata.get(
                'ActiveParentContainers')+servicedata.get('ActiveServices'))
            return 1
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))

    def changeOfScheduleHoursNew(self):
        current_time = self.getscheduletime()
        if any(ServiceScheduleBucket.objects()):
            serviceBucket = ServiceScheduleBucket.objects.first().payload()
            if current_time == "UnScheduledHours":
                requesthandler.deactivate_services(serviceBucket.get(
                    'UnScheduledUC')+serviceBucket.get('UnScheduledDP'))
            if current_time == "ScheduledHours":
                requesthandler.deactivate_services(serviceBucket.get(
                    'ScheduledUC')+serviceBucket.get('ScheduledDP'))
        return 1

    def change_of_working_hours(self):
        try:
            # change of working hours triggers this function
            console_logger.debug("change of working hours")
            data = None
            current_time = self.getscheduletime()
            camera_list = Camera.objects()
            camera_schedules = []
            for camera in camera_list:
                for module in camera.Modules:
                    data = {}
                    data['camera_id'] = camera.Camera_id
                    data['usecase_id'] = module.ServiceID
                    data["current_hours"] = module.ScheduleRunTime
                    data['parent_ids'] = []
                    for parent in module.ParentContainerID:
                        data['parent_ids'].append(parent)
                if data:
                    camera_schedules.append(data)

            console_logger.debug(camera_schedules)
            ''' New Socket Endpoint'''
            # socket enpoint is called to notify schedule hours are changed
            console_logger.debug(ScheduleFlag.objects().first().Status)
            requesthandler.change_of_schedule(
                ScheduleFlag.objects().first().Status)

            return data
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
