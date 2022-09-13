from api.service.models import *
import os, sys
from api.utils import requesthandler
from api.service.helpers.logs import console_logger

#-------------------------- Service Activity ------------------

def CreateServiceStatus(servicelist):
    console_logger.debug("creating service activity")
    for service in servicelist:
        if not any(ServiceStatus.objects(ServiceName=service)):
            ServiceStatus(ServiceName=service, Status=False).save()
    return


def DeleteServicesStatus(serviceList):
    console_logger.debug("deleting from service status")
    console_logger.debug(serviceList)
    for service in serviceList:
        if any(ServiceStatus.objects(ServiceName=service)):
            ServiceStatus.objects(ServiceName=service).first().delete()
    return

    
def ChangeServiceStatus(service, status):
    response = []
    serviceStatuses = ServiceStatus.objects.all()
    for serviceStatus in serviceStatuses:
        if serviceStatus.ServiceName == service:
            serviceStatus.Status = status
            serviceStatus.save()
        response.append(serviceStatus.payload())
    return response

def SetServiceStatusFalse():    
    if any(ServiceStatus.objects()):
        for service in ServiceStatus.objects():
            service.update(Status=False)
    return

def GetAllServiceStatus():
    servicelist = []
    for service in ServiceStatus.objects():
        servicelist.append(service.payload())
    return servicelist

#------------------------------ Service Activity Ends------------




def deleteServiceBucket(serviceList):
    try:
        service_scheduled, service_unscheduled, parent_unscheduled, parent_scheduled = [],[],[],[]
        if any(ServiceScheduleBucket.objects()):
            serviceBucket = ServiceScheduleBucket.objects.first().payload()                        
            if any(list(set(serviceBucket.get("ScheduledUC")).intersection(serviceList))):
                service_scheduled = list(set(serviceBucket.get("ScheduledUC")).intersection(serviceList))
                ServiceScheduleBucket.objects(id=ServiceScheduleBucket.objects.first().id).update(pull_all__ScheduledUsecase = service_scheduled)

            if any(list(set(serviceBucket.get("ScheduledDP")).intersection(serviceList))):
                parent_scheduled = list(set(serviceBucket.get("ScheduledDP")).intersection(serviceList))
                ServiceScheduleBucket.objects(id=ServiceScheduleBucket.objects.first().id).update(pull_all__ScheduledParent = parent_scheduled)
                
            if any(list(set(serviceBucket.get("UnScheduledUC")).intersection(serviceList))):
                service_unscheduled = list(set(serviceBucket.get("UnScheduledUC")).intersection(serviceList))
                ServiceScheduleBucket.objects(id=ServiceScheduleBucket.objects.first().id).update(pull_all__UnScheduledUseCase = service_unscheduled)
                
            if any(list(set(serviceBucket.get("UnScheduledDP")).intersection(serviceList))):
                parent_unscheduled = list(set(serviceBucket.get("UnScheduledDP")).intersection(serviceList))
                ServiceScheduleBucket.objects(id=ServiceScheduleBucket.objects.first().id).update(pull_all__UnScheduledParent = parent_unscheduled)
        delete_status = set().union(*[set(service_scheduled),set(service_unscheduled),set(parent_scheduled),set(parent_unscheduled)])
        console_logger.debug(delete_status)
        DeleteServicesStatus(list(delete_status))
        return True
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return None



def getAllUsecaseRuntime():
    ScheduledUsecase, ScheduledParent, UnScheduledUseCase, UnScheduledParent = [],[],[],[]
    for runtime in UseCaseRuntime.objects():
        ScheduledUsecase = list(set(ScheduledUsecase + runtime.ScheduledUsecase))
        ScheduledParent = list(set(ScheduledParent + runtime.ScheduledParent))
        UnScheduledUseCase = list(set(UnScheduledUseCase + runtime.UnScheduledUseCase))
        UnScheduledParent = list(set(UnScheduledParent + runtime.UnScheduledParent))
    return ScheduledUsecase, ScheduledParent, UnScheduledUseCase, UnScheduledParent


