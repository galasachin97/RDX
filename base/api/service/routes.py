import os
import sys
import json
import asyncio
import shutil
import datetime
import time
import requests
import copy
from typing import List, Optional
from fastapi import Query, Request, Form
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from fastapi_utils.tasks import repeat_every
from fastapi.security.http import HTTPBase
from fastapi.encoders import jsonable_encoder
from mongoengine.errors import DoesNotExist, OperationError, NotUniqueError, ValidationError
from fastapi import APIRouter, HTTPException, Header, Depends, UploadFile, File, BackgroundTasks,Response
from starlette.background import BackgroundTask
from api.service.helpers.telegramhandler import telegramHandler
from api.service.helpers import auth

from api.service.serializers import *
from api.service.helpers.collectdata import collect_n_upload
from api.service.helpers.auth_helpers import Authentication
from api.service.helpers.restart import RestartOpertaions
from api.service.helpers.com_helpers import AlertsOperations
from api.service.helpers.sync import SyncOperations
from api.service.models import *
from api.service.helpers import validation_helpers, util_models, check_internet
from api.service.helpers.excel import generate_excelsheet, generate_excelsheet_report
from api.service.helpers.logs import console_logger
from api.service.helpers.fifo import Fifo
import api.service.helpers.responses as responses
from api.service.helpers.mail import Mail
from api.service.helpers.tasklogger import log_task
from fastapi_utils.tasks import repeat_every
from api.service.helpers.general_helpers import *
from api.service.helpers.sockethandler import socketManager
from api.service.helpers.startup import Startup
from api.service.helpers.notifications import notificationHandler
from api.service.helpers.whatsapp import whatsappHandler
from api.service.helpers.reset_settings import resetSettingsHandler
from api.service.helpers.upload import Upload

from api.service.helpers.api_operations import APIOperations

router = APIRouter()
api_operations = APIOperations()


async def other_operation():
    pass

def start_telegram():
    console_logger.debug("initializing telegram client")
    telegram_profile = TelegramDetails.objects.first()
    if telegram_profile:
        chat_id_profile = telegram_profile.ChannelLink.rsplit('/', 1)[-1]
        chat_id = "{}{}".format("@", chat_id_profile)
        console_logger.debug(telegram_profile.payload()['token'])
        telegramHandler.start(telegram_profile.payload()['token'], chat_id)
    console_logger.debug("telegram client initialized")

def start_whatsapp():
    whatsappHandler.load_variables()


@router.on_event("startup")
@repeat_every(seconds=7200)
async def startup_event():

    deviceObject = DeviceInfo.objects.all()
    if any(deviceObject):
        restarter = RestartOpertaions()
        # restarter.verify_device()
        # Verifying the device
        name = "verify_device_" + datetime.datetime.strftime(datetime.datetime.utcnow(), "%Y/%M/%D_%H:%M:%S")
        task = asyncio.create_task(asyncio.to_thread(restarter.verify_device), name=name)
        task.add_done_callback(log_task)
        console_logger.debug("Verfying Device")

        Upload()
        start_telegram()
        start_whatsapp()

        console_logger.debug("running background tasks")
        backgroundTasks = []
        for backgroundTask in asyncio.all_tasks():
            backgroundTasks.append(backgroundTask)

        try:
            _ = backgroundTasks.index("sync data")
        except ValueError:
            
            task = asyncio.create_task(
                asyncio.to_thread(
                        collect_n_upload
                    ),
                    name="sync data"
            )
            task.add_done_callback(log_task)

        if check_internet.is_internet_present():
            fifo = Fifo()
            name = "fifo_" + \
                datetime.datetime.strftime(
                    datetime.datetime.utcnow(), "%Y/%M/%D_%H:%M:%S")
            task = asyncio.create_task(asyncio.to_thread(fifo.run_fifo), name=name)
            task.add_done_callback(log_task)

        api_operations.fetchAppStatus(api_call=True)

        # for backgroundTask in asyncio.all_tasks():
        #     console_logger.debug(backgroundTask.get_name())
        # if (backgroundTask.get_name()).find("sync data") == -1:
        
        # Verifying the access
        # name = "verify_access_" + \
        #     datetime.datetime.strftime(
        #         datetime.datetime.utcnow(), "%Y/%M/%D_%H:%M:%S")
        # task = asyncio.create_task(asyncio.to_thread(
        #     restarter.verify_access), name=name)
        # task.add_done_callback(log_task)
        # console_logger.debug("Verifying Access")


@router.post("/fifo")
async def start_fifo():
    try:
        fifo = Fifo()
        name = "fifo_" + \
            datetime.datetime.strftime(
                datetime.datetime.utcnow(), "%Y/%M/%D_%H:%M:%S")
        task = asyncio.create_task(asyncio.to_thread(fifo.run_fifo), name=name)
        # tasks.append(task)
        task.add_done_callback(log_task)
        console_logger.debug("Fifo")
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
    except Exception:
        raise HTTPException(status_code=500)


@router.post("/manufacture",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                404: responses._404(desc="Manufacturer key not found", detail="Manufacturer key not found"),
                403: responses._403(desc="Already configured", detail="Already configured"),
                502: responses._502()
            })
async def add_device(payload: ManufacturerPostIn):
    """
        Adds a new device
    """
    try:
        # checking if auth file is present
        if os.path.isfile(os.path.join(os.getcwd(), "mounts", "auth.aes")) == False:
            data = payload.dict()

            authenticator = Authentication()
            code = authenticator.authenticate_device(data)

            if code == 200:
                # creating the config file if device authenticated
                authenticator.create_config_file()

                # fetching device limitations
                code, data = authenticator.fetch_limitations(
                    {"Hardware_version": config.HARDWARE_VERSION})
                if code == 200:
                    info = {
                        "Serial_number": payload.Serial_number,
                        "Hardware_type": payload.Hardware_type,
                        "Software_version": config.SOFTWARE_VERSION,
                        "Limitations": data["Limitations"],
                        "Status": "Authenticated"
                    }
                    DeviceInfo(**info).save()
                else:
                    raise HTTPException(status_code=502)

                return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
            elif (code == 404):
                raise HTTPException(
                    status_code=404, detail="Manufacturer key not found")
            elif (code == 401):
                raise HTTPException(status_code=409, detail="Invalid Key")
        else:
            raise HTTPException(status_code=403, detail="Already configured")
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.post("/device/activation",
             status_code=200,
             response_model=util_models.DefaultResponseModel,
             responses={
                 401: responses._401(),
                 403: responses._403()
             })
async def device_activation(payload: DeviceActivationPostIn):
    """
        Authenticates the device
    """
    try:
        deviceObject = DeviceInfo.objects.first()

        if deviceObject.Access_key == None:
            # Validating the access key
            data = {
                "accessKey": payload.Access_key,
                "serialNumber": deviceObject.Serial_number,
                "deviceName": payload.Device_name,
                "location": payload.Map_address if "Map_address" in payload.dict() else None
            }
            code, data = Authentication().activate_device(data)

            # Updating the device info
            if code == 200:
                # Parsing the payload
                payload = payload.dict(skip_defaults=True)
                payload["Status"] = "Active"
                payload['GroupID'] = data.get("GroupID")
                payload["Priorities"] = data.get("Priorities")
                payload["TypeID"] = data.get("TypeID")
                payload["Warranty_validity"] = datetime.datetime.utcnow(
                ) + datetime.timedelta(days=data["Warranty_duration"])
                console_logger.debug(payload)

                device = DeviceInfo.objects().first()
                device.update(**payload)

                return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
            else:
                return JSONResponse(status_code=401, content={"detail": "Invalid Access Key"})
        else:
            return JSONResponse(status_code=403, content={"detail": "Already configured"})
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500, detail='Internal Server Error')

# remove from the swagger schema in production


@router.put("/device",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                404: responses._404(),
                403: responses._403()
            })
async def update_device(payload: DevicePutIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """Update Device"""
    if not access:
        raise HTTPException(status_code=403)
    # endpoint to update the software version and status of the device
    device = DeviceInfo.objects.first()
    if device:
        device.update(**payload.dict(exclude_none=True))
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
    else:
        raise HTTPException(status_code=404)


# to be removed from swagger docs
@router.put("/device/unprotected",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                404: responses._404()
            })
async def update_device(payload: DevicePutInUP):
    device = DeviceInfo.objects.first()
    if device:
        device.update(**payload.dict(exclude_none=True))
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
    else:
        raise HTTPException(status_code=404)

@router.get("/device",
            status_code=200,
            response_model=DeviceGetOut,
            responses={
                404: responses._404(),
                403: responses._403()
            })
async def get_device(limits: bool = False, access: bool = Depends(validation_helpers.validate_user_admin)):
    
    if not access:
        raise HTTPException(status_code=403)

    device = DeviceInfo.objects.first()
    if device:

        if not limits:
        # fetches the macid from the host server
            data = json.loads(open("./mounts/env.json", 'r').read())
            baseUrl = "http://{}:{}/api/v1/host/osvalues".format(
                data["HOST"], data["PORT"])
            console_logger.debug(baseUrl)
            res = requests.get(baseUrl)
            if res.status_code == 200:
                data = json.loads(res.text)
                return JSONResponse(content=jsonable_encoder(DeviceGetOut(Mac_id=data["Mac_id"], **device.payload()).dict()), status_code=200)
            else:
                raise HTTPException(status_code=502)
        else:
            return JSONResponse(content=jsonable_encoder(DeviceGetOut(**device.payload()).dict()), status_code=200)
    else:
        raise HTTPException(status_code=404)

# remove endpoint from swagger docs


@router.get("/device/unprotected",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                404: responses._404(),
            })
async def get_device():
    device = DeviceInfo.objects.first()
    if device:
        return JSONResponse(content=jsonable_encoder(device.payload()), status_code=200)
    else:
        raise HTTPException(status_code=404)

# remove endpoint from swagger docs


@router.get("/device/limitations",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                404: responses._404(),
            })
async def get_device():
    """
        Fetch device limitations
    """
    device = DeviceInfo.objects.first()
    if device:
        response = device.Limitations
        return JSONResponse(content=jsonable_encoder(response), status_code=200)
    else:
        raise HTTPException(status_code=404)


