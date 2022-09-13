import copy
from optparse import Option
from fastapi import APIRouter, HTTPException, File, UploadFile, Response, Depends, status, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from mongoengine.connection import READ_PREFERENCE
from mongoengine.errors import DoesNotExist
from .serializers import *
from .helpers.imagemanager import AddRenameImage
from api.service.helpers.logs import console_logger
from api.utils.slotmanager import slotManager
from api.utils.scheduler import create_scheduler, schedule_slots, run_slot
from api.service.helpers.general_helpers import retry
from api.service.models import Camera
import os
import sys
import uuid
import shutil
import platform
import shutil
import time
import asyncio
from .models import *
from typing import Optional
from config import Config
from api.utils import auth, requesthandler, utility, exceloperation, servicemanager, camservicehelpers, interval_manager, camerahealth
from api.utils.interval_manager import time_manager, set_timeslots_default
from config import Config
import datetime
from api.utils.camerahealth import pause_healthcheck

from fastapi.encoders import jsonable_encoder


router = APIRouter()
sched = None

timeslots = ("0-2", "2-4", "4-6", "6-8", "8-10", "10-12",
             "12-14", "14-16", "16-18", "18-20", "20-22", "22-24")

new_slots = (0, 2, 4, 6, 8, 10,
             12, 14, 16, 18, 20, 22)

''' Start Hardware Limitations '''
HARDWARE_TYPE = None
ALLOWED_CAMERAS = None
ALLOWED_DEEPSTREAM_CONTAINERS = None
ALLOWED_USE_CASES = None
CONSENT = False
''' End Hardware Limitations '''


def getLimitations(data):
    ''' Setting Limitations Based on Hardware/Use Case '''
    global HARDWARE_TYPE, ALLOWED_CAMERAS, ALLOWED_DEEPSTREAM_CONTAINERS, ALLOWED_USE_CASES, CONSENT

    # if hardware not box it is set as default
    HARDWARE_TYPE = 'ai box'
    if data:
        console_logger.debug(
            "************** getting limitations from BASE -------- SUCCESS")
        HARDWARE_TYPE = data.get('Hardware_type')
        ALLOWED_CAMERAS = data['Limitations'].get('Camera')
        ALLOWED_DEEPSTREAM_CONTAINERS = data['Limitations'].get('Deepstream')
        ALLOWED_USE_CASES = data['Limitations'].get('Usecase')
        CONSENT = data.get('Consent')
    return None


response_data = {
    "Data": None,
    "Page_size": 0,
    "Page_number": 0,
    "Total_count": 0
}


@router.get(
    "/sources",
    response_model=CameraSourceGetOut,
    responses={
        **utility.responses,
    },
)
# <----------- permission to be provided mentioned in tuple
@auth.permission_required(('Admin', 'Superadmin', 'Manufacturer'))
async def GetCameraSource(response: Response,
                          payload: dict = Depends(auth.authenticate_user_token)):
    """
        API to get camera source list
    """
    try:
        source_list = [
            {"SourceName": "RTSP"}]
        if Config.HARDWARE_VERSION.lower() in ['jetson_nano', 'jetson_xavier']:
            source_list = [
                {"SourceName": "RTSP"}
            ]
        for source in CameraSource.objects():
            source_list.append(source.payload())
        response_data['Data'] = source_list
        return response_data

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/sources", responses={**utility.responses})
@auth.permission_required(('Admin', 'Superadmin', 'Manufacturer'))
async def GetCameraSource(payload: dict = Depends(auth.authenticate_user_token)):
    """
        API to get camera source list
    """
    try:
        sourceList = []
        cameraSources = CameraSource.objects.all()

        for source in cameraSources:
            sourceList.append(source.SourceName)

        if not any(sourceList):
            sourceList.append("RTSP")

        return {"detail": sourceList}
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get(
    "/unprotected",
    response_model=CameraData,
    include_in_schema=True)
async def CameraInfoNPGet(response: Response, CameraID: str):
    """
    API to fetch information of added cameras
    """
    try:
        # unprotected get camera endpoint for base container
        if CameraID:
            camera_data = Camera.objects.get(Camera_id=CameraID)
            camera_dict = camera_data.payload()
            for imgID in camera_data.RefImage:
                camera_dict[imgID.ImageType] = Config.STATICFILESERVER + \
                    str(imgID.ImagePath)
        return camera_dict

    except DoesNotExist:
        # if camera id provided is not exist in the system
        raise HTTPException(status_code=404, detail="Item not found")

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


# @router.get(
#             "",
#             response_model = CameraInfoGetOut,
#             responses = {
#                 **utility.responses,
#                 },
#             )
# async def endpoint_to_fetch_added_cameras(response:Response, CameraID:str=None,
#                      Page_number:Optional[int]=None, Page_size:Optional[int]=None,
#                      payload: dict = Depends(auth.authenticate_user_token)):
#     """
#     API to fetch information of added cameras
#     """
#     try:
#         page_no = 1
#         page_size = 10

#         if Page_number:
#             page_no = int(Page_number)
#         if Page_size:
#             page_size = int(Page_size)
#         query = {}
#         if CameraID:
#             query["Camera_id"]=CameraID
#         start = page_size*(page_no - 1)
#         end = start + page_size
#         camera_list = []
#         # data = requesthandler.get_configs_from_base()
#         # if data:
#         #     getLimitations(data)
#         if any(Camera.objects()):
#             service_status = ServiceStatus.objects.all()
#             for camera_data in Camera.objects(**query)[start:end]:
#                 camera_dict = camera_data.payload()
#                 camera_dict['Ai_status'] = False
#                 if any(camera_data.Modules):
#                     for module in camera_data.Modules:
#                         for parent in module.ParentContainerID:
#                             for service in service_status:
#                                 if parent == service.ServiceName and service.Status == True:
#                                     camera_dict['Ai_status'] = True

#                 camera_dict.pop('Modules')
#                 if camera_data.RefImage:
#                     for imgID in camera_data.RefImage:
#                         camera_dict[imgID.ImageType] = Config.STATICFILESERVER+str(imgID.ImagePath)
#                 console_logger.debug(camera_dict)
#                 camera_list.append(camera_dict)

#         response_data['Page_size'] = page_size
#         response_data['Page_number'] = page_no
#         response_data['Total_count'] = len(camera_list)
#         response_data['Data'] = camera_list
#         console_logger.debug(response_data)
#         response.status_code=200
#         return response_data

#     except DoesNotExist:
#         # if camera id provided is not exist in the system
#         raise HTTPException(status_code=404, detail="Item not found")