def updateDeviceScheduleBucket():
    # automatically update device schedule bucket based on all schedule usecase difference
    try:        
        a, b, c, d = getAllUsecaseRuntime()
        if any(ServiceScheduleBucket.objects()):
            device_schedule = ServiceScheduleBucket.objects().first()
            schedule = set(device_schedule.ScheduledUsecase).difference(set(a))
            uschedule = set(device_schedule.UnScheduledUseCase).difference(set(c))
            pschedule = set(device_schedule.ScheduledParent).difference(set(b))
            puschedule = set(device_schedule.UnScheduledParent).difference(set(d))
            if any(schedule):
                ServiceScheduleBucket.objects(id=device_schedule.id).update(pull_all__ScheduledUsecase=schedule)
            else:
                device_schedule.ScheduledUsecase = a
            if any(pschedule):
                ServiceScheduleBucket.objects(id=device_schedule.id).update(pull_all__ScheduledParent=pschedule)
            else:
                device_schedule.ScheduledParent = b
            if any(uschedule):
                ServiceScheduleBucket.objects(id=device_schedule.id).update(pull_all__UnScheduledUseCase=uschedule)
            else:
                device_schedule.UnScheduledUseCase = c
            if any(puschedule):
                ServiceScheduleBucket.objects(id=device_schedule.id).update(pull_all__UnScheduledParent=puschedule)
            else:
                device_schedule.UnScheduledParent = d
            console_logger.debug("updated schedule details")
            device_schedule.save()
        else:
            ServiceScheduleBucket(
                ScheduledUsecase=a,
                ScheduledParent=b,
                UnScheduledUseCase=c,
                UnScheduledParent=d
            ).save()
        new_device_schedule = ServiceScheduleBucket.objects().first()
        schedule = set().union(*[set(new_device_schedule.ScheduledUsecase), \
                     set(new_device_schedule.UnScheduledUseCase), \
                     set(new_device_schedule.ScheduledParent), \
                     set(new_device_schedule.UnScheduledParent)])
        CreateServiceStatus(list(schedule))
        return
    except Exception as e:
        console_logger.debug(e)
        return


def updateDeviceScheduleBucketDirect():
    # automatically update device schedule bucket based on all schedule usecase difference
    try:        
        dataList = getAllDataCamera()
        
        a = dataList["ScheduledUC"]
        c = dataList["UnScheduledUC"]
        b = dataList["ScheduledDP"]
        d = dataList["UnScheduledDP"]
        # a, b, c, d = getAllUsecaseRuntime()
        if any(ServiceScheduleBucket.objects()):
            device_schedule = ServiceScheduleBucket.objects().first()
            schedule = set(device_schedule.ScheduledUsecase).difference(set(a))
            uschedule = set(device_schedule.UnScheduledUseCase).difference(set(c))
            pschedule = set(device_schedule.ScheduledParent).difference(set(b))
            puschedule = set(device_schedule.UnScheduledParent).difference(set(d))
            if any(schedule):
                ServiceScheduleBucket.objects(id=device_schedule.id).update(pull_all__ScheduledUsecase=schedule)
            else:
                device_schedule.ScheduledUsecase = a
            if any(pschedule):
                ServiceScheduleBucket.objects(id=device_schedule.id).update(pull_all__ScheduledParent=pschedule)
            else:
                device_schedule.ScheduledParent = b
            if any(uschedule):
                ServiceScheduleBucket.objects(id=device_schedule.id).update(pull_all__UnScheduledUseCase=uschedule)
            else:
                device_schedule.UnScheduledUseCase = c
            if any(puschedule):
                ServiceScheduleBucket.objects(id=device_schedule.id).update(pull_all__UnScheduledParent=puschedule)
            else:
                device_schedule.UnScheduledParent = d
            console_logger.debug("updated schedule details")
            device_schedule.save()
        else:
            ServiceScheduleBucket(
                ScheduledUsecase=a,
                ScheduledParent=b,
                UnScheduledUseCase=c,
                UnScheduledParent=d
            ).save()
        new_device_schedule = ServiceScheduleBucket.objects().first()
        schedule = set().union(*[set(new_device_schedule.ScheduledUsecase), \
                     set(new_device_schedule.UnScheduledUseCase), \
                     set(new_device_schedule.ScheduledParent), \
                     set(new_device_schedule.UnScheduledParent)])
        CreateServiceStatus(list(schedule))
        return
    except Exception as e:
        console_logger.debug(e)
        return


def getDataCamera(camera_id):
    try:        
        camera_data = Camera.objects(Camera_id=camera_id)
        dataList = dict()
        if any(camera_data):
            for data in camera_data[0].Modules:            
                if not dataList.get(data.ServiceID):
                    dataList[data.ServiceID] = data.ParentContainerID
                else:
                    dataList[data.ServiceID].append(data.ParentContainerID)
        console_logger.debug("usecaseList:{}".format(dataList))
        return dataList
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno)) 
        return 0


def getServiceSchedule(camera_id):
    cameraObj = Camera.objects(Camera_id=camera_id)
    ScheduleHoursList = set()
    UnScheduleHoursList = set()
    for module in cameraObj[0].Modules:
        if module.ScheduleRunTime == 'AllTime':
            ScheduleHoursList.add(module.ServiceID)
            UnScheduleHoursList.add(module.ServiceID)
        if module.ScheduleRunTime == 'UnScheduledHours':            
            UnScheduleHoursList.add(module.ServiceID)
        if module.ScheduleRunTime == 'ScheduledHours':
            ScheduleHoursList.add(module.ServiceID)
    return {"ScheduleHoursList": list(ScheduleHoursList), "UnScheduleHoursList": list(UnScheduleHoursList)}