@router.get("/email")
async def endpoint_to_fetch_emails(access: bool = Depends(validation_helpers.validate_user_admin)):
    if not access:
        raise HTTPException(status_code=403)

    generalsettings = GeneralSettings.objects.first()

    if generalsettings is not None:
        return {"detail": {"emails": generalsettings.Email}}
    else:
        raise HTTPException(status_code=404)


@router.post("/email",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                403: responses._403(),
                409: responses._409()
            })
async def add_email(payload: AddEmailPostIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Adds a new email to the alert sending list
    """
    if not access:
        raise HTTPException(status_code=403)

    if not any(payload.emails):
        raise HTTPException(status_code=400)
    # email = payload.emails
    generalsettings = GeneralSettings.objects.first()

    # if settings are not found then create settings
    if generalsettings == None:
        GeneralSettings(Email=payload.emails, Email_status=True).save()
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)

    # if email is already present
    # if email in generalsettings.Email:
    #     raise HTTPException(status_code=409)

    # adding email to the db
    # generalsettings.update(push__Email=email)
    generalsettings.Email = payload.emails
    generalsettings.Email_status = True
    generalsettings.save()
    return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)


@router.delete("/email",
               status_code=200,
               response_model=util_models.DefaultResponseModel,
               responses={
                   401: responses._401(),
                   404: responses._404()
               })
async def remove_email(payload: DeleteEmailDeleteIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Remove email from a particular service
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    email = payload.Email
    generalsettings = GeneralSettings.objects.first()

    # if email is not in db
    if generalsettings == None:
        raise HTTPException(status_code=404)

    # If the email is not present in db
    if email not in generalsettings.Email:
        raise HTTPException(status_code=404)

    # Removing from the db
    generalsettings.update(pull__Email=email)
    return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)


@router.put("/email",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                409: responses._409(),
                404: responses._404(),
                401: responses._401()
            })
async def update_phone(payload: UpdateEmailPutIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Update a phone number
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    # Fetching settings and setting values
    generalsettings = GeneralSettings.objects.first()
    prev_email = payload.Prev_email
    new_email = payload.New_email

    # If the previous email exists in db
    if prev_email not in generalsettings.Email:
        raise HTTPException(status_code=404)

    # if the new email exists in db
    if new_email in generalsettings.Email:
        raise HTTPException(status_code=409)

    # Upadte the settings
    generalsettings.update(pull__Email=prev_email)
    generalsettings.update(push__Email=new_email)
    return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)


@router.post("/phone",
             status_code=200,
             response_model=util_models.DefaultResponseModel,
             responses={
                 401: responses._401(),
                 409: responses._409()
             })
async def add_phone(payload: AddPhonePostIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Adds a new phone to the alert sending list
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    phone = payload.Phone
    generalsettings = GeneralSettings.objects.first()

    # if settings not found create settings
    if generalsettings == None:
        GeneralSettings(Phone=[phone]).save()
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)

    # if phone already in the db
    if phone in generalsettings.Phone:
        raise HTTPException(status_code=409)

    # adding phone to the db
    generalsettings.update(push__Phone=phone)
    return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)


@router.delete("/phone",
               status_code=200,
               response_model=util_models.DefaultResponseModel,
               responses={
                   404: responses._404(),
                   401: responses._401()
               })
async def remove_phone(payload: DeletePhoneDeleteIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Remove phone from a particular service
    """

    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    phone = payload.Phone
    generalsettings = GeneralSettings.objects.first()

    if generalsettings == None:
        raise HTTPException(status_code=404)

    # If phone not in db
    if phone not in generalsettings.Phone:
        raise HTTPException(status_code=404)

    # Fetching and updating the settings
    generalsettings.update(pull__Phone=phone)

    return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)


@router.put("/phone",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                409: responses._409(),
                404: responses._404(),
                401: responses._401()
            })
async def update_phone(payload: UpdatePhonePutIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Update a phone number
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    # Fetching the settings and setting values
    generalsettings = GeneralSettings.objects.first()
    prev_phone = payload.Prev_phone
    new_phone = payload.New_phone

    # If previous phone number is not in db
    if prev_phone not in generalsettings.Phone:
        raise HTTPException(status_code=404)

    # If the new phone number is already in db
    if new_phone in generalsettings.Phone:
        raise HTTPException(status_code=409)

    # If the payload is proper update settings
    generalsettings.update(pull__Phone=prev_phone)
    generalsettings.update(push__Phone=new_phone)

    return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)

# unrequired enpoint no language func in the system
# lang to be removed from the db


@router.post("/language",
             status_code=200,
             response_model=util_models.DefaultResponseModel,
             responses={
                 401: responses._401(),
                 404: responses._404()
             })
async def set_language(language: str, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Sets the language for a particular services alerts
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    # If settings are not found
    generalsettings = GeneralSettings.objects.first()
    if generalsettings == None:
        GeneralSettings(Language=language).save()
    else:
        generalsettings.update(Language=language)
    return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)


@router.get("/alerts/contacts",
            status_code=200,
            responses={
                401: responses._401(),
                404: responses._404()
            },
            response_model=AlertContactsGetOut)
async def fetch_contacts(access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Fetch all contacts
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    generalsettings = GeneralSettings.objects.first()
    console_logger.debug(generalsettings)
    # If settings not found
    if generalsettings:
        response = AlertContactsGetOut(
            **json.loads(GeneralSettings.objects.first().to_json())).dict()
        return JSONResponse(content=response, status_code=200)
    else:
        raise HTTPException(status_code=404)


@router.put("/alert",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                401: responses._401(),
                404: responses._404()
            })