#     except Exception as e:
#         console_logger.debug(e)
#         exc_type, exc_obj, exc_tb = sys.exc_info()
#         fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
#         console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
#         raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        451: {
            "description": "Unavailable For Legal Reasons",
            "content": {
                "application/json": {
                    "example": {"detail": "Hardware Limit Reached Cannot Add This Camera"}
                }
            }
        },
        400: {
            "description": "Bad Request",
            "content": {
                "application/json": {
                    "example": {"detail": "Please test your camera before adding it"}
                }
            }
        },
    },
)
@auth.permission_required(('Admin', 'Superadmin', 'Manufacturer'))
async def CameraInfoPost(response: Response, camera_data: CameraInfoPostIn,
                         payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to add new camera into the system
    """
    try:
        data = requesthandler.get_configs_from_base()
        if data:
            getLimitations(data)
        Camera.objects.get(Camera_name=camera_data.Camera_name)
        return JSONResponse(status_code=400, content={"detail": "Camera Name Already Exist"})

    except DoesNotExist:

        ''' Check For Any Hardware Limitations '''

        # check for duplicate camera link in the system and sort RTSP
        if any(Camera.objects(Link=camera_data.link)):
            raise HTTPException(
                status_code=409, detail='Camera Link Already Exist in System')

        if camera_data.Camera_source == 'MIPI':
            console_logger.debug("Camera Deteted MIPI")
            if platform.uname()[4] == "x86_64":
                raise HTTPException(
                    status_code=451, detail='No MIPI Cameras Can Be Connected to the system')
        username, password = None, None
        if camera_data.Username not in ["", None]:
            username = camera_data.Username
            password = camera_data.Password

        camera_id = str(uuid.uuid4().hex)
        camera_obj = Camera(Camera_id=camera_id, Camera_name=camera_data.Camera_name,
                            Location=camera_data.Location, Username=username, Added_by=payload[
                                'role'],
                            Link=camera_data.link, Camera_source=camera_data.Camera_source)

        ''' Make Reference Image Object And Store in Camera As List '''

        ReferenceImageList = []

        # testImage = add_ref_image(renameImage(camera_data.Camera_name, camera_data.TestImage.split('/')[-1], 'test'),'Test_image',camera_id)
        testImage = AddRenameImage(camera_data.Camera_name, camera_data.TestImage.split(
            '/')[-1], 'Test_image', camera_id)
        ReferenceImageList.append(testImage)

        if camera_data.RefImgDay:
            day_image = AddRenameImage(
                camera_data.Camera_name, camera_data.RefImgDay.split('/')[-1], 'Day', camera_id)
            ReferenceImageList.append(day_image)

        if camera_data.RefImgNight:
            night_image = AddRenameImage(
                camera_data.Camera_name, camera_data.RefImgNight.split('/')[-1], 'Night', camera_id)
            ReferenceImageList.append(night_image)

        if password:
            camera_obj.set_password(camera_data.Password)

        ''' Save Camera Object '''
        camera_obj.RefImage = ReferenceImageList
        camera_obj.save()

        ''' Send Activity Log to User Management '''
        requesthandler.send_activity_log(
            payload['token'], Action="Added {} Camera.".format(camera_data.Camera_name))
        return JSONResponse(status_code=200, content={"Camera_id": camera_id})

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


# @router.delete("",
#                 response_model = DefaultResponseModel,
#                 responses = {
#                     **utility.responses,
#                     200: {
#                     "description":"Delete Camera Successful",
#                     "content": {
#                     "application/json": {
#                         "example": {"detail":"Success"}
#                             }
#                         }
#                     },
#                 },
#             )
# @auth.permission_required(('Admin','Superadmin','Manufacturer'))
# async def CameraInfoDelete(response:Response,CameraID:str,
#                      payload: dict = Depends(auth.authenticate_user_token)):
#     """
#     API to delete information of added cameras needs admin privileges
#     """
#     try:
#         camera_data = Camera.objects.get(Camera_id=CameraID)
#         camera_name = camera_data.Camera_name

#         if payload['role'] =='Manufacturer':
#             if not camera_data.Added_by == 'Manufacturer':
#                 return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content = {"detail":"Cannot delete this Camera"})
#         else:
#             if camera_data.Added_by == 'Manufacturer':
#                 return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content = {"detail":"Cannot delete this Camera"})

#         ''' Deactivate Services associated with camera '''
#         camera_data.update(Camera_status = False)
#         camera_data.reload()

#         ''' delete camera details from socket server '''

#         servicedata = servicemanager.ServiceManager().GetListofServicesAllCamera()
#         ''' Get The List of Inactive Services and Update The service status in Service Manager '''

#         console_logger.debug(servicedata)
#         if camera_data.Modules:
#             for module in camera_data.Modules:
#                 module.delete()
#         if camera_data.RefImage:
#             for images in camera_data.RefImage:
#                 images.delete()

#         image = os.path.join('ref_image',camera_data.Camera_name)
#         if os.path.exists(image):
#             shutil.rmtree(image)
#         camera_data.delete()
#         ''' Update Usecase Runtime Data for given camera'''
#         if any(UseCaseRuntime.objects(Camera_id=CameraID)):
#             UseCaseRuntime.objects(Camera_id=CameraID).first().delete()

#         ''' Deactivate the Services if any '''
#         requesthandler.delete_camera_socket(CameraID)
#         if servicedata.get('DactiveParentContainers') or servicedata.get('InactiveServices'):
#             # remove services from deviceservicebucket
#             camservicehelpers.deleteServiceBucket(servicedata.get('DactiveParentContainers')+servicedata.get('InactiveServices'))
#             requesthandler.deactivate_services(servicedata.get('InactiveServices')+servicedata.get('DactiveParentContainers'))

#         ''' Update Device Schedule Bucket '''
#         camservicehelpers.updateDeviceScheduleBucket()
#         response.status_code=200
#         requesthandler.send_activity_log(payload['token'],Action="Deleted {} Camera.".format(camera_name))
#         return {"detail":"Success"}
#     except DoesNotExist:
#         ''' No Camera Found With Given ID '''
#         raise HTTPException(status_code=404, detail='Camera Not Found')
#     except Exception as e:
#         console_logger.debug(e)
#         exc_type, exc_obj, exc_tb = sys.exc_info()
#         fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
#         console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
#         raise HTTPException(status_code=500, detail='Internal Server Error')


@router.get(
    "/modules/usecase/settings",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Module Settings added Successfully",
            "content": {
                "application/json": {
                    "example": {"Data": "Success"}
                }
            }
        },
    },
)
async def CameraModuleSettingGet(response: Response, CameraID: str, ServiceID: str,
                                 payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to get usecase settings added by user
    """
    try:
        # check the provided camera id is exist in the system
        cameraObj = Camera.objects.get(Camera_id=CameraID)
        data = {}
        for module in cameraObj.Modules:
            if module.ServiceID == ServiceID:
                data = module.UseCaseParameteres
        if any(data):
            return JSONResponse(status_code=200, content=data)
        else:
            return JSONResponse(status_code=404, content={"detail": "No Developer Settings Found"})
    except DoesNotExist:
        raise HTTPException(
            status_code=404, detail='No Camera Found with this id')
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.get(
    "/modules/usecase/settings/unprotected",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Module Settings added Successfully",
            "content": {
                "application/json": {
                    "example": {"Data": "Success"}
                }
            }
        },
    },
    include_in_schema=True)
async def CameraModuleSettingGet(response: Response, CameraID: str, ServiceID: str):
    """
    API to get usecase settings used by socket server
    """
    try:
        # check the provided camera id is exist in the system
        cameraObj = Camera.objects.get(Camera_id=CameraID)
        for module in cameraObj.Modules:
            if module.ServiceID == ServiceID:
                data = module.UseCaseParameteres
        return JSONResponse(status_code=200, content=data)
    except DoesNotExist:
        raise HTTPException(
            status_code=404, detail='No Camera Found with this id')

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


# @router.put(
#     "/modules/usecase/settings",
#     include_in_schema=True,
#     response_model=DefaultResponseModel,
#     responses={
#         **utility.responses,
#         200: {
#             "description": "Module Settings added Successfully",
#             "content": {
#                 "application/json": {
#                     "example": {"Data": "Success"}
#                 }
#             }
#         },
#     },
# )
# async def CameraModuleSettingPut(response: Response, module_data: CameraModulesPutIn,
#                                  payload: dict = Depends(auth.authenticate_user_token)):
#     """
#     API to update Developer settings
#     """
#     try:
#         # check the provided camera id is exist in the system
#         cameraObj = Camera.objects.get(Camera_id=module_data.CameraID)
#         console_logger.debug(module_data)
#         for module in cameraObj.Modules:
#             if module.ServiceID == module_data.ServiceID:
#                 module.UseCaseParameteres = module_data.UseCaseSettings
#                 module.save()
#         requesthandler.send_camera_modules(
#             (servicemanager.SocketsManager().getmodules(module_data.CameraID))[0])
#         return {"detail": "Success"}

#     except DoesNotExist:
#         raise HTTPException(
#             status_code=404, detail='No Camera Found with this id')
#     except Exception as e:
#         console_logger.debug(e)
#         exc_type, exc_obj, exc_tb = sys.exc_info()
#         fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
#         console_logger.debug("Error on line {}".format(
#             sys.exc_info()[-1].tb_lineno))
#         raise HTTPException(status_code=500, detail='Internal Server Error')


@router.post(
    "/modules/usecase/settings",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "module adding Successful",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    },)
async def CameraModuleSettingPost(response: Response, input_data: CameraModulesPostIn, backgroundtasks: BackgroundTasks,
                                  payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to add ai service information of added camera
    """
    try:
        for module_data in input_data.Services:
            print(module_data)
            module_data = module_data.dict()
            if type(module_data.get('UseCaseSettings')) == dict:
                cam_data = Camera.objects.get(
                    Camera_id=module_data['CameraID'])
                for module in cam_data.Modules:
                    if module.ServiceID == module_data['ServiceID']:
                        module.UseCaseParameteres = module_data.get(
                            'UseCaseSettings')
                        module.save()
                console_logger.debug(servicemanager.SocketsManager(
                ).getmodules(module_data['CameraID'])[0])
                console_logger.debug(module_data)
                requesthandler.send_camera_modules(
                    (servicemanager.SocketsManager().getmodules(module_data['CameraID']))[0])
                requesthandler.send_usecase_parameters(module_data)

        return {"detail": "Success"}
    except DoesNotExist:
        raise HTTPException(
            status_code=404, detail='camera not found with this id')
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500,
                            detail='Internal Server Error')


@ router.get(
    "/modules/developer/settings",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Module Settings added Successfully",
            "content": {
                "application/json": {
                    "example": {"Data": "Success"}
                }
            }
        },
    },
)
async def CameraModuleDevSettingGet(response: Response, CameraID: str, ServiceID: str,
                                    payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update Developer settings
    """
    try:
        # check the provided camera id is exist in the system
        cameraObj = Camera.objects.get(Camera_id=CameraID)
        data = {}
        for module in cameraObj.Modules:
            if module.ServiceID == ServiceID:
                data = module.DeveloperParameters
        if any(data):
            return JSONResponse(status_code=200, content=data)
        else:
            return JSONResponse(status_code=404, content={"detail": "No Developer Settings Found"})
    except DoesNotExist:
        raise HTTPException(
            status_code=404, detail='No Camera Found with this id')

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.get(
    "/modules/developer/settings/unprotected",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Module Settings added Successfully",
            "content": {
                "application/json": {
                    "example": {"Data": "Success"}
                }
            }
        },
    },
    include_in_schema=True)