def getAllDataCamera(camera_id=None):    
    try:
        camera_data = Camera.objects()
        if camera_id:
            camera_data = Camera.objects(Camera_id=camera_id)
        dataList = dict()
        useCaseScheduled = []
        useCaseUnScheduled = []
        parentScheduled = []
        parentUnScheduled = []
        if any(camera_data):
            for cam_data in camera_data:
                for module in cam_data.Modules:
                    if module.ScheduleRunTime == "ScheduledHours":
                        useCaseScheduled.append(module.ServiceID)
                        parentScheduled = list(set(parentScheduled+module.ParentContainerID))
                    elif module.ScheduleRunTime == "UnScheduledHours":
                        useCaseUnScheduled.append(module.ServiceID)
                        parentUnScheduled = list(set(parentUnScheduled+module.ParentContainerID))
                    elif module.ScheduleRunTime == "AllTime":
                        useCaseScheduled.append(module.ServiceID)
                        useCaseUnScheduled.append(module.ServiceID)
                        parentScheduled = list(set(parentScheduled+module.ParentContainerID))
                        parentUnScheduled = list(set(parentUnScheduled+module.ParentContainerID))
                   
        dataList["ScheduledUC"] = useCaseScheduled
        dataList["UnScheduledUC"] = useCaseUnScheduled
        dataList["ScheduledDP"] = parentScheduled
        dataList["UnScheduledDP"] = parentUnScheduled
        console_logger.debug(dataList)
        return dataList
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno)) 
        return 0


def setRunTime(camera_id, schedule_details):
    console_logger.debug("setting objects")
    runtimeCamera = UseCaseRuntime.objects(Camera_id=camera_id).first()
    if runtimeCamera:
        schedule_set = set(runtimeCamera.ScheduledUsecase).difference(set(schedule_details.get("ScheduledUC")))
        uschedule_set = set(runtimeCamera.UnScheduledUseCase).difference(set(schedule_details.get("UnScheduledUC")))
        pschedule_set = set(runtimeCamera.ScheduledParent).difference(set(schedule_details.get("ScheduledDP")))
        puschedule_set = set(runtimeCamera.UnScheduledParent).difference(set(schedule_details.get("UnScheduledDP")))
        console_logger.debug(schedule_set)
        console_logger.debug(any(schedule_set))
        if any(schedule_set):
            UseCaseRuntime.objects(id = runtimeCamera.id).update_one(pull_all__ScheduledUsecase = list(schedule_set))
            # console_logger.debug(UseCaseRuntime.objects(Camera_id=camera_id).first().ScheduledUsecase)
            runtimeCamera.reload()
        else:
            console_logger.debug("here")
            runtimeCamera.ScheduledUsecase = schedule_details.get("ScheduledUC")
            
        if any(uschedule_set):
            UseCaseRuntime.objects(id = runtimeCamera.id).update_one(pull_all__UnScheduledUseCase = list(uschedule_set))
            runtimeCamera.reload()
        else:
            runtimeCamera.UnScheduledUseCase = schedule_details.get("UnScheduledUC")
                        
        if any(pschedule_set):
            UseCaseRuntime.objects(id = runtimeCamera.id).update_one(pull_all__ScheduledParent = list(pschedule_set))
            runtimeCamera.reload()
        else:
            runtimeCamera.ScheduledParent = schedule_details.get("ScheduledDP")
            
        if any(puschedule_set):
            UseCaseRuntime.objects(id = runtimeCamera.id).update_one(pull_all__UnScheduledParent = list(puschedule_set))
            runtimeCamera.reload()
        else:
            runtimeCamera.UnScheduledParent = schedule_details.get("UnScheduledDP")
        runtimeCamera.save()
    else:
        console_logger.debug(schedule_details)
        UseCaseRuntime(
            Camera_id = camera_id,
            ScheduledUsecase = schedule_details.get("ScheduledUC"),
            ScheduledParent = schedule_details.get("ScheduledDP"),
            UnScheduledUseCase = schedule_details.get("UnScheduledUC"),
            UnScheduledParent = schedule_details.get("UnScheduledDP"),
        ).save()
    return 