async def update_alert(payload: UpdateAlertPutIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Update false detection of the alert
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    try:
        # generating ticket number
        serial_number = DeviceInfo.objects.first().Serial_number
        ticket_number = "{}_{}".format(serial_number, payload.Ticket_number)
        alert = Alerts.objects.get(Ticket_number=ticket_number)

        # updating as false alert
        alert.update(False_detection=payload.False_detection)
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
    except DoesNotExist:
        raise HTTPException(status_code=404)
    except Exception as e:
        raise HTTPException(status_code=500)


@router.get('/search',
            status_code=200,
            responses={
                404: responses._404(),
                401: responses._401()
            })
async def search_alerts(search: str,
                        page_no: Optional[int] = 1,
                        page_len: Optional[int] = 10,
                        access: bool = Depends(validation_helpers.validate_user)):
    """
    Search For Alerts
    """
    if not access:
        raise HTTPException(status_code=403)
    try:
        if any(Alerts.objects()):
            count = 0
            offset = (page_no - 1) * page_len
            # alerts = Alerts.objects.filter(Alert__icontains=alert_name).skip(offset).limit(page_len)
            alerts = Alerts.objects.search_text(
                search).skip(offset).limit(page_len)
            count = len(Alerts.objects.search_text(search).skip(offset))
            data = list()
            for alert in alerts:
                data.append(AlertsOut(**alert.payload()))

            response = AlertsGetOut(
                alerts=data,
                total_data=count,
                per_page=page_len
            ).dict()

            return JSONResponse(content=jsonable_encoder(response), status_code=200)
        return JSONResponse(content={"detail": "alert not found"}, status_code=404)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


async def delete_alert_image(alert):
    if not alert.Alert == "camera - inactive":
        image_list = alert.payload(local=True).get("Image_path")
        for image in image_list:
            if os.path.exists(image):
                # console_logger.debug("image Exists")
                os.remove(image)
    return 1


@router.delete('/alert',
               status_code=200,
               responses={
                   404: responses._404(),
                   401: responses._401()
               })
async def delete_alerts(
    text: Optional[str] = None,
    service_id: Optional[str] = None,
    camera_id: Optional[str] = None,
    start_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
    end_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(microsecond=0),
    ticket_numbers: List[str] = Query(None),
    access: bool = Depends(validation_helpers.validate_user)
    ):
    """
        Delete alerts
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    try:
        query = {}

        if service_id:
            query["Service_id"] = service_id
        if camera_id:
            query["Camera_id"] = camera_id
        if start_timestamp:
            query["Timestamp__gte"] = start_timestamp
        if end_timestamp:
            query["Timestamp__lte"] = end_timestamp
        if text:
            query = {"Alert__icontains": text}
        
        # generating ticket number
        serial_number = DeviceInfo.objects.first().Serial_number
        
        if isinstance(ticket_numbers, list) and len(ticket_numbers) != 0:
            for number in ticket_numbers:
                number = "{}_{}".format(serial_number, str(number))
                alert = Alerts.objects.get(Ticket_number=number)
                await delete_alert_image(alert)
                alert.delete()
        else:
            alert_objects = Alerts.objects(**query)
            for alert_object in alert_objects:
                await delete_alert_image(alert_object)
                alert_object.delete()

        
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
    except DoesNotExist:
        raise HTTPException(status_code=404)
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500)


@router.get("/manufacture",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                200: responses._200(),
                404: responses._404()
            })
async def manufacture_status():
    """
        Manufacturer config status
    """
    # Checks if auth.aes is present or not
    if os.path.isfile("./mounts/auth.aes"):
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
    else:
        raise HTTPException(status_code=404)


@router.get("/device/activation",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                200: responses._200(),
                404: responses._404()
            })
async def activation_status():
    """
        Activation Status
    """
    device = DeviceInfo.objects.first()
    if device != None:
        # Checks if the access key is present or not
        if device.Access_key != None:
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
        else:
            raise HTTPException(status_code=404)
    else:
        raise HTTPException(status_code=404)


@router.get("/device/status",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                404: responses._404(),
                403: responses._403()
            })
async def device_status():
    """
        Device Status
    """
    device = DeviceInfo.objects.first()
    if device != None:
        Status = device.Status
        if Status == "Active":
            # Checks the device status
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Successfull").dict(), status_code=200)
        else:
            raise HTTPException(status_code=403, detail=Status)
    else:
        raise HTTPException(status_code=404)


@router.post("/server",
             status_code=200,
             response_model=util_models.DefaultResponseModel,
             responses={
                 401: responses._401(),
                 502: responses._502()
             })
async def add_server(payload: ServerPostIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Add a new server
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    # If ownership is diycam
    if payload.Ownership == "Diycam":

        # Fetching server details from diycam cloud
        server = Server.objects.get(Server_role="Authentication")
        hostname = server.Url if (
            server.Url) else "http://{}:{}".format(server.Ip, server.Port)
        url = hostname + "/fetch/server"
        data = {
            "Server_role": payload.Server_role
        }
        res = requests.post(
            url,
            data=json.dumps(data)
        )
        console_logger.debug(res.status_code)

        # Storing server credentials
        if res.status_code == 200:
            data = json.loads(res.text)
            data["Server_role"] = payload.Server_role
            data["Ownership"] = payload.Ownership

            if Server.objects(Server_role__contains=payload.Server_role):
                # if already present update
                server = Server.objects.get(Server_role=payload.Server_role)
                server.update(**data)
            else:
                # add server
                Server(**data).save()
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
        else:
            raise HTTPException(status_code=502)
    else:
        # create or update the server
        try:
            server = Server.objects.get(Server_role=payload.Server_role)
            server.update(**payload.dict(exclude_none=True))
        except DoesNotExist:
            if payload.Url:
                Server(Url=payload.Url, Server_role=payload.Server_role).save()
            else:
                Server(**payload.dict(skip_defaults=True)).save()
        except Exception as e:
            console_logger.debug(e)
            raise HTTPException(status_code=500)
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)


@router.get("/server",
            status_code=200,
            response_model=ServerGetOut,
            responses={
                401: responses._401(),
                404: responses._404()
            })
async def get_server(access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Fetch all servers
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    servers = Server.objects.all().exclude("id")
    data = {
        "Servers": json.loads(servers.to_json())
    }
    response = ServerGetOut(**data).dict()
    return JSONResponse(content=response, status_code=200)


# remove endpoint from swagger docs
@router.get("/server/unprotected",
            status_code=200,
            response_model=ServerGetOut,
            responses={
                404: responses._404()
            })
async def get_server(Server_role: Optional[str] = None):
    try:
        args = {}
        if Server_role is not None:
            args["Server_role"] = Server_role
        servers = Server.objects(**args).exclude("id")
        data = {
            "Servers": json.loads(servers.to_json())
        }
        response = ServerGetOut(**data).dict()
        return JSONResponse(content=response, status_code=200)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.delete("/server",
               status_code=200,
               response_model=util_models.DefaultResponseModel,
               responses={
                   404: responses._404(),
                   401: responses._401()
               })
async def remove_server(server_role: str, access: bool = Depends(validation_helpers.validate_user_admin)):
    """Unable Doublecheck or Ticketing"""

    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    try:
        server = Server.objects.get(Server_role=server_role)
        server.delete()
        return JSONResponse(status_code=200, content=util_models.DefaultResponseModel(detail="Success").dict())
    except DoesNotExist:
        raise HTTPException(status_code=404)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/resetemail",
             status_code=200,
             response_model=util_models.AsyncTask,
             responses={
                 404: responses._404()
             })
async def send_email(payload: SendMailPostIn):
    """
        Sends an email
    """
    try:
        mail = Mail()
        task = await mail.send_reset_password_email(payload)
        if task != 'Failed':
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Successfull").dict(), status_code=200)
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Failed").dict(), status_code=502)
    except Exception as e:
        # if smtp settings are not present then send mail through diycam server
        console_logger.debug(e)
        if any(DeviceInfo.objects()):
            accesskey = DeviceInfo.objects.first().Access_key
        # server = Server.objects.get(Server_role = "Authentication")
        # url = '{}/{}'.format(server.Url, "sendresetmail")  if(server.Url) else "http://{}:{}/api/v1/users/password/forgot/device".format(server.Ip, server.Port)
        console_logger.debug(payload.dict())
        data = {
            "accessKey": accesskey,
            "username": payload.dict().get("Username"),
            "destination": payload.dict().get("Email"),
            "otp": payload.dict().get("OTP"),
            "interval": payload.dict().get("OTP_interval")
        }
        headers = {
            'Content-Type': 'application/json'
        }
        r = requests.post(
            config.RESET_MAIL_URL,
            headers=headers,
            data=json.dumps(data)
        )
        status_code = json.loads(r.content).get("detail").get(
            "ResponseMetadata").get("HTTPStatusCode")
        console_logger.debug(status_code)
        if status_code == 200:
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Successfull").dict(), status_code=200)
        else:
            raise HTTPException(status_code=502)


@router.post("/sendverificationmail",
             status_code=200,
             response_model=util_models.DefaultResponseModel)
async def send_verification_mail(payload: SendMailPostIn):
    """
        Send verification email
    """
    try:
        # server = Server.objects.get(Server_role = "Authentication")
        # url = '{}/{}'.format(server.Url, "sendverifymail")  if(server.Url) else "http://{}:{}/sendverifymail".format(server.Ip, server.Port)
        url = config.VERIFY_USER_URL
        accesskey = DeviceInfo.objects.first().Access_key
        data = {
            "accessKey": accesskey,
            "username": payload.dict().get("Username"),
            "destination": payload.dict().get("Email"),
            "otp": payload.dict().get("OTP"),
            "interval": payload.dict().get("OTP_interval")
        }
        console_logger.debug(data)
        r = requests.post(
            url,
            data=json.dumps(data)
        )
        console_logger.debug(r.content)
        if r.status_code == 200:
            status_code = json.loads(r.content).get("detail").get(
                "ResponseMetadata").get("HTTPStatusCode")
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Successfull").dict(), status_code=200)
        else:
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Failed").dict(), status_code=502)

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=502)


@router.post("/cloudstorage",
             status_code=200,
             response_model=util_models.DefaultResponseModel,
             responses={
                 401: responses._401()
             })
async def add_cloud_config(payload: CloudSettingsPostIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Cloud Storage
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    # Checking if the settings exist or not
    cloudsettings = CloudSettings.objects.first()

    if not cloudsettings:
        payload = payload.dict(skip_defaults=True, exclude_none=True)
        settings = CloudSettings(**payload)
        settings.save()
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successfull").dict(), status_code=200)
    else:
        raise HTTPException(status_code=409)


@router.get("/cloudstorage",
            status_code=200,
            response_model=CloudSettingsGetOut,
            responses={
                404: responses._404(),
                401: responses._401()
            })
async def get_cloud_settings(access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Fetch cloud settings
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    # Checking if cloud settings exist
    settings = CloudSettings.objects.first()
    if settings == None:
        raise HTTPException(status_code=404, detail="Settings not found")

    # Returning the response
    response = CloudSettingsGetOut(**settings.payload()).dict()
    return JSONResponse(content=response, status_code=200)


@router.put("/cloudstorage",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                401: responses._401(),
                404: responses._404()
            })
async def update_cloud_settings(payload: CloudSettingsUpdateIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Update cloud settings
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    # Checking if settings exist
    settings = CloudSettings.objects.first()
    if settings == None:
        raise HTTPException(status_code=404)

    # Updating settings
    settings.update(**payload.dict())
    return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)


@router.post("/smtp",
             status_code=200,
             response_model=util_models.DefaultResponseModel,
             responses={
                 403: responses._403(),
                 401: responses._401()
             })
async def smtp_settings(payload: SmtpSettingsPostIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Smtp Settings
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    console_logger.debug(SmtpSettings.objects.first())
    if SmtpSettings.objects.first() is not None:
        raise HTTPException(status_code=409)

    mail = Mail(payload)
    # sendind test email
    if await mail.send_test_email() == "Success":
        payload = payload.dict(exclude_none=True, exclude_defaults=True)
        payload["Smtp_password"] = cryptocode.encrypt(
            payload["Smtp_password"], os.environ.get("SECRET_KEY_ENCRYPT"))
        smtp_settings = SmtpSettings(**payload)
        smtp_settings.save()

        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successfull").dict(), status_code=200)
    else:
        console_logger.debug("Failed to Send")
        raise HTTPException(status_code=400, detail="Invalid Smtp Settings")


@router.get("/smtp",
            status_code=200,
            response_model=SmtpSettingsGetOut,
            responses={
                404: responses._404(),
                401: responses._401()
            })
async def fetch_smtp_settings(access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Fetch smtp settings
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    smtp_settings = SmtpSettings.objects.first()

    if smtp_settings == None:
        raise HTTPException(status_code=404)
    else:
        response = json.loads(smtp_settings.to_json())
        response = SmtpSettingsGetOut(**response).dict()
        return JSONResponse(content=response, status_code=200)


# remove from swagger docs
@router.get("/smtp/unprotected",
            status_code=200,
            response_model=SmtpSettingsGetOut,
            responses={
                404: responses._404(),
                401: responses._401()
            })
async def fetch_smtp_settings():
    """
        Fetch smtp settings
    """
    smtp_settings = SmtpSettings.objects.first()

    if not smtp_settings:
        raise HTTPException(status_code=404)
    else:
        response = json.loads(smtp_settings.to_json())
        response["Smtp_password"] = cryptocode.decrypt(
            response["Smtp_password"], os.environ.get("SECRET_KEY_ENCRYPT"))
        response = SmtpSettingsGetOut(**response).dict()
        return JSONResponse(content=response, status_code=200)


@router.put("/smtp",
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                404: responses._404(),
                401: responses._401()
            })
async def update_smtp_settings(payload: SmtpSettingsUpdateIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    """
        Update SMTP Settings
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    mail = Mail(payload)

    # if test email is success ful
    if await mail.send_test_email() == "Success":
        try:
            smtp_settings = SmtpSettings.objects.first()

            # encrypt smtp password
            if payload.Smtp_password:
                payload.Smtp_password = cryptocode.encrypt(
                    payload.Smtp_password, os.environ.get("SECRET_KEY_ENCRYPT"))

            payload = payload.dict(exclude_none=True)
            smtp_settings.update(**payload)
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
        except DoesNotExist:
            raise HTTPException(status_code=404)
        except Exception as e:
            console_logger.debug(e)
            raise HTTPException(status_code=500)
    else:
        raise HTTPException(status_code=400, detail="Invalid Smtp Settings")


@router.delete("/smtp",
               status_code=200,
               response_model=util_models.DefaultResponseModel,
               responses={
                   404: responses._404(),
                   401: responses._401(),
               })
async def remove_smtp_settings(access=Depends(validation_helpers.validate_user_admin)):
    """Delete Smtp Settings"""
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    try:
        settings = SmtpSettings.objects.first()
        if settings:
            settings.delete()
            generalsettings = GeneralSettings.objects.first()
            # if any(generalsettings.Email):
            if generalsettings and generalsettings.Email_status:
                generalsettings.Email_status = False
                generalsettings.save()
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
        else:
            raise HTTPException(status_code=404)
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.get("/task",
            status_code=200,
            response_model=TaskGetOut,
            responses={
                404: responses._404(),
            })
async def fetch_task(task_name: str):
    """Fetch task status"""
    try:
        task = Taskmeta.objects.get(Task_name=task_name)
        return JSONResponse(content=TaskGetOut(Status=task.Status).dict(), status_code=200)
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.post("/emailtemplate",
             status_code=200,
             response_model=util_models.DefaultResponseModel,
             responses={
                 401: responses._401()
             })
async def upload_email_template(filetype: str, access: bool = Depends(validation_helpers.validate_user_admin), template: UploadFile = File(...)):
    """Upload Email file template"""
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    console_logger.debug(template.filename)
    # validating file type
    if not template.filename.endswith(".html"):
        raise HTTPException(status_code=422, detail="Invalid File Format")

    console_logger.debug(filetype)
    tempalte_types = {
        "Reset User": "reset_password.html",
        "Test Email": "test_email.html",
        "Alert": "alert.html"
    }

    # copying file to target location
    file_location = os.path.join(
        os.getcwd(), config.TEMPLATE_PATH, tempalte_types[filetype])
    console_logger.debug(file_location)

    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(template.file, file_object)
    return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)