async def CameraModuleDevSettingGet(response: Response, CameraID: str, ServiceID: str):
    """
    API to update Developer settings
    """
    try:
        # check the provided camera id is exist in the system
        cameraObj = Camera.objects.get(Camera_id=CameraID)
        for module in cameraObj.Modules:
            if module.ServiceID == ServiceID:
                data = module.DeveloperParameters
        return JSONResponse(status_code=200, content=data)
    except DoesNotExist:
        raise HTTPException(
            status_code=404, detail='No Camera Found with this id')

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.put(
    "/modules/developer/settings",
    include_in_schema=True,
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Module Settings added Successfully",
            "content": {
                "application/json": {
                    "example": {"Data": "Success"}
                }
            }
        },
    },
)
async def CameraModuleDevSettingPut(response: Response, module_data: CameraDevSettingModulesPutIn,
                                    payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update Developer settings
    """
    try:
        # check the provided camera id is exist in the system
        cameraObj = Camera.objects.get(Camera_id=module_data.CameraID)
        for module in cameraObj.Modules:
            if module.ServiceID == module_data.ServiceID:
                module.DeveloperParameters = module_data.DeveloperSettings
                module.save()
        return {"detail": "Success"}

    except DoesNotExist:
        raise HTTPException(
            status_code=404, detail='No Camera Found with this id')
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.post(
    "/modules/developer/settings",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "module adding Successful",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    },)
async def CameraModuleDevSettingPost(response: Response, module_data: CameraDevSettingModulesPutIn, backgroundtasks: BackgroundTasks,
                                     payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to add ai service information of added camera
    """
    try:
        module_data = module_data.dict()
        if type(module_data.get('DeveloperSettings')) == dict and len(module_data.get('DeveloperSettings')) > 0:
            cam_data = Camera.objects.get(Camera_id=module_data['CameraID'])
            for module in cam_data.Modules:
                if module.ServiceID == module_data['ServiceID']:
                    module.DeveloperParameters = module_data.get(
                        'DeveloperSettings')
                    module.save()
            console_logger.info("Saving Camera Module Settings")
            return {"detail": "Success"}
        else:
            response.status_code = 400
            return {"detail": "Invalid Developer Settings"}

    except DoesNotExist:
        raise HTTPException(
            status_code=404, detail='camera not found with this id')
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.get(
    "/modulelist",
    response_model=CameraModuleListGetOut,
    responses={
        **utility.responses,
        200: {
            "description": "modules added successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    },)
async def CameraModuleList(response: Response, CameraID: str,
                           payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to add ai service information of added camera
    """
    try:
        cameraObj = Camera.objects.get(Camera_id=CameraID)
        moduleList = []
        for module in cameraObj.Modules:
            moduleList.append(module.payload()['ServiceID'])
        cameraSchedule = camservicehelpers.getServiceSchedule(CameraID)
        console_logger.debug(cameraSchedule)
        currentTime = servicemanager.SocketsManager().getscheduletime()
        return {"Data": moduleList, "CameraSchedule": cameraSchedule, "CurrentTime": currentTime}

    except DoesNotExist:
        raise HTTPException(
            status_code=404, detail='camera not found with this id')
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.post(
    "/modulelist",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "modules added successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    },)
async def CameraModuleList(response: Response, module_data: CameraModulesListAdd,
                           payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to add ai service information of added camera
    """
    try:
        ''' Check Camera ID and Add Related Service to the Camera List '''
        cameraObj = Camera.objects.get(Camera_id=module_data.CameraID)

        ''' Get Existing Module List in the Camera '''
        moduleCameraList = []
        # get_modules = servicemanager.ServiceManager.GetAllServiceList(module_data.CameraID)
        # moduleCameraList = get_modules[0].get('Services') + get_modules[0].get('ParentContainers')
        for modules in cameraObj.Modules:
            moduleCameraList.append(modules.ServiceID)
            moduleCameraList = moduleCameraList + modules.ParentContainerID
        console_logger.debug("all service: {}".format(
            servicemanager.ServiceManager.GetAllServiceList(module_data.CameraID)))

        ''' Save New Modules In Camera '''
        moduleServiceList = set()
        deepstreams = set()
        containerdata = None
        for module in module_data.ModuleList:
            deepstreams.update(module.Parent_container_id)
            moduleServiceList.add(module.Service_id)

            if module.Service_id not in moduleCameraList:
                moduleObj = Module(
                    ServiceID=module.Service_id, ParentContainerID=module.Parent_container_id).save()
                Camera.objects(id=cameraObj.id).update_one(
                    push__Modules=moduleObj)

        ''' Delete services that are not present in the new list '''
        console_logger.debug("module_cameralist: {}".format(moduleCameraList))
        console_logger.debug(
            "module_serviceList: {}".format(moduleServiceList))
        console_logger.debug("module_deepstreamList: {}".format(deepstreams))
        differences = set(moduleCameraList).difference(set(moduleServiceList))

        for service in differences:
            for module in cameraObj.Modules:
                if module.ServiceID == service:
                    Camera.objects(id=cameraObj.id).update_one(
                        pull__Modules=module)
                    Module.objects(id=module.id).first().delete()

        ''' Activate the newly added services through service manager '''
        servicedata = servicemanager.ServiceManager().GetListofServicesWithStatus()
        response_status = requesthandler.activate_services(servicedata.get(
            'ActiveParentContainers')+servicedata.get('ActiveServices'))

        ''' Deactivate the Services if any '''
        if servicedata.get('DactiveParentContainers') or servicedata.get('InactiveServices'):
            requesthandler.deactivate_services(servicedata.get(
                'DactiveParentContainers')+servicedata.get('InactiveServices'))
        else:
            if any(containerdata.get('deepstreamList')) or any(containerdata.get('serviceList')):
                requesthandler.deactivate_services(containerdata.get(
                    'serviceList')+containerdata.get('deepstreamList'))

        ''' Notify SocketServer container that service is activated '''
        ''' data for new socket '''
        console_logger.debug(
            "*****************************************************")
        console_logger.debug(servicemanager.SocketsManager().getmodules(
            module_data.CameraID)[0].get("usecases"))
        if not any(servicemanager.SocketsManager().getmodules(module_data.CameraID)[0].get("usecases")):
            requesthandler.delete_camera_socket(module_data.CameraID)
        else:
            requesthandler.send_camera_modules(
                (servicemanager.SocketsManager().getmodules(module_data.CameraID))[0])
        return JSONResponse(status_code=200, content=response_status)

    except DoesNotExist:
        raise HTTPException(
            status_code=404, detail='camera not found with this id')
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.get("/test/socket")
async def CameraSocketTest():
    current_uc, current_ai, current_cams, camera_metadata = interval_manager.CurrentSlotManager(
    ).get_usecases_from_current_slot()
    data = []
    for camid in current_cams:
        data.extend(servicemanager.SocketsManager().getmodules(CameraID=camid))
    return JSONResponse({"data": data})


@router.get("/schedulehours", include_in_schema=True)
async def CameraSocketTest():
    data = 'ScheduledHours'
    if ScheduleFlag.objects().first():
        data = ScheduleFlag.objects().first().Status
        if data in ['AllTime', 'ScheduledHours']:
            data = 'ScheduledHours'
    return JSONResponse({"data": data})


@router.post("/schedule",
             response_model=DefaultResponseModel,
             responses={
                 **utility.responses,
                 200: {
                     "description": "Schedule added successfully",
                     "content": {
                         "application/json": {
                             "example": {"detail": "Success"}
                         }
                     }
                 },
             }
             )
async def CameraModuleSchedulePost(response: Response,
                                   module_data: ScheduleModuleTime,
                                   payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update information of added camera modules
    """
    try:
        # check for the given camera id is in the system
        global sched
        args = module_data.dict()
        if any(ScheduleRunTime.objects()):
            schedule = ScheduleRunTime.objects().first()
            schedule.OpenTime = module_data.OpenTime
            schedule.CloseTime = module_data.CloseTime
            schedule.save()
        else:
            ScheduleRunTime(**args).save()
        scheduler.setcurrenthours(module_data.OpenTime, module_data.CloseTime)
        scheduler.schedule_days(sched)
        return {"detail": "Success"}
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.get("/schedule",
            response_model=ScheduleTimeGetOut,
            responses={
                **utility.responses,
                200: {
                    "description": "Schedule Returned successfully",
                    "content": {
                        "application/json": {
                            "example": {"detail": "Success"}
                        }
                    }
                },
            }
            )
async def CameraModuleScheduleGet(response: Response,
                                  payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update information of added camera modules
    """
    try:
        # check for the given camera id is in the system
        OpenTime = None
        CloseTime = None
        if any(ScheduleRunTime.objects()):
            schedule = ScheduleRunTime.objects().first()
            OpenTime = schedule.OpenTime
            CloseTime = schedule.CloseTime
        data = {"OpenTime": OpenTime, "CloseTime": CloseTime}
        return {"Data": data}

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.get("/health",
            response_model=DefaultResponseModel,
            responses={
                **utility.responses,
            }
            )
async def CameraHealthStateGet(response: Response,
                               payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update information of added camera modules
    """
    try:
        # check for the given camera id is in the system
        if any(CameraHealthCheck.objects()):
            health = CameraHealthCheck.objects().first().payload()
            return JSONResponse(status_code=200, content={"detail": health})
        data = {
            "HealthCheck": False,
            "HealthCheckInterval": Config.CAMERAHEALTHCHECK/60,
            "GetAlert": False
        }
        return JSONResponse(status_code=200, content={"detail": data})
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.post("/health",
             response_model=DefaultResponseModel,
             responses={
                 **utility.responses,
                 200: {
                     "description": "Schedule added successfully",
                     "content": {
                         "application/json": {
                             "example": {"detail": "Success"}
                         }
                     }
                 },
             }
             )
async def CameraHealthStatePost(response: Response,
                                module_data: CameraHealthStatePostIn,
                                payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update information of added camera modules
    """
    try:
        global CONSENT
        # check for the given camera id is in the system
        if any(CameraHealthCheck.objects()):
            health = CameraHealthCheck.objects().first()
            health.HealthCheck = module_data.CheckHealth
            health.HealthCheckInterval = int(module_data.CheckInterval)*60
            health.GetAlert = module_data.GetAlert
            health.UserConsent = CONSENT
            health.Checkhealth = module_data.CheckHealth
            health.save()
        else:
            CameraHealthCheck(HealthCheck=module_data.CheckHealth, Checkhealth=module_data.CheckHealth,
                              HealthCheckInterval=int(
                                  module_data.CheckInterval)*60,
                              GetAlert=module_data.GetAlert, UserConsent=module_data.UserConsent).save()
        # scheduler.schedule_days(sched)
        activity_request = requesthandler.send_activity_log(
            payload['token'], Action="Camera HealthCheck modified-{}".format(module_data.CheckHealth))
        return {"detail": "Success"}
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.post("/health/unprotected",
             response_model=DefaultResponseModel,
             responses={
                 **utility.responses,
                 200: {
                     "description": "Schedule added successfully",
                     "content": {
                         "application/json": {
                             "example": {"detail": "Success"}
                         }
                     }
                 },
             }
             )
async def CameraHealthStateUnprotectedPost(response: Response,
                                           module_data: CameraHealthStatePostIn):
    """
    API to update information of added camera modules
    """
    try:
        global CONSENT
        # check for the given camera id is in the system
        if any(CameraHealthCheck.objects()):
            health = CameraHealthCheck.objects().first()
            health.HealthCheck = module_data.CheckHealth
            health.HealthCheckInterval = int(module_data.CheckInterval)*60
            health.GetAlert = module_data.GetAlert
            health.UserConsent = CONSENT
            health.Checkhealth = module_data.CheckHealth
            health.save()
        else:
            CameraHealthCheck(HealthCheck=module_data.CheckHealth, Checkhealth=module_data.CheckHealth,
                              HealthCheckInterval=int(
                                  module_data.CheckInterval)*60,
                              GetAlert=module_data.GetAlert, UserConsent=module_data.UserConsent).save()
        # scheduler.schedule_days(sched)
        return {"detail": "Success"}
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.get("/schedule/holidays",
            response_model=HolidayListGetOut,
            responses={
                **utility.responses,
                200: {
                    "description": "Schedule added successfully",
                    "content": {
                        "application/json": {
                            "example": {"detail": "Success"}
                        }
                    }
                },
            },
            include_in_schema=True)
async def HolidayListGet(response: Response,
                         payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update information of added camera modules
    """
    try:
        # check for the given camera id is in the system
        if any(ScheduleRunTime.objects()):
            schedule = ScheduleRunTime.objects().first()
            holiday_list = []
            for date in schedule.HolidayList:
                holiday_list.append(
                    datetime.datetime.strftime(date, '%Y-%m-%d'))
            return {"Data": holiday_list}
        else:
            return JSONResponse(status_code=404, content={"detail": "No Holiday List Found"})
    except DoesNotExist:
        # if given camera id is not present in the system
        raise HTTPException(status_code=404, detail='Camera Not Exist')
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.get("/sample/excel")
async def GetSampleExcelFile(payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update information of added camera modules
    """
    try:
        # check for the given camera id is in the system
        holiday_file = os.path.join(os.getcwd(), 'sample_holiday_file.xlsx')
        return FileResponse(holiday_file)
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.post("/schedule/holidays",
             response_model=DefaultResponseModel,
             responses={
                 **utility.responses,
                 200: {
                     "description": "Holidays added successfully",
                     "content": {
                         "application/json": {
                             "example": {"detail": "Success"}
                         }
                     }
                 },
             },
             include_in_schema=True)
async def HolidayListPost(response: Response,
                          file: UploadFile = File(...),
                          payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update information of added camera modules
    """
    try:
        # check for the given camera id is in the system
        console_logger.debug(file.content_type)
        if file.content_type in ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
            holiday_file = os.path.join(os.getcwd(), 'holidays.xlsx')
            with open(holiday_file, 'wb') as buffer:
                shutil.copyfileobj(file.file, buffer)
            console_logger.debug(exceloperation.get_dates(holiday_file))
            dates = exceloperation.get_dates(holiday_file)
            if any(dates):
                if any(ScheduleRunTime.objects()):
                    schedule = ScheduleRunTime.objects().first()
                    schedule.HolidayList = dates
                    schedule.save()
                else:
                    console_logger.debug(dates)
                    ScheduleRunTime(HolidayList=dates).save()
                return {"detail": 'Success'}
            else:
                return JSONResponse(status_code=400, content={"detail": "holiday dates not found"})
        return JSONResponse(status_code=404, content={"detail": 'Invalid file Format'})
    except DoesNotExist:
        # if given camera id is not present in the system
        raise HTTPException(status_code=404, detail='Camera Not Exist')
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.put("/schedule/holidays",
            response_model=DefaultResponseModel,
            responses={
                **utility.responses,
                200: {
                    "description": "Holidays Updated successfully",
                    "content": {
                        "application/json": {
                            "example": {"detail": "Success"}
                        }
                    }
                },
            },
            include_in_schema=True)
async def HolidayListUpdate(response: Response,
                            holidayList: HolidayListUpdatePutIn,
                            payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update information of added camera modules
    """
    try:
        # check for the given camera id is in the system
        dates = []
        console_logger.debug(holidayList.HolidayList)
        for date in holidayList.HolidayList:
            dates.append(datetime.datetime.strptime(date, "%d-%m-%Y"))
        if any(ScheduleRunTime.objects()):
            schedule = ScheduleRunTime.objects().first()
            schedule.HolidayList = dates
            schedule.save()
        else:
            ScheduleRunTime(HolidayList=dates).save()
        # scheduler.UpdateHolidaySchedule(sched)
        return {"detail": 'Success'}

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.post("/modules/schedule",
             response_model=DefaultResponseModel,
             responses={
                 **utility.responses,
                 200: {
                     "description": "modules added successfully",
                     "content": {
                         "application/json": {
                             "example": {"detail": "Success"}
                         }
                     }
                 },
             }
             )
async def CameraModuleSchedulePost(response: Response,
                                   module_data: ModuleSchedulePostIn,
                                   payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update information of added camera modules
    """
    try:
        # check for the given camera id is in the system
        cam_data = Camera.objects.get(Camera_id=module_data.CameraID)
        for module in cam_data.Modules:
            if module.ServiceID == module_data.ServiceID:
                module.ScheduleRunTime = module_data.Schedule
                module.save()
        return {"detail": "Success"}
    except DoesNotExist:
        # if given camera id is not present in the system
        raise HTTPException(status_code=404, detail='Camera Not Exist')
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.get("/modules/schedule",
            response_model=DefaultResponseModel,
            responses={
                **utility.responses,
                200: {
                    "description": "modules retrived successfully",
                    "content": {
                        "application/json": {
                            "example": {"detail": "Success"}
                        }
                    }
                },
            }
            )
async def CameraModuleScheduleGet(response: Response,
                                  CameraID: str, ServiceID: str,
                                  payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to update information of added camera modules
    """
    try:
        # check for the given camera id is in the system
        cam_data = Camera.objects.get(Camera_id=CameraID)
        data = {'values': ['AllTime', 'ScheduledHours',
                           'UnScheduledHours'], 'servicetimings': False}

        if any(ScheduleRunTime.objects()):
            if ScheduleRunTime.objects().first().OpenTime and ScheduleRunTime.objects().first().CloseTime:
                console_logger.debug("Got Schedule Hours")
                data['servicetimings'] = True
        data['selected'] = "AllTime"
        for module in cam_data.Modules:
            if module.ServiceID == ServiceID:
                schedule_time = module.ScheduleRunTime if module.ScheduleRunTime else "AllTime"
                data['selected'] = schedule_time
        console_logger.debug(data)
        return JSONResponse(content={"Data": data})
    except DoesNotExist:
        # if given camera id is not present in the system
        raise HTTPException(status_code=404, detail='Camera Not Exist')
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.post(
    "/duplicates",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
    },
)
@auth.permission_required(('Admin', 'Superadmin', 'Manufacturer'))
async def CameraLinkCheck(response: Response, LinkData: CheckDuplicatesPostIn,
                          payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to capture image from the camera for setting module data
    """
    try:
        # external trigger to capture image for setting
        if any(Camera.objects(Camera_name=LinkData.Camera_name)):
            response.status_code = 409
            return {"detail": "Camera Name Already present"}
        if any(Camera.objects(Link=LinkData.Link)):
            response.status_code = 409
            return {"detail": "Link Already present"}
        return {"detail": "Success"}
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Camera Does Not Exist")

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        return {"message": "Internal Server Error"}, 500


@router.post(
    "/capture",
    response_model=CameraCaptureGetOut,
    responses={
        **utility.responses,
        451: {
            "description": "Unavailable For Legal Reasons",
            "content": {
                "application/json": {
                    "example": {"detail": "Unable to capture Image"}
                }
            }
        },
    },
)
@auth.permission_required(('Admin', 'Superadmin', 'Manufacturer'))
async def CameraCapturePost(response: Response, Link: CameraCapturePostIn,
                            payload: dict = Depends(auth.authenticate_user_token)):
    # """
    # API to capture image from the camera for setting module data
    # """
    # try:
        # external trigger to capture image for setting
        image_path = 'False'
        source = Link.CameraSource.lower()
        if source == 'rtsp':
            link = camerahealth.generate_rtsp(
                Link.Link, Link.Username, Link.Password)
            image_path = requesthandler.image_capture(source, link, Link.Type)
            console_logger.debug(image_path)

        if source == 'usb':
            image_path = requesthandler.image_capture(
                source, Link.Link, Link.Type)

        if source == 'mipi':
            if platform.uname()[4] == "x86_64":
                return JSONResponse(status_code=451, content={"image_path": "No MIPI Cameras Can Be Connected to the system"})

            image_path = requesthandler.image_capture(
                source, Link.Link[-1], Link.Type)
        console_logger.debug("test")
        if image_path != 'False':
            return {"image_path": Config.STATICFILESERVER+Link.Type+'.jpg'}
        
        return JSONResponse(status_code=451, content={"image_path": "Unable to capture image"})

    # except DoesNotExist:
    #     raise HTTPException(status_code=404, detail="Camera Does Not Exist")

    # except Exception as e:
    #     console_logger.debug(e)
    #     exc_type, exc_obj, exc_tb = sys.exc_info()
    #     fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    #     print("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
    #     return {"message": "Internal Server Error"}, 500


@router.post(
    "/upload",
    response_model=CameraCaptureGetOut,
    responses={
        **utility.responses,
        451: {
            "description": "Unavailable For Legal Reasons",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid File Type"}
                }
            }
        },
        200: {
            "description": "Success",
            "content": {
                "application/json": {
                    "example": {"image_path": "image_path"}
                }
            }
        },
    },
)
@auth.permission_required(('Admin', 'Superadmin'))
async def CameraCaptureUploadPost(response: Response, Type: str = None,
                                  payload: dict = Depends(auth.authenticate_user_token),
                                  file: UploadFile = File(...)):
    """
    API to Upload image from the camera for settings
    """
    try:
        console_logger.debug(file.content_type)
        if file.content_type in ['image/jpg', 'image/jpeg', 'image/png']:
            ImageID = uuid.uuid4().hex[:6].lower()
            image_name = ImageID+'_'+Type+'.jpg'
            file_name = os.path.join(os.getcwd(), 'ref_image', image_name)
            with open(file_name, 'wb') as buffer:
                shutil.copyfileobj(file.file, buffer)
            return {"image_path": Config.STATICFILESERVER+image_name}
        activity_request = await requesthandler.send_activity_log(payload['token'], Action="Uploaded Image.")
        response.status_code = 451
        return {"image_path": "invalid file type"}

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server error")


@router.get(
    "/usb-cameras",
    response_model=USBCameraListGetOut,
    responses={
        **utility.responses,
        451: {
            "description": "Unavailable For Legal Reasons",
            "content": {
                "application/json": {
                    "example": {"detail": "Cameras Not Attached/ Device Restart Required"}
                }
            }
        },
        200: {
            "description": "Unavailable For Legal Reasons",
            "content": {
                "application/json": {
                    "example": {"Data": []}
                }
            }
        }
    },
)
async def GetUsbCamerasListGet(response: Response,
                               payload: dict = Depends(auth.authenticate_user_token)):
    """
        API to add new camera source
    """
    try:
        data = requesthandler.usb_list()
        console_logger.debug(data.get('usblist'))
        if any(data.get('usblist')):
            return {"Data": data.get('usblist')}
        response.status_code = 451
        return {"detail": "Cameras Not Attached/ Device Restart Required"}

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get(
    "/refernce/images",
    include_in_schema=True,
    response_model=USBCameraListGetOut,
    responses={
        **utility.responses,
        200: {
            "description": "Success",
            "content": {
                "application/json": {
                    "example": {"Data": []}
                }
            }
        }
    },
)
async def get_reference_images(response: Response, CameraID: str,):
    ''' API to get camera reference images '''
    try:
        cam = Camera.objects.get(Camera_id=CameraID)
        image_list = []
        if any(cam.RefImage):
            for img in cam.RefImage:
                Type = img.ImageType
                Path = img.ImagePath
                image_list.append({"image_type": Type, "image_path": Path})

        data = {
            "reference_images": image_list
        }
        return JSONResponse(status_code=200, content=data)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Camera Not Found")
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get(
    "/manufacturer/finish",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Success",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    },
)
@auth.permission_required(('Manufacturer',))
async def finish_manufacturing(response: Response,
                               payload: dict = Depends(auth.authenticate_user_token)):
    ''' Api to delete all cameras based on HW after manufacturing process '''
    try:
        global HARDWARE_TYPE
        servicedata = servicemanager.ServiceManager().GetListofServicesWithStatus()

        if HARDWARE_TYPE.lower() == 'ai box':
            camera_sources = ['RTSP', 'MIPI', 'USB']
        else:
            camera_sources = ['RTSP']

        cameraObjects = Camera.objects(Added_by='Manufacturer')
        console_logger.debug(cameraObjects)
        for camera in cameraObjects:
            if camera.Camera_source in [camera_sources]:
                for module in camera.Modules:
                    module.delete()

                if camera.RefImage:
                    for images in camera.RefImage:
                        images.delete()

                image = os.path.join('ref_image', camera.Camera_name)
                if os.path.exists(image):
                    shutil.rmtree(image)
            console_logger.debug("finishing manufacturing process")
            camera.delete()

        requesthandler.deactivate_services(servicedata.get('DactiveParentContainers')
                                           + servicedata.get('InactiveServices')
                                           + servicedata.get('ActiveParentContainers')
                                           + servicedata.get('ActiveServices'))

        return {"detail": "Success"}
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get('/service/health')
def camera_service_health():
    return JSONResponse(status_code=200, content={"detail": "Success"})


@router.get('/deleteservice',)
@auth.permission_required(('Manufacturer', 'Superadmin'))
async def deleteservice(response: Response, service_id: str,
                        payload: dict = Depends(auth.authenticate_user_token)):
    ''' Api to check that service is not used by any camera '''
    try:
        if service_id:
            for cam in Camera.objects():
                if cam.Modules:
                    for module in cam.Modules:
                        if module.ServiceID == service_id:
                            return JSONResponse(status_code=400, content="module present in camera")
        return JSONResponse(status_code=200, content="success")
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get(
    "/factory/reset",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "Success",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    },
)
async def FactoryReset(response: Response, hardreset: Optional[bool]):
    ''' Api to delete all device data '''
    try:
        global HARDWARE_TYPE
        module_list = set()
        if HARDWARE_TYPE.lower() == 'ai box':
            for camera in Camera.objects():
                if camera.Modules:
                    for module in camera.Modules:
                        module_list.add(module.ServiceID)
                        for dp in module.ParentContainerID:
                            module_list.add(dp)
                requesthandler.delete_camera_socket(camera.Camera_id)

                image = os.path.join('ref_image', camera.Camera_name)
                console_logger.debug("deleting Image")
                if os.path.exists(image):
                    shutil.rmtree(image)
            requesthandler.deactivate_services(list(module_list))
            if sched:
                sched.remove_all_jobs()
            Taskmeta.drop_collection()
            Module.drop_collection()
            ScheduleFlag.drop_collection()
            ScheduleRunTime.drop_collection()
            ReferenceImage.drop_collection()
            Camera.drop_collection()
            return {"detail": "Success"}
        else:
            camera_sources = 'RTSP'

        cameraObjects = Camera.objects()
        for camera in cameraObjects:
            if camera.Camera_source == camera_sources and camera.Added_by != 'Manufacturer':
                requesthandler.delete_camera_socket(camera.Camera_id)
                if camera.Modules:
                    for module in camera.Modules:
                        module_list.add(module.ServiceID)
                        for dp in module.ParentContainerID:
                            module_list.add(dp)
                        module.delete()

                if camera.RefImage:
                    for images in camera.RefImage:
                        images.delete()

                image = os.path.join('ref_image', camera.Camera_name)
                if os.path.exists(image):
                    shutil.rmtree(image)
                camera.delete()
        console_logger.debug(module_list)
        requesthandler.deactivate_services(list(module_list))
        return {"detail": "Success"}
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get('/new/health/camera')
async def camera_new_health(payload: dict = Depends(auth.authenticate_user_token)):
    for task in asyncio.all_tasks(): 
        if (task.get_name()).find("health") != -1 and task.done() == False:
            return JSONResponse(status_code=200, content={"detail": "Success"})

    healthObj = CameraHealthCheck.objects.first()
    if healthObj.HealthCheck:
        console_logger.debug(
            "Camera Healthcheck Status:------------------------------------  {}".format(healthObj.HealthCheck))
        taskName = "performing health check"
        task = asyncio.create_task(
            asyncio.to_thread(
                camerahealth.check_cameras
            ),
            name=taskName
        )
    return JSONResponse(status_code=200, content={"detail": "Success"})


@router.post(
    "/modulelistnew",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "modules added successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }, include_in_schema=True)
async def CameraModuleListNew(response: Response, module_data: CameraModulesListAdd,
                              payload: dict = Depends(auth.authenticate_user_token)):
    """
    API to add ai service information of added camera
    """
    try:
        ''' Check Camera ID and Add Related Service to the Camera List '''
        # old_data = copy.deepcopy(camservicehelpers.getScheduleBucketData())
        # camservicehelpers.saveModuleToCamera(module_data)
        # console_logger.debug(old_data)
        # for module in module_data.ModuleList:
        #     console_logger.debug(module.Service_id)
        #     if module.Service_id not in old_data["ScheduledUC"] or module.Service_id not in old_data["UnScheduledUC"]:
        #         old_data["ScheduledUC"].append(module.Service_id)
        #         old_data["UnScheduledUC"].append(module.Service_id)
        # camservicehelpers.getDifferenceAndDeactivate(old_data,camservicehelpers.getScheduleBucketData())
        usecaseData = {
            "DeviceScheduleDetail": camservicehelpers.getScheduleBucketData()}
        return JSONResponse(status_code=200, content={"detail": usecaseData, "module_data": jsonable_encoder(module_data.ModuleList)})
    except DoesNotExist:
        raise HTTPException(
            status_code=404, detail='camera not found with this id')
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.post(
    "/modulelistschedule",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "modules added successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    }, include_in_schema=True)
async def CameraModuleListSchedule(response: Response, module_data: CamModuleSchedulePostIn,
                                   payload: dict = Depends(auth.authenticate_user_token)):
    try:
        currentTime = servicemanager.SocketsManager().getscheduletime()

        if module_data.Flag == 1:
            # camservicehelpers.mapCameraUsecase(module_data)
            # camservicehelpers.getDifferenceAndDeactivate(camservicehelpers.getScheduleBucketData(), module_data.currentScheduleDetails)
            camservicehelpers.saveModuleToCamera(module_data)
            # runtimeCamera = UseCaseRuntime.objects(Camera_id=module_data.CameraID).first()

            # save camera module data and now activate and deactivate the services accordingly

            # if runtimeCamera:
            #     console_logger.debug(module_data)
            #     schedule_set = set(runtimeCamera.ScheduledUsecase).difference(set(module_data.currentScheduleDetails.ScheduledUC))
            #     uschedule_set = set(runtimeCamera.UnScheduledUseCase).difference(set(module_data.currentScheduleDetails.UnScheduledUC))
            #     pschedule_set = set(runtimeCamera.ScheduledParent).difference(set(module_data.currentScheduleDetails.ScheduledDP))
            #     puschedule_set = set(runtimeCamera.UnScheduledParent).difference(set(module_data.currentScheduleDetails.UnScheduledDP))
            #     console_logger.debug(schedule_set)
            #     if any(schedule_set):
            #         UseCaseRuntime.objects(id = runtimeCamera.id).update_one(pull_all__ScheduledUsecase = list(schedule_set))
            #     else:
            #         console_logger.debug("here")
            #         runtimeCamera.ScheduledUsecase = module_data.currentScheduleDetails.ScheduledUC

            #     if any(uschedule_set):
            #         UseCaseRuntime.objects(id = runtimeCamera.id).update_one(pull_all__UnScheduledUseCase = list(uschedule_set))
            #     else:
            #         runtimeCamera.UnScheduledUseCase = module_data.currentScheduleDetails.UnScheduledUC

            #     if any(pschedule_set):
            #         UseCaseRuntime.objects(id = runtimeCamera.id).update_one(pull_all__ScheduledParent = list(pschedule_set))
            #     else:
            #         runtimeCamera.ScheduledParent = module_data.currentScheduleDetails.ScheduledDP

            #     if any(puschedule_set):
            #         UseCaseRuntime.objects(id = runtimeCamera.id).update_one(pull_all__UnScheduledParent = list(puschedule_set))
            #     else:
            #         runtimeCamera.UnScheduledParent = module_data.currentScheduleDetails.UnScheduledDP
            #     runtimeCamera.save()

            cameraObj = Camera.objects.get(Camera_id=module_data.CameraID)
            console_logger.debug("updating module")
            for module in cameraObj.Modules:
                mod = 0
                if module.ServiceID in module_data.currentScheduleDetails.ScheduledUC and module.ServiceID in module_data.currentScheduleDetails.UnScheduledUC:
                    mod = 1
                elif module.ServiceID in module_data.currentScheduleDetails.ScheduledUC:
                    mod = 2
                else:
                    mod = 3
                if mod == 1:
                    module.ScheduleRunTime = 'AllTime'
                elif mod == 2:
                    module.ScheduleRunTime = 'ScheduledHours'
                elif mod == 3:
                    module.ScheduleRunTime = 'UnScheduledHours'
                module.save()

            # update schedule bucket data in db
            # camservicehelpers.updateDeviceScheduleBucket()
            camservicehelpers.setRunTime(
                module_data.CameraID, camservicehelpers.getAllDataCamera(module_data.CameraID))
            camservicehelpers.updateDeviceScheduleBucketDirect()
            camservicehelpers.getDifferenceAndDeactivate(
                module_data.currentScheduleDetails.dict(), camservicehelpers.getScheduleBucketData())
            # start service to configure
            if currentTime == 'UnScheduledHours':
                response_status = requesthandler.activate_services(
                    module_data.currentScheduleDetails.ScheduledUC)
            else:
                response_status = requesthandler.activate_services(
                    module_data.currentScheduleDetails.UnScheduledUC)
            console_logger.debug(currentTime)
            console_logger.debug(response_status)
            # send camera module data to socket server
            requesthandler.send_camera_modules(
                servicemanager.SocketsManager().getmodules(module_data.CameraID)[0])
            return JSONResponse(status_code=200, content={"detail": response_status, "currenttime": currentTime})
            # it activate services that currently should be running

        if module_data.Flag == 2:
            service_status = servicemanager.ServiceManager().GetListofServicesWithStatus()
            console_logger.debug(service_status)
            # start/stop service to configure
            scheduleservice = camservicehelpers.getScheduleBucketData()
            if currentTime == 'UnScheduledHours':
                inactive_list = list(set(module_data.currentScheduleDetails.ScheduledUC).difference(
                    set(service_status.get("ActiveServices"))))
                requesthandler.stop_service_socket_many(
                    inactive_list, camera_id=module_data.CameraID)
                console_logger.debug("sleeping for 5 seconds")
                requesthandler.deactivate_services(inactive_list)
                response_status = requesthandler.activate_services(
                    module_data.currentScheduleDetails.UnScheduledUC + module_data.currentScheduleDetails.UnScheduledDP)
            else:
                inactive_list = list(set(module_data.currentScheduleDetails.UnScheduledUC).difference(
                    set(service_status.get("ActiveServices"))))
                requesthandler.stop_service_socket_many(
                    inactive_list, camera_id=module_data.CameraID)
                console_logger.debug("sleeping for 5 seconds")
                requesthandler.deactivate_services(inactive_list)
                response_status = requesthandler.activate_services(
                    module_data.currentScheduleDetails.ScheduledUC + module_data.currentScheduleDetails.ScheduledDP)
            console_logger.debug(response_status)
            return JSONResponse(status_code=200, content={"detail": response_status, "currenttime": currentTime})
    except DoesNotExist:
        raise HTTPException(
            status_code=404, detail='camera not found with this id')
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.post(
    "/getactiveservices",
    response_model=DefaultResponseModel,
    responses={
        **utility.responses,
        200: {
            "description": "modules added successfully",
            "content": {
                "application/json": {
                    "example": {"detail": "Success"}
                }
            }
        },
    },)
async def CameraAllActiveServices(response: Response):
    return JSONResponse(status_code=200, content={"detail": servicemanager.ServiceManager().GetListofServicesWithStatus()})


@router.post("/service/status")
async def CameraServiceStatusPost(response: Response, data: ServiceStatusPostIn):
    response = camservicehelpers.ChangeServiceStatus(
        data.ServiceName, data.Status)
    return {"detail": response}


@router.get("/service/status")
async def CameraServiceStatusGet(response: Response):
    console_logger.debug("asking for service status")
    return camservicehelpers.GetAllServiceStatus()


@router.get("/sync", include_in_schema=True)
async def TriggerSync():
    scheduler.SyncTrigger()
    return "success"


@router.get("/details")
async def CameraDetails(response: Response, CameraID: str, payload: dict = Depends(auth.authenticate_user_token)):
    try:
        cameraObj = Camera.objects.get(Camera_id=CameraID)
        camera_dict = cameraObj.payload()
        camera_dict.pop("RefImage")
        camera_dict.pop("Camera_id")
        camera_dict.pop("Modules")
        for imgID in cameraObj.RefImage:
            camera_dict[imgID.ImageType] = Config.STATICFILESERVER + \
                str(imgID.ImagePath)
        usecaseList = []
        parentList = []
        for module in cameraObj.Modules:
            usecaseList.append(module.payload()['ServiceID'])
            parentList.extend(module.payload()['Parent_container_id'])

        # cameraSchedule = camservicehelpers.getServiceSchedule(CameraID)
        currentTime = servicemanager.SocketsManager().getscheduletime()
        response = {
            "CameraDetails": camera_dict,
            "UsecaseDetails": usecaseList,
            "AIDetails": list(set(parentList)),
            "CurrentHours": currentTime
        }
        return response
    except DoesNotExist:
        response.status_code = 404
        return "Camera Not Found With This ID"


@router.get("/get_all_slots")
def endpoint_to_get_all_timeslots_with_assigned_services(payload: dict = Depends(auth.authenticate_user_token)):
    global timeslots
    if not any(TimeSlots.objects):
        set_timeslots_default()
    return time_manager.get_all_timeslots()


@router.post("/send_camera_slots")
def save_dictionary(background_task: BackgroundTasks, response: Response, input: TimeSlotPostIn, payload: dict = Depends(auth.authenticate_user_token)):
    ''' save slot dictionary got from frontend and map camera services and their parents '''
    try:
        data = requesthandler.get_configs_from_base()
        if data:
            getLimitations(data)
        console_logger.debug("*************** saving camera into slots")
        services = []
        all_usecases = set()
        diff = interval_manager.check_difference(input.CameraID)
        if any(input.Timeslots.keys()):
            for slot in input.Timeslots.keys():
                if time_manager.validate_slot(slot, input.CameraID, input.Timeslots[slot]):
                    if any(input.Timeslots[slot]):
                        services.extend(input.Timeslots[slot]['Usecases'])
                        services.extend(input.Timeslots[slot]['AI'])
                        time_manager.update_local_camera(
                            slot, input.CameraID, input.Timeslots[slot])
                        all_usecases.update(
                            set(input.Timeslots[slot]["Usecases"]))
                    else:
                        time_manager.delete_camera_slot(slot, input.CameraID)
                    time_manager.update_global(slot)
                else:
                    return JSONResponse("failed", status_code=400)
        else:
            time_manager.delete_camera(input.CameraID)
            for slot in timeslots:
                time_manager.update_global(slot)

        difference, new_usecases = diff.new_object()
        if difference or new_usecases:
            camera_handler = interval_manager.CameraHandler(
                input.CameraID, difference, new_usecases)
            camera_handler.remove_usecase()
        interval_manager.ServiceStatusManager().createservicestatus(services)
        return "success"
    except DoesNotExist:
        return JSONResponse({"message": "camera id not exist"}, status_code=404)
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        return JSONResponse({"message": "failed"}, status_code=500)


@router.delete("")
def delete_slot_camera(background_task: BackgroundTasks, response: Response, CameraID: str, payload: dict = Depends(auth.authenticate_user_token)):
    ''' delete camera from the device on runtime '''
    try:
        interval_manager.TimeSlotManager().delete_camera(CameraID)
        requesthandler.delete_camera_socket(CameraID)
        # current_uc, current_ai, current_cams = interval_manager.CurrentSlotManager().get_usecases_from_current_slot()

        removed_services = interval_manager.CameraServiceManager(
        ).retrive_camera_services([CameraID])

        for slot in timeslots:
            time_manager.update_global(slot)
        interval_manager.CameraHandler(CameraID).delete_camera_usecases()

        running_services = interval_manager.CameraServiceManager().retrive_camera_services()
        if set(removed_services).difference(set(running_services)):

            interval_manager.ServiceStatusManager().DeleteServicesStatus(
                list(set(removed_services).difference(set(running_services))))

        inactive_services = set(removed_services).difference(
            set(running_services))

        console_logger.debug(
            "current inactive services: {}".format(inactive_services))

        if any(inactive_services):

            requesthandler.deactivate_services(list(inactive_services))
        # return "success"
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
    finally:
        cameraObject = Camera.objects(Camera_id=CameraID)
        if len(cameraObject) != 0:
            cameraObject[0].delete()
        return "success"


@router.get("/slot", include_in_schema=True)
def get_provided_slot(response: Response, slot: str):
    return time_manager.get_slot_info(slot)


@router.get("/update/global", include_in_schema=True)
def update_global_slot(response: Response, timeslot: str):
    time_manager.update_global(timeslot)
    return "success"


@router.post("/edit/usecase")
def delete_camera_from_usecase(background_task: BackgroundTasks, response: Response, input: RemoveUsecaseCameras, payload: dict = Depends(auth.authenticate_user_token)):
    try:
        console_logger.debug(input)
        global timeslots
        for slot in timeslots:
            for camera in input.Timeslots[slot]["local"]:
                if input.Timeslots[slot]["local"][camera].keys():
                    console_logger.debug("keys exists")
                    time_manager.update_local_camera(
                        slot, camera, input.Timeslots[slot]["local"][camera])
                else:
                    time_manager.delete_camera_slot(slot, camera)
            time_manager.update_global(slot)
        return "success"
    except DoesNotExist:
        return JSONResponse({"message": "No Camera Found with Given id"}, status_code=404)


@router.get("/get_timeslots")
def get_timeslots(response: Response, payload: dict = Depends(auth.authenticate_user_token)):
    # console_logger.debug(interval_manager.convert_timeslots_to_date(datetime.datetime.now()))
    # scheduler.schedule_slots(
    #     interval_manager.convert_timeslots_to_date(datetime.datetime.now()))
    return "success"


@router.get("/get_jobs", include_in_schema=True)
def get_jobs(response: Response):
    global sched
    job_list = sched.get_jobs(pending=True)
    console_logger.debug(job_list)
    pending_job_list = []
    for job in job_list:
        if job.name == "slots":
            console_logger.debug(job.args[0])
            pending_job_list.append(job.args[0])
    console_logger.debug(pending_job_list)
    return timeslots[pending_job_list[0]-1]


@router.get("/configure_services")
def configure_services(response: Response, payload: dict = Depends(auth.authenticate_user_token)):
    ''' start configuring services '''
    health = CameraHealthCheck.objects.first()
    health.HealthCheck = False
    health.save()
    console_logger.debug(
        "camera healthcheck status: {}".format("off" if not health.HealthCheck else "on"))
    current_uc, current_ai, current_cams, camera_metadata = interval_manager.CurrentSlotManager(
    ).get_usecases_from_current_slot()
    service_data = interval_manager.CameraServiceManager(
    ).retrive_camera_services(current_cams)
    if current_uc:
        # requesthandler.stop_service_socket_many(list(set.union(current_uc, current_ai)))
        requesthandler.delete_camera_socket_many(current_cams)
        request_data = requesthandler.deactivate_services(service_data)
    return "success"


@router.get("/get_cameras", )
def get_used_cameras(response: Response, service_id: str, payload: dict = Depends(auth.authenticate_user_token)):
    data = {
        '0-2': [], '2-4': [], '4-6': [], '6-8': [],
        '8-10': [], '10-12': [], '12-14': [], '14-16': [],
        '16-18': [], '18-20': [], '20-22': [], '22-24': []
    }
    # dd = defaultdict(list)
    for camera in Camera.objects():
        if any(camera.Modules):
            console_logger.debug(data)
            for module in camera.Modules:
                if module.ServiceID == service_id:
                    values = interval_manager.get_camera_service_slots(
                        camera.Camera_id, service_id)
                    for slot in timeslots:
                        if values[slot]:
                            data[slot].append(values[slot])
        console_logger.debug(data)
    # console_logger.debug(data)
    return data


@router.post("/remove_camera")
def remove_slot_camera(response: Response, input: TimeSlotRemovePostIn, payload: dict = Depends(auth.authenticate_user_token)):
    for slot in timeslots:
        tslot = TimeSlots.objects.get(TimeSlot=slot)
        for cam in tslot.Local:
            if cam.CameraID in input.TimeSlots[slot]:
                cam.update(pull__Usecases=input.ServiceId)
        time_manager.update_global(slot)
    return "success"


@router.get("/get_my_cameras", include_in_schema=True)
def get_my_cameras(response: Response, service_id: str, camera_id: str):
    console_logger.debug(
        interval_manager.get_camera_service_slots(camera_id, service_id))
    return "success"


@router.post("/test/temporary", include_in_schema=True)
def testting_endpoint(response: Response):
    interval_manager.CameraServiceManager().get_modules()
    return "success"


def startupactivity():
    try:
        healthObj = CameraHealthCheck.objects.first()
        healthObj.HealthCheck = True
        healthObj.save()

        if any(Camera.objects):
            # interval_manager.get_current_timeslot(datetime.datetime.now())
            current_uc, current_ai, current_cams = interval_manager.CurrentSlotManager(
            ).get_usecases_from_current_slot()
            # interval_manager.map_service_data(current_cams)
            console_logger.debug(current_uc)
            if current_uc or current_ai:
                request_data = requesthandler.activate_services(
                    list(current_uc))
                services = interval_manager.map_service_data(current_cams)
                for service in services:
                    console_logger.debug(service)
                    requesthandler.send_camera_modules(service)
                    # requesthandler.send_usecase_parameters()
    except Exception as e:
        Taskmeta(Status="failed", Task_name="StartupActivity",
                 Traceback=str(e)).save()
        return 0


@retry(exceptions=(TimeoutError, ConnectionError, ConnectionRefusedError), delay=10, times=10)
def run_in_background():
    global sched
    sched = create_scheduler()
    sched.start()
    schedule_slots(sched)
    data = requesthandler.get_configs_from_base()
    if data:
        getLimitations(data)
        if data.get('Status') in ["Blocked", "Suspended"]:
            camservicehelpers.deactivate_all_services()
    if not any(CameraHealthCheck.objects):
        CameraHealthCheck(Checkhealth=True).save()
    return


@router.on_event("startup")
def CameraHealth(background_task=BackgroundTasks()):
    background_task.add_task(run_in_background())
    health = CameraHealthCheck.objects.first()
    health.HealthCheck = True
    health.save()
    console_logger.debug(
        "camera healthcheck status: {}".format("off" if pause_healthcheck else "on"))
    interval_manager.ServiceStatusManager().SetServiceStatusFalse()
    return "success"


@router.get("", response_model=CameraInfoGetOut, responses={**utility.responses}, tags=["new info"])
async def endpoint_to_fetch_added_cameras(CameraID: str = None, Page_number: Optional[int] = None,
                                          Page_size: Optional[int] = None,
                                            Layout: Optional[str] = "grid", payload: dict = Depends(auth.authenticate_user_token)):
    # try:
    page_no = 1
    page_size = 10
    response_data = {}

    if Page_number:
        page_no = int(Page_number)
    if Page_size:
        page_size = int(Page_size)

    query = {}
    if CameraID:
        query["Camera_id"] = CameraID

    start = page_size*(page_no - 1)
    end = start + page_size

    camera_list = []
    camera_objects = []
    camera_objects_fetched = []

    if Layout == "grid":
        camera_objects_fetched = Camera.objects(**query)[start:end]
        for camera in camera_objects_fetched:
            if camera.Camera_name:
                camera_objects.append(camera)
            else:
                camera.delete()
        service_status = ServiceStatus.objects.all()

        if any(camera_objects):
            for camera_data in camera_objects:
                camera_dict = camera_data.payload()
                camera_dict['Ai_status'] = False
                if any(camera_data.Modules):
                    for module in camera_data.Modules:
                        for parent in module.ParentContainerID:
                            for service in service_status:
                                if parent == service.ServiceName and service.Status == True:
                                    camera_dict['Ai_status'] = True

                camera_dict.pop('Modules')
                if camera_data.RefImage:
                    for imgID in camera_data.RefImage:
                        camera_dict[imgID.ImageType] = Config.STATICFILESERVER + \
                            str(imgID.ImagePath)
                camera_list.append(camera_dict)

        response_data['Page_size'] = page_size
        response_data['Page_number'] = page_no
        response_data['Total_count'] = len(camera_list)
        response_data['Data'] = camera_list

        return response_data

    elif Layout == "list":
        
        inactiveCameras = list(Camera.objects.all())

        

        _, _, current_cams, _ = interval_manager.CurrentSlotManager(
        ).get_usecases_from_current_slot(current_slot=None)
        # console_logger.debug(current_cams)
        if any(current_cams):
            for cam in current_cams:
                try:
                    inactiveCameraIds = []
                    for inactiveCamera in inactiveCameras:
                        inactiveCameraIds.append(inactiveCamera.Camera_id)
                    # console_logger.debug(inactiveCameraIds)
                    index = inactiveCameraIds.index(cam)
                    # console_logger.debug(index)
                    cameraObject = inactiveCameras.pop(index)
                    camera_objects_fetched.append(cameraObject)

                except ValueError:
                    pass

                
        # console_logger.debug(camera_objects_fetched)
        service_status = ServiceStatus.objects.all()
        for camera in camera_objects_fetched:
            if camera.Camera_name:
                camera_objects.append(camera)
            else:
                camera.delete()
        

        if any(camera_objects):
            for camera_data in camera_objects:
                camera_dict = camera_data.payload()
                camera_dict['Ai_status'] = False
                if any(camera_data.Modules):
                    for module in camera_data.Modules:
                        for parent in module.ParentContainerID:
                            for service in service_status:
                                if parent == service.ServiceName and service.Status == True:
                                    camera_dict['Ai_status'] = True

                camera_dict.pop('Modules')
                if camera_data.RefImage:
                    for imgID in camera_data.RefImage:
                        camera_dict[imgID.ImageType] = Config.STATICFILESERVER + \
                            str(imgID.ImagePath)
                camera_dict["Type"] = "Active"
                camera_list.append(camera_dict)

        camera_objects = []
        for camera in inactiveCameras:
            if camera.Camera_name:
                camera_objects.append(camera)
            else:
                camera.delete()
        

        if any(camera_objects):
            for camera_data in camera_objects:
                camera_dict = camera_data.payload()
                camera_dict['Ai_status'] = False
                if any(camera_data.Modules):
                    for module in camera_data.Modules:
                        for parent in module.ParentContainerID:
                            for service in service_status:
                                if parent == service.ServiceName and service.Status == True:
                                    camera_dict['Ai_status'] = True

                camera_dict.pop('Modules')
                if camera_data.RefImage:
                    for imgID in camera_data.RefImage:
                        camera_dict[imgID.ImageType] = Config.STATICFILESERVER + \
                            str(imgID.ImagePath)
                camera_dict["Type"] = "Inactive"
                camera_list.append(camera_dict)

        response_data['Page_size'] = page_size
        response_data['Page_number'] = page_no
        response_data['Total_count'] = len(camera_list)
        response_data['Data'] = camera_list

        return response_data  

    raise HTTPException(status_code=404, detail="Camera not found")

    # except DoesNotExist:
    #     raise HTTPException(status_code=404, detail="Camera not found")
    # except Exception as e:
    #     console_logger.debug(e)
    #     raise HTTPException(status_code=500)


@router.get("/finish_configure", tags=["new info"])
def finish_configure_services(response: Response, payload: dict = Depends(auth.authenticate_user_token)):

    health = CameraHealthCheck.objects.first()
    health.HealthCheck = True
    health.save()
    console_logger.debug(
        "camera healthcheck status: {}".format("off" if not health.HealthCheck else "on"))
    ''' start services for current slot '''
    inactive_services = inactive_cams = camera_metadata = None

    current_uc, current_ai, current_cams, camera_metadata = interval_manager.CurrentSlotManager(
    ).get_usecases_from_current_slot(current_slot=None)

    inactive_uc, inactive_ai, inactive_cams = interval_manager.CurrentSlotManager(
    ).get_usecases_from_inactive_slots(current_slot=None)

    inactive_services = list(inactive_ai.difference(current_ai))
    inactive_services.extend(
        list(inactive_uc.difference(current_uc)))

    console_logger.debug(
        "inactive_cameras_metadata: {}".format(inactive_cams))

    requesthandler.delete_camera_socket_many(inactive_cams)
    request_data = requesthandler.deactivate_services(inactive_services)
    console_logger.debug(camera_metadata)
    if current_uc or current_ai:
        request_data = requesthandler.activate_services(list(current_uc))
        requesthandler.send_camera_modules_many(camera_metadata)

    return "success"
    # except Exception as e:
    #     console_logger.debug(e)
    #     exc_type, exc_obj, exc_tb = sys.exc_info()
    #     fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    #     console_logger.debug("Error on line {}".format(
    #         sys.exc_info()[-1].tb_lineno))
    # return JSONResponse({"message": "failed"}, status_code=500)


@router.get("/switch_new_slot", tags=["new info"])
def switch_to_given_slot(response: Response, start_slot: int, payload: dict = Depends(auth.authenticate_user_token)):
    try:
        run_slot(slotManager.new_timeslots.index(start_slot))
    except Exception as e:
        console_logger.debug(e)
        return JSONResponse({"message": "failed"}, status_code=500)


@router.get("/count")
async def endpoint_to_get_added_camera_count(payload: dict = Depends(auth.authenticate_user_token)):
    try:
        camera_objects = []
        camera_objects_fetched = Camera.objects.all()

        for camera in camera_objects_fetched:
            if camera.Camera_name:
                camera_objects.append(camera)
            else:
                camera.delete()
        # cameraCount = Camera.objects.count()

        return {"detail": len(camera_objects)}
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.get("/current_slot_data")
def get_current_slot_data():
    timeslots = ("0-2", "2-4", "4-6", "6-8", "8-10", "10-12",
                     "12-14", "14-16", "16-18", "18-20", "20-22", "22-24")    
    current_timeslot = timeslots[int(interval_manager.get_current_timeslot())]
    current_uc, current_ai, current_cams, camera_metadata = interval_manager.CurrentSlotManager(
        ).get_usecases_from_current_slot(current_slot=current_timeslot)
    return {"usecases":current_uc,"ai":current_ai}

@router.put("/camera_details")
def update_camera_rtsp_details(response: Response, input: UpdateCameraRtspDetailsPostIn, payload: dict = Depends(auth.authenticate_user_token)):
    try:
        cam = Camera.objects.get(Camera_id=input.CameraID)
        cam.set_password(input.Password)
        cam.username = input.Username
        cam.save()
        requesthandler.send_camera_modules(
            (servicemanager.SocketsManager().getmodules(input.CameraID))[0])
        return "success"
    except DoesNotExist:
        response.status_code = 404
        return "camera not found"
    except Exception as e:
        console_logger.debug(e)
        return "internal server error"