def saveModuleToCamera(module_data):
    console_logger.debug("saving modules to camera")
    cameraObj = Camera.objects.get(Camera_id=module_data.CameraID)
    # save camera module
    if not any(cameraObj.Modules):
        for module in module_data.ModuleList:
            moduleObj = Module(ServiceID=module.Service_id, ParentContainerID = module.Parent_container_id).save()
            Camera.objects(id=cameraObj.id).update_one(push__Modules=moduleObj)
    else:
        moduleCameraList = []        
        for modules in cameraObj.Modules:
            moduleCameraList.append(modules.ServiceID)
            moduleCameraList = moduleCameraList + modules.ParentContainerID       

        moduleServiceList=set()            
        for module in module_data.ModuleList:                
            moduleServiceList.add(module.Service_id)
            if module.Service_id not in moduleCameraList:
                moduleObj = Module(ServiceID=module.Service_id, ParentContainerID = module.Parent_container_id).save()
                Camera.objects(id=cameraObj.id).update_one(push__Modules=moduleObj)

        differences = set(moduleCameraList).difference(set(moduleServiceList))
        for service in differences:
            for module in cameraObj.Modules:
                if module.ServiceID == service:
                    Camera.objects(id=cameraObj.id).update_one(pull__Modules=module)
                    Module.objects(id=module.id).first().delete()
    
    # updateDeviceScheduleBucket()
    return

def getDifferenceAndDeactivate(oldData, newData):
    console_logger.debug(oldData)
    console_logger.debug(newData)
    console_logger.debug("getting differnce and deactivating")
    inactive_usecases = list(set(oldData.get("ScheduledUC")).difference(set(newData.get("ScheduledUC")))) + \
                        list(set(oldData.get("UnScheduledUC")).difference(set(newData.get("UnScheduledUC")))) 

    inactive_parent_ids = list(set(oldData.get("ScheduledDP")).difference(set(newData.get("ScheduledDP")))) + \
                        list(set(oldData.get("UnScheduledDP")).difference(set(newData.get("UnScheduledDP"))))
    console_logger.debug("inactive_services: {}".format(inactive_usecases))
    console_logger.debug("inactive_parents: {}".format(inactive_parent_ids))
    DeleteServicesStatus(inactive_usecases + inactive_parent_ids)
    requesthandler.stop_service_socket_many(inactive_usecases)
    requesthandler.deactivate_services(inactive_usecases + inactive_parent_ids)
    return True



def getScheduleBucketData():
    if any(ServiceScheduleBucket.objects()):
        return ServiceScheduleBucket.objects.first().payload()
    else:
        return {
            "ScheduledUC" : [],
            "ScheduledDP" : [],
            "UnScheduledUC" : [],
            "UnScheduledDP" : [],
        }


def saveDeviceSchedule(schedule):
    console_logger.debug(schedule)    
    if any(ServiceScheduleBucket.objects()):
        device_schedule = ServiceScheduleBucket.objects().first()
        device_schedule.ScheduledUsecase = schedule.ScheduledUC
        device_schedule.ScheduledParent = schedule.ScheduledDP
        device_schedule.UnScheduledUseCase = schedule.UnScheduledUC
        device_schedule.UnScheduledParent = schedule.UnScheduledDP
        device_schedule.save()
    else:
        ServiceScheduleBucket(ScheduledUsecase = schedule.ScheduledUC,
                            ScheduledParent = schedule.ScheduledDP,
                            UnScheduledUseCase = schedule.UnScheduledUC,
                            UnScheduledParent = schedule.UnScheduledDP).save()
    return True


def mapCameraUsecase(data):
    console_logger.debug(data.currentScheduleDetails)
    for service in data.currentScheduleDetails.ScheduledUC:
        serviceObj = ServiceCamMap.objects(ServiceID=service)
        if any(serviceObj):
            if data.CameraID not in serviceObj.first().ScheduleCameras:
                ServiceCamMap.objects(id=serviceObj.first().id).update_one(push__ScheduleCameras=data.CameraID)
        else:
            ServiceCamMap(ScheduleCameras=[data.CameraID], ServiceID=service).save()
    for service in data.currentScheduleDetails.UnScheduledUC:
        serviceObj = ServiceCamMap.objects(ServiceID=service)
        if any(serviceObj):
            if data.CameraID not in serviceObj.first().UnScheduleCameras:
                ServiceCamMap.objects(id=serviceObj.first().id).update_one(push__UnScheduleCameras=data.CameraID)
        else:
            ServiceCamMap(UnScheduleCameras=[data.CameraID], ServiceID=service).save()
    return


def deactivate_all_services():
    if any(ServiceScheduleBucket.objects()):
        services = ServiceScheduleBucket.objects.first()
        requesthandler.stop_service_socket_many(list(services.ScheduledUsecase + services.UnScheduledUseCase))
        requesthandler.deactivate_services(list(services.ScheduledUsecase \
                                                + services.UnScheduledUseCase \
                                                + services.ScheduledParent \
                                                + services.UnScheduledParent))