@router.post('/alertsettings',
             status_code=200,
             response_model=util_models.DefaultResponseModel,
             responses={
                 401: responses._401(),
             })
async def alert_settings(payload: AlertSettingsPostIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    try:
        # for each settings create or update the settings
        payload = payload.dict(exclude_none=True)
        console_logger.debug(payload)
        for setting in payload["Settings"]:
            console_logger.debug(setting["Service_id"])
            if AlertSettings.objects(Service_id__contains=setting["Service_id"]):
                try:
                    alert_setting = AlertSettings.objects.get(
                        Service_id=setting["Service_id"])
                    alert_setting.update(**setting)
                except DoesNotExist:
                    pass
            else:
                settings = AlertSettings(**setting)
                settings.save()
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successfull").dict(), status_code=200)
    except NotUniqueError:
        raise HTTPException(status_code=400)
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


# not required update is handled in the post method
@router.put('/alertsettings',
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                401: responses._401(),
                404: responses._404()
            })
async def update_settings(payload: AlertSettingsPutIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    try:
        settings = AlertSettings.objects.get(Service_id=payload.Service_id)
        settings.update(**payload.dict())
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successfull").dict(), status_code=200)
    except DoesNotExist:
        raise HTTPException(status_code=404)
    except OperationError:
        raise HTTPException(status_code=422)
    except Exception as e:
        raise HTTPException(status_code=500)


@router.get('/alertsettings',
            status_code=200,
            response_model=AlertSettingGetOutAll,
            responses={
                401: responses._401(),
                404: responses._404()
            })
async def fetch_settings(access: bool = Depends(validation_helpers.validate_user_admin)):
    """Fetch a particular alert's settings"""
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    try:
        # settings = AlertSettings.objects.get(Service_id=Service_id)
        # response = AlertSettingGetOut(**json.loads(settings.to_json())).dict()
        data = []
        for setting in AlertSettings.objects():
            set_dict = {
                "Service_id": setting.Service_id,
                "Alert_priority": setting.Alert_priority,
                "Alert_action": setting.Alert_action
            }
            data.append(set_dict)
        return JSONResponse(content=data, status_code=200)
    except DoesNotExist:
        raise HTTPException(status_code=404)
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail='Internal Server Error')


@router.delete("/alertsettings",
               status_code=200,
               response_model=util_models.DefaultResponseModel,
               responses={
                   401: responses._401(),
                   404: responses._404()
               })
async def remove_settings(Service_id: str, access: bool = Depends(validation_helpers.validate_user_admin)):
    """Remove a particular alerts settings"""
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    try:
        settings = AlertSettings.objects.get(Service_id=Service_id)
        settings.delete()
        return JSONResponse(status_code=200, content=util_models.DefaultResponseModel(detail="Success").dict())
    except DoesNotExist:
        raise HTTPException(status_code=404)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/staticstorage",
             status_code=200,
             response_model=util_models.DefaultResponseModel,
             responses={
                 404: responses._404(),
                 401: responses._401()
             })
async def staticstorage(payload: StaticStoragePostIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    try:
        settings = GeneralSettings.objects.first()
        if settings:
            settings.update(Static_server_size=payload.Size)
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Succesful").dict(), status_code=200)
        else:
            GeneralSettings(Static_server_size=payload.Size).save()
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Succesful").dict(), status_code=200)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/staticstorage/unprotected",
             status_code=200,
             response_model=util_models.DefaultResponseModel,
             responses={
                 404: responses._404(),
                 401: responses._401()
             })
async def staticstorage_unprotected(payload: StaticStoragePostIn):
    try:
        settings = GeneralSettings.objects.first()
        if settings:
            settings.update(Static_server_size=payload.Size)
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Succesful").dict(), status_code=200)
        else:
            GeneralSettings(Static_server_size=payload.Size).save()
            return JSONResponse(content=util_models.DefaultResponseModel(detail="Succesful").dict(), status_code=200)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPExceptiown(status_code=500)


@router.post("/factoryreset",
             status_code=200,
             response_model=util_models.DefaultResponseModel,
             responses={
                 401: responses._401()
             })
async def factoryreset(hardreset: Optional[bool] = False):
    """Factory Reset Device"""
    # remove all alert settings
    try:
        AlertSettings.drop_collection()
    except OperationError:
        pass

    # remove all alerts
    try:
        Alerts.drop_collection()
    except OperationError:
        pass

    try:
        static_file_path = os.path.join(
            os.getcwd(), config.STATICFILE_DIR, config.FIFO_DIR)
        console_logger.debug(static_file_path)
        shutil.rmtree(static_file_path)
        os.mkdir(static_file_path)
    except Exception as e:
        console_logger.debug(e)

    # remove smtp settings
    try:
        SmtpSettings.drop_collection()
    except OperationError:
        pass

    # reset cloud storage settings
    try:
        settings = CloudSettings.objects.first()
        settings.update(
            Cloudtype='Default',
            Aws_params=None,
            Azure_params=None,
            FTP_params=None
        )
    except Exception as e:
        pass

    # reset general settings to default
    try:
        settings = GeneralSettings.objects.first()
        settings.update(
            Email=[],
            Phone=[],
            Language="English",
            Static_server_size=config.STATIC_SERVER_SIZE
        )
    except DoesNotExist:
        pass

    # drop taskmeta
    try:
        Taskmeta.drop_collection()
    except OperationError:
        pass

    if hardreset:
        device = DeviceInfo.objects.first()
        device.update(
            Device_name=None,
            Access_key=None,
            Map_address=[],
            Branch_code=None,
            Installation_address=None
        )
    else:
        pass

    return JSONResponse(status_code=200, content=util_models.DefaultResponseModel(detail="Success").dict())


@router.get("/health")
async def health():
    return JSONResponse(content=util_models.DefaultResponseModel(detail="Success").dict(), status_code=200)


@router.get('/consent',
            status_code=200,
            response_model=util_models.DefaultResponseModel,
            responses={
                401: responses._401(),
            })
async def datacollect_consent(access: bool = Depends(validation_helpers.validate_user_admin)):
    """Data Collection Consent"""

    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    device = DeviceInfo.objects.first()
    if device is None:
        raise HTTPException(status_code=404)

    try:
        device.update(Consent=not device.Consent)
        return JSONResponse(content=util_models.DefaultResponseModel(detail='Success').dict(), status_code=200)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post('/cameraalert')
async def camera_alert(alert_data: CameraAlertPostIn):
    """High Priority Camera Alert"""
    try:
        deviceInfo = DeviceInfo.objects.first()
        contacts_list = GeneralSettings.objects.first().Email
        if any(contacts_list):
            console_logger.debug(contacts_list)
            headers = {
                "content-type": "application/json"
            }
            data = {
                "device_name": deviceInfo.Device_name,
                "accessKey": deviceInfo.Access_key,
                "camera_name": alert_data.CameraName,
                "destination": contacts_list
            }
            response = requests.request(
                "POST", headers=headers, url=config.CAMERA_INACTIVE_ALERT_EMAIL, data=json.dumps(data))
            console_logger.debug(data)
            console_logger.debug(json.loads(response.content))
            status_code = json.loads(response.content).get(
                "detail").get("ResponseMetadata").get("HTTPStatusCode")
            console_logger.debug(status_code)
        return JSONResponse(content={"detail": "success"}, status_code=200)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.get('/testalertfilter')
async def test_alert(start_date: str, end_date: str):
    try:
        start_date = datetime.datetime.strptime(start_date, "%Y-%m-%d %H:%M")
        end_date = datetime.datetime.strptime(end_date, "%Y-%m-%d %H:%M")
        console_logger.debug(start_date)
        data = Alerts.objects(Timestamp__gte=start_date,
                              Timestamp__lte=end_date)
        console_logger.debug(data)
        return data.payload()
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post('/report')
async def log_report_in_db(request: CameraReportPostIn):
    try:
        payload = request.dict()
        console_logger.debug(payload)
        metadata = payload.pop("Data")

        res = requests.get(config.GET_CAMERA_URL.format(request.Camera_id))
        if res.status_code == 200:
            data = json.loads(res.text)
            payload["Camera_name"] = data["Camera_name"]
            payload["Location"] = data["Location"]
        else:
            raise HTTPException(status_code=500)

        report_profile = Reports(**payload)
        report_profile.Report_number = await report_profile.get_report_number('report')
        report_profile.Report_data = metadata
        report_profile.Timestamp = datetime.datetime.utcnow()

        report_profile.save()
        return JSONResponse(content=util_models.DefaultResponseModel(detail="Successfull").dict(), status_code=200)
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500)


@router.get('/report',
            status_code=200,
            responses={
                404: responses._404(),
                401: responses._401()
            })
async def get_alerts(
    all: Optional[str] = None,
    page_no: Optional[int] = 1,
    page_len: Optional[int] = 10,
    service_id: Optional[str] = None,
    camera_id: Optional[str] = None,
    start_timestamp: Optional[datetime.datetime] = None,
    end_timestamp: Optional[datetime.datetime] = None,
    access: bool = Depends(validation_helpers.validate_user)
):
    """
        Fetch reports
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    # try:
    reports = None
    # generating query
    query = {}
    if service_id:
        query["Service_id"] = service_id
    if camera_id:
        query["Camera_id"] = camera_id
    if start_timestamp:
        query["Timestamp__gte"] = start_timestamp
    if end_timestamp:
        query["Timestamp__lte"] = end_timestamp

    offset = (page_no - 1) * page_len
    console_logger.debug(offset)

    if all == "all":
        end_timestamp = datetime.datetime.utcnow()
        start_timestamp = end_timestamp - datetime.timedelta(days=30)
        query["Timestamp__gte"] = start_timestamp
        query["Timestamp__lte"] = end_timestamp
        reports = Reports.objects(**query)
    else:
        console_logger.debug(query)
        reports = Reports.objects(**query).skip(offset).limit(page_len)

    count = Reports.objects(**query).count()

    data = list()

    for report in reports:
        # data.append(CameraReport(**report.payload()))
        data.append(report.payload())

    # rendering response
    # console_logger.debug(data)
    # response = CameraReportGetOut(
    #     reports = data,
    #     total_data = count,
    #     per_page = page_len
    # ).dict()
    response = {
        "reports": data,
        "total_data": count,
        "per_page": page_len
    }

    # return JSONResponse(content=jsonable_encoder(response), status_code=200)
    return JSONResponse(content=jsonable_encoder(response), status_code=200)
    # except Exception as e:
    #     console_logger.debug(e)
    #     raise HTTPException(status_code=500)


@router.get('/report/download',
            status_code=200,
            responses={
                404: responses._404(),
                401: responses._401()
            })
async def get_alerts_excel(
    # all: Optional[str] = None,
    service_id: Optional[str] = None,
    camera_id: Optional[str] = None,
    start_timestamp: Optional[datetime.datetime] = None,
    end_timestamp: Optional[datetime.datetime] = None,
    access: bool = Depends(validation_helpers.validate_user)
):
    """
        Fetch reports
    """
    # Validate admin user
    if not access:
        raise HTTPException(status_code=403)

    try:
        tasklist = list()
        name = "download_report_" + \
            datetime.datetime.strftime(
                datetime.datetime.utcnow(), "%Y/%M/%D_%H:%M:%S")
        reports = None
        # generating query
        query = {}
        end_date = datetime.datetime.utcnow()
        start_date = end_date - datetime.timedelta(days=30)
        query["Timestamp__gte"] = start_date
        query["Timestamp__lte"] = end_date
        if service_id:
            query["Service_id"] = service_id
        if camera_id:
            query["Camera_id"] = camera_id
        if start_timestamp:
            query["Timestamp__gte"] = start_timestamp
        if end_timestamp:
            query["Timestamp__lte"] = end_timestamp

        reports = Reports.objects(**query)

        # file_url = generate_excelsheet_report(reports)
        if any(reports):
            task = asyncio.create_task(asyncio.to_thread(
                generate_excelsheet_report, reports), name=name)
            # task.add_done_callback(log_task)
            task.add_done_callback(send_socket_event)
            tasklist.append(name)
            # if file_url:
            #     return JSONResponse(content={"Url": file_url}, status_code=200)
            return JSONResponse(content={"Url": name}, status_code=200)
        else:
            return JSONResponse(content={"msg": "no_data_found"}, status_code=404)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/telegram",
             status_code=200,
             responses={
                 400: responses._400(),
                 401: responses._401()
             })
async def telegram_post_in(indata: TelegramDataPostIn, access: bool = Depends(validation_helpers.validate_user)):
    # try:
    console_logger.debug(indata)
    if indata.token == "" or indata.channel == "":
        raise HTTPException(status_code=400)
    if not any(TelegramDetails.objects()):
        telegram_object = TelegramDetails(
            ChannelLink=indata.channel,
            ServiceStatus=indata.state)
        telegram_object.secure_token(indata.token)
        message = None
    else:
        telegram_object = TelegramDetails.objects.first()
        if indata.state == False:
            telegram_object.update(ServiceStatus=indata.state)
        else:
            telegram_object.ServiceStatus = True
        if indata.token != None:
            telegram_object.secure_token(indata.token)
        telegram_object.ChannelLink = indata.channel if indata.channel != None else telegram_object.ChannelLink
        message = "Telegram service for RDX updated successfully"

    if indata.channel != None:
        chat_id_profile = indata.channel.rsplit('/', 1)[-1]
        chat_id = "{}{}".format("@", chat_id_profile)

        telegramHandler.start(indata.token, chat_id)
    
    iscredcorrect = telegramHandler.credetialsCheck(message)
    console_logger.debug(iscredcorrect)
    if iscredcorrect == False:
        raise HTTPException(status_code=400)
    telegram_object.save()
    return "Success"
    # except Exception as e:
    #     console_logger.debug(e)
    #     exc_type, exc_obj, exc_tb = sys.exc_info()
    #     fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    #     console_logger.debug("Error on line {}".format(
    #         sys.exc_info()[-1].tb_lineno))
    #     return JSONResponse({"details": str(e)}, status_code=400)


@router.get("/telegram",
            # response_model=TelegramDataGetOut,
            status_code=200,
            responses={
                400: responses._400(),
                401: responses._401()
            })
async def telegram_get_out(access: bool = Depends(validation_helpers.validate_user)):
    data = {}
    if any(TelegramDetails.objects()):
        data = TelegramDetails.objects.first().payload()
    return {"detail": data}


@router.delete("/telegram",
               status_code=200,
               responses={
                   400: responses._400(),
                   401: responses._401()
               })
async def delete_telegram(token: str = Depends(validation_helpers.auth_user_telegram)):

    console_logger.debug(token)
    device_profile = DeviceInfo.objects.only("Device_name")[0]
    console_logger.debug(device_profile.Device_name)
    telegramHandler.sendMsgBeforeDelete(token, device_profile.Device_name)

    if any(TelegramDetails.objects()):
        TelegramDetails.objects.first().delete()

    return "Success"

# access: bool = Depends(validation_helpers.validate_user)
# def validate_user(token: str = Depends(HTTPBase(scheme='Bearer'))):
#     user = auth.authenticate_user(token)
#     allowed_roles = ["Admin", "Superadmin", "Manufacturer", "Operator"]
#     if user["role"] in allowed_roles:
#         return True
#     return False


@router.get("/synctrigger")
async def endpoint_for_syncing_cloud():
    console_logger.debug("cloud sync triggered")
    await other_operation()
    # name = "sync_to_cloud" + datetime.datetime.strftime(datetime.datetime.utcnow(), "%Y/%M/%D_%H:%M:%S")
    # task = asyncio.create_task(asyncio.to_thread(other_operation), name=name)
    # task.add_done_callback(log_task)
    return True


@router.post("/authentication", tags=["Initial Flow"])
async def endpoint_to_authenticate_access_key(payload: AuthenticateAccessKey):
    authenticator = Authentication()
    statusCode, response = authenticator.verifyDeviceActivation(
        payload.access_key)
    console_logger.debug(statusCode)
    console_logger.debug(response)
    if statusCode == 200:
        if "issue" in response["detail"].keys():
            if len(response["detail"]["userType"]) == 1 and "user" in response["detail"]["userType"]:
                raise HTTPException(
                    status_code=400, detail=response["detail"]["issue"])
            elif len(response["detail"]["userType"]) and "manufacturer" not in response["detail"]["userType"]:
                raise HTTPException(
                    status_code=400, detail=response["detail"]["issue"])
            else:
                raise HTTPException(
                    status_code=404, detail=response["detail"]["issue"])

        if "manufacturer" in response["detail"]["userType"]:
            status = authenticator.fetchUserInfo("Manufacturer")
            responseDict = copy.deepcopy(response["detail"])
            if status == 200:
                responseDict.update(
                    {"mfgPresent": True, "userType": copy.deepcopy(response["detail"]["userType"])})
                return {"detail": responseDict}
            else:
                responseDict.update({"mfgPresent": False, "userType": copy.deepcopy(
                    response["detail"]["userType"])})
                return {"detail": responseDict}

        elif len(response["detail"]["userType"]) == 1 and "user" in response["detail"]["userType"]:
            status = authenticator.fetchUserInfo("Manufacturer")
            responseDict = copy.deepcopy(response["detail"])
            if status == 200:
                responseDict.update(
                    {"mfgPresent": True, "userType": copy.deepcopy(response["detail"]["userType"])})
                return {"detail": responseDict}
            else:
                responseDict.update({"mfgPresent": False, "userType": copy.deepcopy(
                    response["detail"]["userType"])})
                return {"detail": responseDict}

        elif len(response["detail"]["userType"]) and "manufacturer" not in response["detail"]["userType"]:
            status = authenticator.fetchUserInfo("Manufacturer")
            responseDict = copy.deepcopy(response["detail"])
            if status == 200:
                responseDict.update(
                    {"mfgPresent": True, "userType": copy.deepcopy(response["detail"]["userType"])})
                return {"detail": responseDict}
            else:
                responseDict.update({"mfgPresent": False, "userType": copy.deepcopy(
                    response["detail"]["userType"])})
                return {"detail": responseDict}

    else:
        console_logger.debug(response)
        raise HTTPException(status_code=statusCode, detail=response["detail"])


@router.post("/device_activation", tags=["Initial Flow"])
async def endpoint_to_device_activation(payload: ActivateDevice, accessKey: str = Header(...)):

    configFilePath = os.path.join(os.getcwd(), "mounts", "auth.aes")
    configJsonPath = os.path.join(os.getcwd(), "mounts", "auth.json")

    if not os.path.isfile(configFilePath):
        authenticator = Authentication()
        statusCode, response = authenticator.activateDevice(
            accessKey, payload.serial_number, payload.password
        )

        if statusCode == 200:
            authenticator.createConfigFile(
                accessKey, configFilePath, configJsonPath)
            code, data = authenticator.fetchLimitations(
                accessKey=accessKey, hardwareVersion=config.HARDWARE_TYPE
            )

            if code == 200:
                info = {
                    "Serial_number": payload.serial_number,
                    "Hardware_type": "standAlone",
                    "Software_version": config.SOFTWARE_VERSION,
                    "Limitations": {
                        "Camera": data["detail"]["allowedCameras"],
                        "Deepstream": data["detail"]["allowedModels"],
                        "Usecase": data["detail"]["allowedUseCases"]
                    },
                    "Status": "Active"
                }
                DeviceInfo(**info).save()

                code, data = authenticator.createManufacturer(
                    accessKey=accessKey, password=payload.password)

            else:
                raise HTTPException(
                    status_code=code, detail=response["detail"])
        else:
            raise HTTPException(status_code=statusCode,
                                detail=response["detail"])
    else:
        return {"detail": "success"}


# @router.get("/superadmin")
# async def endpoint_to_fetch

@router.post("/register_device", tags=["Initial Flow"])
async def endpoint_to_register_device(payload: RegisterDevice):
    try:
        deviceObject = DeviceInfo.objects.first()

        if not deviceObject:
            configFilePath = os.path.join(os.getcwd(), "mounts", "auth.aes")
            configJsonPath = os.path.join(os.getcwd(), "mounts", "auth.json")

            if not os.path.isfile(configFilePath):
                console_logger.debug("inside")
                authenticator = Authentication()
                statusCode, _ = authenticator.activateDevice(
                    payload.accessKey, payload.serialNumber, payload.password
                )

                console_logger.debug(statusCode)

                if statusCode == 200:
                    authenticator.createConfigFile(
                        payload.accessKey, configFilePath, configJsonPath)
                    code, data = authenticator.fetchLimitations(
                        accessKey=payload.accessKey, hardwareVersion=config.HARDWARE_TYPE
                    )

                    if code == 200:
                        info = {
                            "Serial_number": payload.serialNumber,
                            "Hardware_type": "standAlone",
                            "Software_version": config.SOFTWARE_VERSION,
                            "Limitations": {
                                "Camera": data["detail"]["allowedCameras"],
                                "Deepstream": data["detail"]["allowedModels"],
                                "Usecase": data["detail"]["allowedUseCases"]
                            },
                            "Status": "Active"
                        }
                        deviceObject = DeviceInfo(**info)
                        deviceObject.save()
                        
                        code, data = authenticator.assignDevice(
                            payload.accessKey, deviceObject.Serial_number, payload.deviceName)

                        if code == 200:
                            deviceObject.Access_key = payload.accessKey
                            deviceObject.Device_name = payload.deviceName
                            deviceObject.Status = "Active"
                            deviceObject.GroupID = data.get("GroupID")
                            deviceObject.Priorities = data.get("Priorities")
                            deviceObject.TypeID = data.get("TypeID")
                            deviceObject.Warranty_validity = datetime.datetime.utcnow(
                            ) + datetime.timedelta(days=data["Warranty_duration"])
                            deviceObject.save()

                            userRegisterCode, userRegisterData = authenticator.createUser(
                                **{
                                    "FullName": payload.fullName,
                                    "Username": payload.username,
                                    "Password": payload.password,
                                    "Email": payload.emailId,
                                    "Phone": payload.phone,
                                    "Status": True
                                }
                            )
                            # Create mfg 
                            status = authenticator.fetchUserInfo("Manufacturer")
                            console_logger.debug(f'Manufacturer: {str(status)}')
                            if status != 200:
                                status_code, mfg_access_key = authenticator.fetch_manufacturer_detail(payload.accessKey)
                                console_logger.debug(f'status_code: {str(status_code)}, mfg_access_key: {str(mfg_access_key)}')
                                if status_code == 200:
                                    code, data = authenticator.createManufacturer(accessKey=mfg_access_key['detail']['access_key'], password=mfg_access_key['detail']['access_key'])
                                    console_logger.debug(f'code: {str(code)}, data: {str(data)}')
                                else:
                                    console_logger.debug(f'code: {str(code)}, data: {str(data)}')
                                    raise HTTPException(status_code=status_code, detail=mfg_access_key["detail"]) 

                            if userRegisterCode == 200:
                                authenticator.fetch_service_metadata(payload.accessKey)
                                return {"detail": "success"}
                            else:
                                raise HTTPException(
                                    status_code=userRegisterCode, detail=userRegisterData["detail"])
                        else:
                            raise HTTPException(
                                status_code=code, detail=data["detail"])

        elif deviceObject and deviceObject.Access_key == None:
            authenticator = Authentication()
            code, data = authenticator.assignDevice(
                payload.accessKey, deviceObject.Serial_number, payload.deviceName)

            if code == 200:
                deviceObject.Access_key = payload.accessKey
                deviceObject.Device_name = payload.deviceName
                deviceObject.Status = "Active"
                deviceObject.GroupID = data.get("GroupID")
                deviceObject.Priorities = data.get("Priorities")
                deviceObject.TypeID = data.get("TypeID")
                deviceObject.Warranty_validity = datetime.datetime.utcnow(
                ) + datetime.timedelta(days=data["Warranty_duration"])
                deviceObject.save()

                userRegisterCode, userRegisterData = authenticator.createUser(
                    **{
                        "FullName": payload.fullName,
                        "Username": payload.username,
                        "Password": payload.password,
                        "Email": payload.emailId,
                        "Phone": payload.phone,
                        "Status": True
                    }
                )

                if userRegisterCode == 200:
                    authenticator.fetch_service_metadata(payload.accessKey)
                    return {"detail": "success"}
                else:
                    raise HTTPException(
                        status_code=userRegisterCode, detail=userRegisterData["detail"])

            else:
                console_logger.debug("error")
                raise HTTPException(status_code=code, detail=data["detail"])
        else:
            return JSONResponse(status_code=403, content={"detail": "Already configured"})

    except DoesNotExist as e:
        raise HTTPException(status_code=404,detail=e)


@router.get("/startup", tags=["Initial Flow"])
async def endpoint_to_fetch_the_startup_activity():
    startupActivity = Startup()
    status = startupActivity.performStartupActivity()
    console_logger.debug(status)
    if status == 200:
        return {"detail": "success"}
    elif status == 400:
        return {"detail": "network"}
    elif status == 403:
        return {"detail": "suspended"}
    elif status == 404:
        return {"detail": "user_selection"}
    else:
        raise HTTPException(status_code=status)


@router.get("/serialNumber", tags=["Initial Flow"])
async def endpoint_to_fetch_serial_number_from_cloud(accessKey: str = Header(...)):
    try:
        authenticator = Authentication()
        code, data = authenticator.fetchUserSerialNumber(accessKey)
        if code == 200:
            return {"detail": data["detail"]}
        else:
            raise HTTPException(status_code=code)
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.get("/fetch_info", tags=["Initial Flow"])
async def endpoint_to_fetch_registered_device_info():
    authenticator = Authentication()
    code, data = authenticator.fetchDeviceRegistration()
    if code == 200:
        return {"detail": data["detail"]}
    else:
        raise HTTPException(status_code=code)


@router.post("/alert", tags=["Initial Flow"])
async def endpoint_to_generate_alert(payload: AlertsPostIn):
# async def endpoint_to_generate_alert(request: Request):
    
    suspended_apps_list = api_operations.fetchAppStatus()
    console_logger.debug(suspended_apps_list)
    data = payload.dict()
    console_logger.debug(data)
    found = any(ele in data["Service_id"] for ele in suspended_apps_list)
    if found != True:
        alert = Alerts(**payload.dict())
        alert.Ticket_number = await alert.get_ticket_number("alert")
        alert.Sync_status = False
        alert.save()

        # local_timestamp = alert.Timestamp.replace(
        #     tzinfo=datetime.timezone.utc).astimezone(tz=None)
        # image_path = alert.generate_url_list(local_timestamp.replace(
        #     microsecond=0).strftime('%d-%m-%Y'), alert.Camera_id, alert.Image_path)

        notificationHandler.sendNotification({
            "title": payload.Service_id,
            "message": payload.Alert,
            "ticket_no": alert.Ticket_number,
            "image": alert.Image_path,
            "camera_id": alert.Camera_id
        })

        alertoperator = AlertsOperations(alert)
        taskName = "send_alert_" + \
            datetime.datetime.strftime(
                datetime.datetime.utcnow(), "%Y/%M/%D_%H:%M:%S")
        task = asyncio.create_task(
            alertoperator.verify_send_alert(), name=taskName)
        task.add_done_callback(log_task) 
    return {"detail": "success"}


@router.get('/alert', tags=["Initial Flow"])
async def endpoint_to_fetch_alerts(
    all: Optional[bool] = False,
    text: Optional[str] = None,
    page_no: Optional[int] = 1,
    page_len: Optional[int] = 10,
    service_id: Optional[str] = None,
    camera_id: Optional[str] = None,
    start_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
    end_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(microsecond=0),
    ticket_no: Optional[str] = None,
    access: bool = Depends(validation_helpers.validate_user)
):
    if not access:
        raise HTTPException(status_code=403)

    try:
        query = {}
        offset = (page_no - 1) * page_len

        if service_id:
            query["Service_id"] = service_id
        if camera_id:
            query["Camera_id"] = camera_id
        if start_timestamp:
            query["Timestamp__gte"] = start_timestamp
        if end_timestamp:
            query["Timestamp__lte"] = end_timestamp
        if text:
            query = {"Alert__icontains": text}
        if all:
            query = {
                "Timestamp__gte": datetime.datetime.utcnow() - datetime.timedelta(days=30),
                "Timestamp__lte": datetime.datetime.utcnow()
            }
        if ticket_no:
            query = {
                "Ticket_number": ticket_no
            }

        # console_logger.debug(query)
        count = Alerts.objects(**query).count()
        alert_objects = Alerts.objects(**query).skip(offset).limit(page_len)

        # console_logger.debug(alert_objects)
        # console_logger.debug(count)

        response = {
            "total_data": count,
            "per_page": page_len
        }

        alerts_list = []
        for alert in alert_objects:
            alerts_list.append(AlertsOut(**alert.payload()))

        response["data"] = alerts_list
        return JSONResponse(content=jsonable_encoder(response), status_code=200)

    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.get("/alert/actions", tags=["New flow"])
async def endpoint_to_fetch_available_alert_actions(access: bool = Depends(validation_helpers.validate_user)):
    try:
        actions = AlertActions.objects.first()
        if actions:
            return {"detail": actions.payload()}
        else:
            raise HTTPException(status_code=404)
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.get("/alert/actions/status", tags=["New flow"])
async def endpoint_to_fetch_available_alert_actions_status(access: bool = Depends(validation_helpers.validate_user)):
    try:
        response = {}
        actions = AlertActions.objects.first()
        if actions:
            for action in actions.actions:
                if action == "whatsapp" and whatsappHandler.whatsappSettingsObject is not None:
                    whatsapp_profile = WhatsappSettings.objects.first()
                    if whatsapp_profile and whatsapp_profile.serviceStatus:
                        response[action] = True
                    else:
                        response[action] = False
                elif action == "telegram" and telegramHandler.initialized:
                    telegram_profile = TelegramDetails.objects.first()
                    response[action] = telegram_profile.ServiceStatus
                elif action == "email":
                    generalsettings = GeneralSettings.objects.first()
                    # if any(generalsettings.Email):
                    if generalsettings and generalsettings.Email_status:
                        response[action] = True
                    else:
                        response[action] = False
                elif action == "ticketing":
                    serverObject = Server.objects(
                        Server_role="Ticketing").first()
                    if serverObject:
                        response[action] = serverObject.Status
                    else:
                        response[action] = False
                else:
                    response[action] = False
            return {"detail": response}
        else:
            raise HTTPException(status_code=404)
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.post("/alert/actions/status", tags=["New flow"])
async def endpoint_to_update_available_alert_actions_status(action: str, access: bool = Depends(validation_helpers.validate_user)):
    try:
        response = {}
        actions = AlertActions.objects.first()
        if actions:
            if action == "whatsapp":
                whatsapp_profile = WhatsappSettings.objects.first()
                if whatsapp_profile:
                    whatsapp_profile.serviceStatus = not whatsapp_profile.serviceStatus
                    whatsappHandler.whatsappSettingsObject.serviceStatus = not whatsappHandler.whatsappSettingsObject.serviceStatus
                    whatsapp_profile.save()
            elif action == "telegram" and telegramHandler.initialized:
                telegram_profile = TelegramDetails.objects.first()
                if telegram_profile:
                    telegram_profile.ServiceStatus = not telegram_profile.ServiceStatus
                    telegram_profile.save()
            elif action == "email":
                generalsettings = GeneralSettings.objects.first()
                if generalsettings:
                    generalsettings.Email_status = not generalsettings.Email_status
                    generalsettings.save()
            elif action == "ticketing":
                serverObject = Server.objects(Server_role="Ticketing").first()
                if serverObject:
                    serverObject.Status = not serverObject.Status
                    serverObject.save()
            return {"detail": response}
        else:
            raise HTTPException(status_code=404)
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.post("/alert/actions", tags=["New flow"])
async def endpoint_to_add_alert_action(payload: AlertActionsPostIn, access: bool = Depends(validation_helpers.validate_user)):
    try:
        actions = AlertActions.objects.first()
        if actions:
            currectActions = actions.actions
            if payload.action not in currectActions:
                currectActions.append(payload.action)
            actions.actions = currectActions

        else:
            actions = AlertActions(actions=[payload.action])
        actions.save()
        return {"detail": "success"}
    except ValidationError:
        raise HTTPException(status_code=400)


@router.post('/alert/download', tags=["New flow"])
async def endpoint_to_download_filtered_alerts(
    payload: AlertDownloadPostIn,
    all: Optional[bool] = False,
    text: Optional[str] = None,
    service_id: Optional[str] = None,
    camera_id: Optional[str] = None,
    start_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
    end_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(microsecond=0),
    access: bool = Depends(validation_helpers.validate_user),
):
    if not access:
        raise HTTPException(status_code=403)

    try:
        query = {}
        alerts_list = []
        serial_number = DeviceInfo.objects().first().Serial_number

        if service_id:
            query["Service_id"] = service_id
        if camera_id:
            query["Camera_id"] = camera_id
        if start_timestamp:
            query["Timestamp__gte"] = start_timestamp
        if end_timestamp:
            query["Timestamp__lte"] = end_timestamp
        if text:
            query = {"Alert__icontains": text}
        if all:
            query = {
                "Timestamp__gte": datetime.datetime.utcnow() - datetime.timedelta(days=30),
                "Timestamp__lte": datetime.datetime.utcnow()
            }

        if len(payload.ticket_nos) > 0:
            updatedList = []
            for ticket in payload.ticket_nos:

                updatedList.append("{}_{}".format(serial_number, ticket))

            pipeline = [
                {"$match": {
                    "Ticket_number": {"$in": updatedList}
                }},
                {"$sort": {"Timestamp": -1}},
            ]
            console_logger.debug(pipeline)
            alert_objects = Alerts.objects().aggregate(pipeline)
            for data in alert_objects:
                local_timestamp = data["Timestamp"].replace(
                    tzinfo=datetime.timezone.utc).astimezone(tz=None)
                image_path = Alerts.generate_url_list(local_timestamp.replace(
                    microsecond=0).strftime('%d-%m-%Y'), data["Camera_id"], data["Image_path"], local=True)
                data["Image_path"] = image_path
                data["Date"] = local_timestamp.replace(microsecond=0).date()
                data["Time"] = local_timestamp.replace(microsecond=0).time()
                alerts_list.append(data)
        else:
            alert_objects = Alerts.objects(**query)

            for alert in alert_objects:
                alerts_list.append(alert.payload(local=True))

        taskName = "download_alert_" + \
            datetime.datetime.strftime(
                datetime.datetime.utcnow(), "%Y/%M/%D_%H:%M:%S")
        task = asyncio.create_task(asyncio.to_thread(
            generate_excelsheet, alerts_list), name=taskName)
        task.add_done_callback(send_socket_event)

        return {"detail": "success"}

    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/whatsapp/verify")
async def endpoint_to_verify_mobile_number(payload: WhatsappMobileVerify, access: bool = Depends(validation_helpers.validate_user)):
    try:
        console_logger.debug(payload.mobile)
        if whatsappHandler.whatsappSettingsPresent and whatsappHandler.whatsappSettingsInitialized:
            wid = whatsappHandler.verify_contacts([payload.mobile])
            if any(wid):
                console_logger.debug(wid[0])
                return {"detail": wid[0]}
            else:
                raise HTTPException(status_code=404)
        else:
            raise HTTPException(status_code=400)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/whatsapp")
async def endpoint_to_add_whatsapp_details(payload: WhatsappSettingsPostIn, token: str = Depends(validation_helpers.auth_user_telegram)):
    data = payload.dict()
    console_logger.debug(data)
    if whatsappHandler.whatsappSettingsPresent:
        whatsappHandler.update_setting(data)
    else:
        whatsappHandler.add_settings(data)
    return {"detail": "success"}


@router.get("/whatsapp")
async def endpoint_to_get_whatsapp_details(token: str = Depends(validation_helpers.auth_user_telegram)):
    if whatsappHandler.whatsappSettingsPresent:
        data = whatsappHandler.get_setting()
        data.pop("password")
        return {"detail": data}
    else:
        raise HTTPException(status_code=404)


@router.delete("/whatsapp")
async def endpoint_to_delete_whatsapp_details(token: str = Depends(validation_helpers.auth_user_telegram)):
    if whatsappHandler.whatsappSettingsPresent:
        whatsappHandler.delete_setting()
        return {"detail": "success"}
    else:
        raise HTTPException(status_code=404)


@router.put("/whatsapp")
async def endpoint_to_update_whatsapp_details(payload: WhatsappSettingsPostIn, token: str = Depends(validation_helpers.auth_user_telegram)):
    if whatsappHandler.whatsappSettingsPresent:
        whatsappHandler.update_setting(payload.dict())
        return {"detail": "success"}
    else:
        raise HTTPException(status_code=404)


@router.get("/count")
async def endpoint_to_get_alert_count(token: str = Depends(validation_helpers.auth_user_telegram)):
    try:
        alertCount = Alerts.objects.count()
        return {"detail": alertCount}
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.get("/notifications")
async def endpoint_to_get_noitifications(token: str = Depends(validation_helpers.auth_user_telegram)):
    try:
        response = []
        notifications = Notifications.objects.order_by("-created").limit(10)
        for notification in notifications:
            response.append(notification.payload())
        return {"detail": response}
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/ticketing")
async def endpoint_to_add_enable_ticketing(payload: TicketingPostIn, access: bool = Depends(validation_helpers.validate_user_admin)):
    data = payload.dict()
    if data["type"] == "Diycam Cloud":
        serverObject = Server.objects(Server_role="Ticketing", Ownership="Diycam").first()
        if serverObject:
            return {"detail": "success"}
        else:
            Server(Server_role="Ticketing", Ownership="Diycam",
                Url=config.DIYCAMTICKETINGURL).save()
    return {"detail": "success"}


@router.get("/ticketing")
async def endpoint_to_fetch_enable_ticketing(access: bool = Depends(validation_helpers.validate_user_admin)):
    try:
        serverObject = Server.objects.get(Server_role="Ticketing")
        if serverObject.Ownership == "Diycam":
            response = {
                "type": "Diycam Cloud"
            }
            return {"detail": response}
        else:
            raise HTTPException(status_code=404)
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.post("/reset/settings")
async def endpoint_to_reset_device_settings(access: bool = Depends(validation_helpers.validate_user_admin)):
    try:
        if resetSettingsHandler.resetSettings():
            return {"detail": "success"}
        else:
            raise HTTPException(status_code=400)  
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.get("/software/version", tags=["New flow"])
async def endpoint_to_fetch_hardware_version():
    try:
        deviceInfo = DeviceInfo.objects.first()
        if deviceInfo:
            return {"detail": deviceInfo.Software_version}
        else:
            return {"detail": config.SOFTWARE_VERSION}
    except DoesNotExist:
        raise HTTPException(status_code=404)

@router.get("/unique/device_name", tags=["New flow"])
async def endpoint_to_check_unique_device_name(deviceName: str, accessKey: str = Header(...), serialNumber: str = Header(...)):
    try:
        auth = Authentication()
        status_code, response = auth.check_unique_device_name(accessKey, serialNumber, deviceName)
        if status_code == 200:
            return response
        else:
            raise HTTPException(status_code=status_code)
    except DoesNotExist:
        raise HTTPException(status_code=404)

# @router.post("/profile", tags=["new api added (prem)"])
# async def endpoint_to_test():
#     api_operations= APIOperations()
#     user_data = api_operations.fetchAppStatus()
#     return {"details":user_data}


########### sachin

from api.service.helpers.anpr_operations import AnprOperations,ExcelOperations
anpr_operations = AnprOperations()
excel_operations = ExcelOperations()

@router.post("/anpr/data", tags=["ANPR"])
async def endpoint_to_anpr_data(record_id: str = Form(...),vehicle_number: str = Form(...),company_id: str = Form(...),site_name: str = Form(...),
                                location: str = Form(...),group_id: str = Form(...),type: str = Form(...),device_name: str = Form(...),
                                direction: str = Form(...),visited_datetime: str = Form(...),vehicle_image: str = Form(...),number_plate: str = Form(...)):
    try:
        datetime_visited = datetime.datetime.strptime(visited_datetime.strip(), '%Y-%m-%d %H:%M:%S')
        static_directory_path = os.path.join(os.getcwd(), "static_server", 'anpr')
        if not os.path.exists(static_directory_path):
            os.makedirs(static_directory_path)
            
        query= {}
        data_lenth = AnprDetails.objects(**query).count()
        try:
            collected_data = AnprDetails.objects.get(vehicle_number=vehicle_number)
        except Exception as e:
            console_logger.debug(e)
            collected_data = None
        if collected_data == None or data_lenth == 0:
            info = {
                    "record_id": record_id,
                    "vehicle_number": vehicle_number,
                    "company_id": company_id,
                    "site_name": site_name,
                    "location": location,
                    "group_id": group_id,
                    "type": type,
                    "device_name": device_name,
                    "direction": direction,
                    "visited_datetime": datetime_visited,
                    "vehicle_image": vehicle_image,
                    "number_plate": number_plate,
                    "path": static_directory_path
                }
            anpr_operations.GetAnprDetails(**info)
        return {"detail": 'succ'}
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)
    
@router.get("/anpr/reports/details", tags=["ANPR"])
async def endpoint_to_anpr_details(
    page_no: Optional[int] = 1, page_len: Optional[int] = 10,all: Optional[bool] = True,
    start_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
    end_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(microsecond=0)
    ):
    try:
        query= {}
        if all == False:
            if start_timestamp:
                query["visited_datetime__gte"] = start_timestamp
            if end_timestamp:
                query["visited_datetime__lte"] = end_timestamp
        
        query["direction"] = "IN"
        count = AnprDetails.objects(**query).count()
        offset = (page_no - 1) * page_len
        # sort = {'visited_datetime': -1}
        anpr_objects = AnprDetails.objects(**query).skip(offset).limit(page_len).order_by('-visited_datetime')
        response = {
                "total_data": count,
                "per_page": page_len
            }
        data_list = []
        for detail in anpr_objects:
            data = detail.payload()
            data['visited_date'] = datetime.datetime.strftime(data['visited_datetime'], '%Y-%m-%d')
            data['visited_time'] = datetime.datetime.strftime(data['visited_datetime'], '%H:%M:%S')
            data['images'] = [data['vehicle_image'],data['number_plate']]
            del data['vehicle_image']
            del data['number_plate']
            data_list.append(data)

        response["data"] = data_list
        return JSONResponse(content=jsonable_encoder(response), status_code=200)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)

@router.get("/anpr/count/avg", tags=["ANPR"])
async def anpr_count_avg():
    try:
        taskName = "get_count_avg"
        task = asyncio.create_task(asyncio.to_thread(anpr_operations.GetCountAvg), name=taskName)
        task.add_done_callback(anpr_avg_count_socket_event)
        return {"detail": 'success'}
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)

@router.get("/anpr/statistics", tags=["ANPR"])
async def anpr_details_statistics(hrs_wise: Optional[bool] = False, week_wise: Optional[bool] = False, month_wise: Optional[bool] = False):
    try:
        if hrs_wise == True and week_wise == False and month_wise == False:
            data = anpr_operations.GetHoursWiseData()
        
        elif week_wise == True and hrs_wise == False and month_wise == False:
            data = anpr_operations.GetWeekWiseData()
        
        elif month_wise == True and hrs_wise == False and week_wise == False:
            data = anpr_operations.GetMothWiseDate()
            
        if data != False:
            return {"detail": data}
        else:
            raise HTTPException(status_code=400)  
    except DoesNotExist:
        raise HTTPException(status_code=404)

@router.post("/anpr/reports/download", tags=["ANPR"])
async def anpr_reports_download(
    payload: AnprReportsDownloadPostIn,
    all:Optional[bool] = False,
    start_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
    end_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(microsecond=0)):  
    try:
        query = {}
        reports_list = []
        custom_reports_objects = []
        if all:
            query = {
                "visited_datetime__gte": datetime.datetime.utcnow() - datetime.timedelta(days=30),
                "visited_datetime__lte": datetime.datetime.utcnow()
            }
        if start_timestamp:
            query["visited_datetime__gte"] = start_timestamp
        if end_timestamp:
            query["visited_datetime__lte"] = end_timestamp
        if len(payload.record_ids) > 0:
            updatedList = []
            for id in payload.record_ids:
                updatedList.append(str(id))
            
            pipeline = [
                    {"$match": {
                        "record_id": {"$in": updatedList}
                    }},
                    {"$sort": {"visited_datetime": -1}},
                ]
            reports_objects = AnprDetails.objects().aggregate(pipeline)
            for data in reports_objects:
                custom_reports_objects.append(data)
        else:
            reports_objects = AnprDetails.objects(**query).order_by('-visited_datetime')
            for data in reports_objects:
                data = data.payload(local=True)
                custom_reports_objects.append(data)
        
        console_logger.debug(custom_reports_objects)
        for data in custom_reports_objects:
            vehicle_image_path = data['vehicle_image']
            number_plate_path = data['number_plate']
            local_timestamp = data["visited_datetime"].replace(tzinfo=datetime.timezone.utc).astimezone(tz=None)
            try:del data['_id']
            except:pass
            del data['visited_datetime']
            del data['vehicle_image']
            del data['number_plate']
            
            data["Date"] = str(local_timestamp.replace(microsecond=0).date())
            data["Time"] = str(local_timestamp.replace(microsecond=0).time())
            data['vehicle_image'] =  os.path.join(os.getcwd(), "static_server", 'anpr', vehicle_image_path.split('/')[-1])
            data['number_plate'] = os.path.join(os.getcwd(), "static_server", 'anpr', number_plate_path.split('/')[-1])

            reports_list.append(data)
            
        taskName = "download_reports_" + datetime.datetime.strftime(datetime.datetime.utcnow(), "%Y/%M/%D_%H:%M:%S")
        task = asyncio.create_task(asyncio.to_thread(excel_operations.generate_excelsheet, reports_list), name=taskName)
        task.add_done_callback(reports_download)
        
        return {"detail": 'success'}

    except DoesNotExist:
        raise HTTPException(status_code=404)


async def delete_report_image(image_list):
    for image in image_list:
        if os.path.exists(image):
            os.remove(image)
    return 1

@router.delete("/anpr/reports/delete", tags=["ANPR"],status_code=200,
            responses={
                404: responses._404(),
                401: responses._401()
            })
async def anpr_reports_delete(
    record_ids_list: AnprReportsDownloadPostIn,
    select_timestamp: Optional[bool] = False,
    start_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
    end_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(microsecond=0),
):  
    try:
        query = {}
        
        if len(record_ids_list.record_ids) != 0:
            for id in record_ids_list.record_ids:
                reports = AnprDetails.objects.get(record_id=str(id))
                image_list = []
                image_list.append(os.path.join(os.getcwd(), "static_server", 'anpr', reports['vehicle_image'].split('/')[-1]))
                image_list.append(os.path.join(os.getcwd(), "static_server", 'anpr', reports['number_plate'].split('/')[-1]))
                
                await delete_report_image(image_list)
                reports.delete()
        else:
            if select_timestamp:
                query["visited_datetime__gte"] = start_timestamp
                query["visited_datetime__lte"] = end_timestamp
                reports_objects = AnprDetails.objects(**query)
                for data in reports_objects:
                    dic_data = data.payload(local=True)
                    image_list = []
                    image_list.append(os.path.join(os.getcwd(), "static_server", 'anpr', dic_data['vehicle_image'].split('/')[-1]))
                    image_list.append(os.path.join(os.getcwd(), "static_server", 'anpr', dic_data['number_plate'].split('/')[-1]))
                    await delete_report_image(data)
                    data.delete()
        return {"detail": 'success'} 
    except DoesNotExist:
        raise HTTPException(status_code=404)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)
    
@router.get("/anpr/alerts/count", tags=["ANPR"])
async def anpr_count_avg():
    try:
        taskName = "get_alerts_count"
        # anpr_operations.alerts_count()
        task = asyncio.create_task(asyncio.to_thread(anpr_operations.alerts_count), name=taskName)
        task.add_done_callback(alert_count_socket_event)
        return {"detail": 'success'}
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)
    
@router.get("/anpr/test", tags=["ANPR"],)
async def anpr_test():
    pipeline = [
        {
            "$match":{
                "$and":[
                {"visited_datetime": {
                    "$gte": datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
                    "$lte": datetime.datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=0)
                    }
                },
                ]
            }
        }
    ]
    
    data_count = AnprDetails.objects().aggregate(pipeline)
    for detail in data_count:
        console_logger.debug(detail['visited_datetime'])
    return {"detail": 'success'}

