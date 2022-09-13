from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import JSONResponse
from mongoengine.errors import DoesNotExist
from typing import Optional
from mongoengine.queryset.transform import update
from api.service.serializers import *
from api.service.models import *
from fastapi.encoders import jsonable_encoder
from api.service.helpers.network import network_manager
from api.service.helpers.usb_listener import USBDetector
from api.service.helpers.logs import console_logger
from api.service.helpers.create_config import create_config_file
from api.service.helpers.osvalues import (
    fetch_values,
    get_jetpack_version,
    get_mac_id_using_shell,
)
from api.service.helpers.serial import SerialCommand
from api.service.helpers.storage import (
    get_drives,
    get_mount_point,
    mount_drive_to_folder,
    eject_device,
    Storage,
)
from api.service.helpers.camera import (
    capture_with_thread,
    health_with_thread,
    getUSBCameras,
)
from api.service.helpers import timesettings, device_logs
from api.service.helpers import util_models, stats
from config import TestConfig as config
from fastapi_utils.tasks import repeat_every
from api.service.helpers import updateprocess
from api.service.helpers.general_helpers import network_statistics, fifo_socket_url
import psutil
import shutil
import asyncio
import pytz
import datetime
import os
import sys
import copy
from time import gmtime, strftime, sleep
import requests
import json
import threading
import concurrent.futures

from api.service import helpers
from api.service.helpers.api_operations import apiOperationHandler

from urllib.request import Request
from starlette.requests import Request
from api.service.helpers.device_logs import host_logs
from api.service.helpers.zip_operations import Zip_Converter
from apscheduler.schedulers.background import BackgroundScheduler
from api.service.helpers.schedule_operation import ScheduleOperations
from api.service.helpers.fifo import Fifo
from api.service.helpers.ota_handler import otaHandler

# from api.service.helpers.onvifmanager import OnvifPython

scheduler = BackgroundScheduler()
zip_operation = Zip_Converter()
scheduleoperations = ScheduleOperations()
fifo = Fifo()
router = APIRouter()

# usb_detector = USBDetector()
# thread = threading.Thread(target=usb_detector.listen,)

# onvifHandler = OnvifPython()
# network_manager._check_for_ip("192.168.1.244")

theme_directory_path = os.path.join(os.getcwd(), "..", "static_server", "theme")
jsonPath = os.path.join(os.getcwd(), "..", "frontend", "html", "Theme.json")


def createThemeJson(dictionary):
    json_object = json.dumps(dictionary, indent=4)
    with open(jsonPath, "w") as outfile:
        outfile.write(json_object)


def reboot_system():
    sleep(2)
    os.system("sudo reboot")


scheduler.add_job(
    scheduleoperations.schedule_folder,
    trigger="cron",
    hour="22",
    minute="16",
    second="30",
)
scheduler.add_job(
    scheduleoperations.schedule_fifo,
    trigger="cron",
    hour="00",
    minute="00",
    second="01",
)
scheduler.start()


@repeat_every(seconds=15)
async def send_stats():
    try:
        headers = {"content-type": "application/json"}
        stats = {
            "cpu_usage": helpers.stats.get_cpu_percent(),
            "ram_usage": helpers.stats.get_ram_percent(),
            "ram_size": helpers.stats.get_ram_size(),
            "gpu_percent": helpers.stats.get_gpu_percent(),
        }
        stats.update(helpers.stats.get_memory_details())

        requests.post(
            config.SOCKETSERVER_URL + "/stats",
            data=json.dumps(stats),
            headers=headers,
            timeout=4,
        )

        # started_at = DeviceLogs.objects.filter(Event="device start").first()
        # console_logger.debug(started_at.TSCreated)
        # console_logger.debug(datetime.timedelta(seconds=60))
        # if started_at.TSCreated + datetime.timedelta(seconds=60) < datetime.datetime.utcnow():
        #     console_logger.debug("rebooting now")
        #     reboot_system()

        return
    except Exception as e:
        console_logger.debug(e)
        return


# @repeat_every(seconds=60)
# async def speed_stats():

#     socket_url = "http://localhost:80/socket/networkspeed"
#     headers = {"content-type": "application/json"}
#     data = network_manager._fetchDownloadUploadSpeed()
#     payload = {"detail": dict(data)}
#     # console_logger.debug(payload)
#     requests.request(
#         "POST", socket_url, headers=headers, data=json.dumps(payload), timeout=10
#     )


@repeat_every(seconds=60)
async def send_network_stats():
    socket_url = "http://localhost:80/socket/networkstats"
    headers = {"content-type": "application/json"}
    data = network_manager._collectNetDetails()
    payload = {"detail": dict(data)}
    console_logger.debug(payload)
    requests.request(
        "POST", socket_url, headers=headers, data=json.dumps(payload), timeout=10
    )
    return


# @repeat_every(seconds=30)
# async def reboot_every_one_hr():
#     console_logger.debug("device rebooting")
#     reboot_system()
#     return


@router.on_event("startup")
async def startup():
    while True:
        try:
            device_logs.get_last_shutdown()
            await device_logs.device_up()
            device_logs.save_device_logs(
                "device start", "Info", "device powered on", device_logs.get_uptime()
            )
            await send_stats()
            # await speed_stats()
            await send_network_stats()
            scheduleoperations.schedule_folder()
            concurrent.futures.ThreadPoolExecutor(max_workers=1).submit(
                fifo.balance_memory
            )
            break
        except Exception:
            pass


@router.get("/ssids")
async def returns_list_of_available_wifi_networks():
    """
    Available SSID's
    """
    try:
        avail_wifilist = network_manager._getWifiList("wlan0")
        response = {"Data": avail_wifilist}
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail={"Message": e})


@router.get("/network", response_model=NetworkConfigurePost)
async def endpoint_for_fetching_network_details():
    try:
        interfaceName = network_manager._getEthernetAdapterName()
        ethernetConfig = network_manager._fetchEthernetDetails(
            interfaceName=interfaceName
        )
        return ethernetConfig
    except Exception as e:
        raise HTTPException(status_code=500, detail={"Message": e})


@router.post("/network/configure")
async def endpoint_to_configure_network(
    item: NetworkConfigurePost, background_tasks: BackgroundTasks
):
    # """
    #     Configure network
    # """
    # try:
    payload = item.dict(exclude_unset=True)
    if payload[payload["Network_priority"]] != {}:

        if network_manager._check_for_ip(
            payload["Ethernets"]["Ip"],
            payload["Ethernets"]["Subnet_mask"],
            payload["Ethernets"]["Gateway"],
            payload["Ethernets"]["Dns"],
        ):
            raise HTTPException(status_code=403, detail={"Message": "Ip present"})

        if payload["Ethernets"]:
            interfaceName = network_manager._getEthernetAdapterName()
            status = network_manager._configureStaticIP(
                interfaceName,
                "ethernets",
                payload["Ethernets"]["Ip"],
                payload["Ethernets"]["Subnet_mask"],
                payload["Ethernets"]["Gateway"],
                payload["Ethernets"]["Dns"],
            )
            if status == "Fail":
                raise HTTPException(status_code=403, detail={"Message": "Ip present"})

        if payload["Network_priority"] == "Ethernets":
            network_manager._set_network_priority(interfaceName)
            create_config_file(payload["Ethernets"]["Ip"], 80)

        service_id = None
        resp = requests.get(url="http://localhost:8001/services")
        for service in json.loads(resp.text)["data"]:
            if service["name"] == "host":
                service_id = service["id"]
                break

        resp = requests.patch(
            url="http://localhost:8001/services/{}".format(service_id),
            data={"host": payload["Ethernets"]["Ip"]},
        )

        apiOperationHandler.sendIpToServiceManagement(payload["Ethernets"]["Ip"])

        sleep(5)
        device_logs.save_device_logs("reboot", "Info", "network configured")
        os.system("sudo shutdown -r +1")
        return {"Message": "Success"}
    elif payload[payload["Network_priority"]] == {}:
        return {"Message": "Success"}
    else:
        raise HTTPException(status_code=400, detail={"Message": "Bad Request"})


# except Exception as e:
#     console_logger.debug(e)
#     raise HTTPException(status_code=500, detail={
#                         "Message": "Server Error"})


@router.get("/freememory")
async def free_memory(device_name: Optional[str] = None):
    # try:
    console_logger.debug(device_name)
    if device_name:
        mountpoint = get_mount_point(device_name)
        if mountpoint is None:
            raise HTTPException(status_code=400)
        memory = psutil.disk_usage(mountpoint).free
    else:
        memory = psutil.disk_usage("/").free
    # console_logger.debug(memory.total)
    # console_logger.debug(memory.free*config.BUFFER_MEMEORY_PERCENT)
    return {"FreeMemory": int(memory / (2**20))}
    # except Exception as e:
    #     console_logger.debug(e)
    #     raise HTTPException(status_code=500)


@router.get("/virtualmemory")
async def free_virtual_memory():
    try:
        memory = psutil.virtual_memory()
        console_logger.debug(memory.total)
        console_logger.debug(memory.free * config.BUFFER_MEMEORY_PERCENT)
        # return {"FreeMemory": int(memory.free) - int(memory.total)*config.BUFFER_MEMEORY_PERCENT}
        return {
            "FreeMemory": int(
                memory.total - memory.total * config.BUFFER_MEMEORY_PERCENT
            )
        }
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.get("/osvalues")
async def os_values():
    try:
        os_values = fetch_values()
        return os_values
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.get("/storagedevices")
async def storage_devices():
    try:
        devices = get_drives()
        return devices
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


# @router.post("/configmount")
# async def create_mount(payload: ConfigMountPostIn):
#     mountpoint = get_mount_point(payload.Device_kname)
#     console_logger.debug(mountpoint)
#     mountingstatus = mount_drive_to_folder(mountpoint, config.TARGET_PATH)
#     console_logger.debug(mountingstatus)
#     if mountingstatus:
#         os.system('sudo reboot')
#         device_logs.save_device_logs("external storage mount success","Info","external storage device mounted")
#         return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
#     else:
#         device_logs.save_device_logs("external storage mount failed","Info","external storage device mount failed")
#         raise HTTPException(status_code=500)

# @router.post("/eject")
# async def eject_mount(payload: EjectDevicePostIn):
#     status = eject_device(payload.Device_kname)
#     if status:
#         device_logs.save_device_logs("external storage removed","Info","external storage device removed")
#         return JSONResponse(content=util_models.DefaultResponseModel(detail="Successful").dict(), status_code=200)
#     else:
#         device_logs.save_device_logs("external storage removal failed","Info","external storage device removal failed")
#         raise HTTPException(status_code=500)


@router.post("/timesettings")
async def time_settings(payload: TimeSettingsPostIn):
    try:
        console_logger.debug(payload.dict())
        # Disable automatic time synchronization
        timeSettingObjects = TimeSettings.objects()

        if any(timeSettingObjects):
            timeSettingObjects.first().update(
                Ntp_url=payload.Ntp_url, UseNtp=payload.SyncronizeWithNTP
            )
        else:
            TimeSettings(
                Ntp_url=payload.Ntp_url, UseNtp=payload.SyncronizeWithNTP
            ).save()

        if payload.Region:
            timeSettingObjects.first().update(Region=payload.Region)

        if payload.Timezone:
            timesettings.set_timezone(payload.Timezone)

        if payload.AutoTimeZone != None:
            timeSettingObjects.first().update(AutoTimeZone=payload.AutoTimeZone)
            timesettings.update_timezone()
        # if payload.Current_datetime:
        #     timesettings.set_datetime(payload.Current_datetime.replace("T", " "))
        #     device_logs.save_device_logs("device time configured","Info","device timing configured")

        if payload.Ntp_url:
            if not timesettings.fetch_ntpvalues(payload.Ntp_url):
                return JSONResponse(
                    status_code=400, content={"detail": "Invalid NTP server Url"}
                )

            if any(timeSettingObjects):
                timeSettingObjects.first().update(
                    Ntp_url=payload.Ntp_url, UseNtp=payload.SyncronizeWithNTP
                )
            else:
                TimeSettings(
                    Ntp_url=payload.Ntp_url, UseNtp=payload.SyncronizeWithNTP
                ).save()

            datetimestr = timesettings.fetch_ntpvalues(payload.Ntp_url)
            if timesettings.set_datetime(datetimestr):
                device_logs.save_device_logs(
                    "ntp settings configured",
                    "Info",
                    "network timing server configuration successful",
                )
                return JSONResponse(
                    content=util_models.DefaultResponseModel(
                        detail="Successful"
                    ).dict(),
                    status_code=200,
                )
            else:
                raise HTTPException(status_code=500)
        timesettings.timedatectl_post_process()
        device_logs.save_device_logs("reboot", "Info", "TimeZone configured")
        console_logger.debug("device will reboot after 1 min")
        os.system("sudo shutdown -r +1")
        return JSONResponse(
            content=util_models.DefaultResponseModel(detail="Successful").dict(),
            status_code=200,
        )
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/timesettings")
async def time_settings():
    timezone, systemdatetime = timesettings.get_timezone()
    Ntp_url = ""
    UseNTP = False
    AutoTimeZone = False
    timeSettingObjects = TimeSettings.objects()
    Region = None
    data = {}

    if any(timeSettingObjects):
        time_setting = timeSettingObjects.first()
        Ntp_url = time_setting.Ntp_url
        UseNTP = time_setting.UseNtp
        AutoTimeZone = time_setting.AutoTimeZone
        Region = time_setting.Region

    data = {
        "Timezone": timezone,
        "Current_datetime": systemdatetime,
        "Ntp_url": Ntp_url,
        "SyncronizeWithNTP": UseNTP,
        "AutoTimeZone": AutoTimeZone,
        "Region": Region,
    }
    return JSONResponse(content=data, status_code=200)


@router.get("/timezones")
async def get_timezones():
    try:
        response = {"Timezones": timesettings.list_timezones()}
        return JSONResponse(content=response, status_code=200)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.get("/shutdown")
async def shutdown():
    try:
        device_logs.save_device_logs(
            "shutting down", "Info", "device shutdown requested"
        )
        os.system("sudo shutdown now")
        return JSONResponse(
            content=util_models.DefaultResponseModel(detail="Successfull").dict(),
            status_code=200,
        )
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.get("/restart")
async def restart():
    try:
        device_logs.save_device_logs("reboot", "Info", "device reboot requested")
        os.system("sudo shutdown -r +1")
        return JSONResponse(
            content=util_models.DefaultResponseModel(detail="Successfull").dict(),
            status_code=200,
        )
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/hw")
async def arduino(operation: str):
    try:
        serial_command = SerialCommand()

        status = None
        if operation == "Red Light":
            status = serial_command.activate_red()

        if operation == "Green Light":
            status = serial_command.activate_green()

        if operation == "Orange Light":
            status = serial_command.activate_orange()

        if operation == "Hooter":
            statuc = serial_command.activate_hooter()
        if status:
            return JSONResponse(
                content=util_models.DefaultResponseModel(detail="Successfull").dict(),
                status_code=200,
            )
        else:
            raise HTTPException(status_code=400)
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/capture")
def captureimage(payload: CameraCapturePostIn):
    try:
        console_logger.debug(payload.Source)
        image = capture_with_thread(payload.Source, payload.Link, payload.ImageType)
        console_logger.debug(image)
        return JSONResponse(
            content=util_models.DefaultResponseModel(detail=image).dict(),
            status_code=200,
        )
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500)


@router.post("/health")
def healthcheck(payload: CameraHealthPostIn):
    try:
        console_logger.debug(payload)
        capture_status, image_path = health_with_thread(
            payload.Source, payload.Link, payload.Consent
        )
        task = capture_status if capture_status else "False"
        return JSONResponse(
            content=util_models.HealthCheck(detail=task, image_path=image_path).dict(),
            status_code=200,
        )
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500)


@router.get("/usblist")
async def usbcameras():
    try:
        data = getUSBCameras()
        return JSONResponse(
            content=util_models.UsbList(usblist=data).dict(), status_code=200
        )
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.get("/devicelogs")
async def getdevicelogs(startlogs: Optional[bool] = None):
    try:
        if startlogs:
            if any(DeviceLogs.objects()):
                q = DeviceLogs.objects.filter(Event="device start").first()
                if q:
                    q = q.payload()
                    lateststart = {"date": q.get("Date"), "time": q.get("Time")}
                e = DeviceLogs.objects.filter(
                    Event__in=["unexpected shutdown", "reboot", "shutting down"]
                ).first()
                if e:
                    # console_logger.debug(e.TSCreated)
                    e = e.payload()
                    latestshutdown = {"date": e.get("Date"), "time": e.get("Time")}
                return JSONResponse(
                    status_code=200,
                    content=jsonable_encoder(
                        {"lateststart": lateststart, "latestshutdown": latestshutdown}
                    ),
                )

        query = {
            "TSCreated__lte": datetime.datetime.now(),
            "TSCreated__gte": datetime.datetime.now() - datetime.timedelta(days=30),
        }
        # console_logger.debug(query)
        datapayload = []
        for data in DeviceLogs.objects(**query):
            datapayload.append(data.payload())
        # console_logger.debug(datapayload)
        return JSONResponse(status_code=200, content=jsonable_encoder(datapayload))
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500)


@router.get("/systemstartup")
async def system_start():
    try:
        res = requests.get(config.BASE_HEALTH_URL, timeout=5)
        if res.status_code != 200:
            raise HTTPException(status_code=502)

        res = requests.get(config.SERVICE_HEALTH_URL, timeout=5)
        if res.status_code != 200:
            raise HTTPException(status_code=502)

        res = requests.get(config.USER_HEALTH_URL, timeout=5)
        if res.status_code != 200:
            raise HTTPException(status_code=502)

        # res = requests.get(config.CAMERA_HEALTH_URL, timeout=5)
        # if res.status_code != 200:
        #     raise HTTPException(status_code=502)
        return JSONResponse(
            content=util_models.DefaultResponseModel(detail="Success").dict(),
            status_code=200,
        )
    except Exception as e:

        console_logger.debug(e)
        raise HTTPException(status_code=502)


@router.post("/configmount")
async def endpoint_to_add_external_storage(payload: ConfigMountPostIn):
    try:
        storage_obj = Storage()

        if payload.Device_kname != "":
            mountpoint = storage_obj.get_source_mount(payload.Device_kname)
            volume_obj = ExternalDevices.objects(Source=mountpoint)
            bind_volume_obj = ExternalDevices.objects(Source=config.DESTINATION_PATH)
            available_memory = int(storage_obj.check_device_free_memory(mountpoint))
            required_memory = int(storage_obj.check_used_memory())
            console_logger.debug(available_memory)
            console_logger.debug(required_memory)

            if payload.Backup and required_memory <= 0.8 * available_memory:
                storage_obj.bind_mount_static_server()
                bind_volume_obj.update_one(
                    **{
                        "Device_type": "Storage",
                        "Device_name": None,
                        "Source": config.DESTINATION_PATH,
                        "Destination": config.BACKUP_PATH,
                        "Mount_type": "Bind",
                        "Enable": True,
                        "upsert": True,
                    }
                )

            storage_obj.volume_mount_static_server(mountpoint)
            volume_obj.update_one(
                **{
                    "Device_type": "Storage",
                    "Device_name": mountpoint,
                    "Source": mountpoint,
                    "Destination": config.DESTINATION_PATH,
                    "Mount_type": "Volume",
                    "Enable": True,
                    "upsert": True,
                }
            )

            if payload.Backup and required_memory <= 0.8 * available_memory:
                threading.Thread(
                    target=storage_obj.copy_data_from_backup_to_external_device,
                ).start()

        else:
            try:
                ExternalDevices.objects(**{"Mount_type": "Volume"})[0].delete()
                ExternalDevices.objects(**{"Mount_type": "Bind"})[0].delete()
            except:
                pass
            storage_obj.unmount_static_server(config.DESTINATION_PATH)
            storage_obj.unmount_static_server(config.BACKUP_PATH)

        return JSONResponse(
            content=util_models.DefaultResponseModel(detail="Success").dict(),
            status_code=200,
        )
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/eject")
async def endpoint_to_remove_external_storage(payload: EjectDevicePostIn):
    try:
        storage_obj = Storage()
        device = storage_obj.get_source_mount(payload.Device_kname)
        console_logger.debug(device)

        if device is None:
            device = "/dev/{}1".format(payload.Device_kname)

        console_logger.debug(device)
        volume_device_obj = ExternalDevices.objects(
            Source=device, Mount_type="Volume", Enable=True
        )
        bind_device_obj = ExternalDevices.objects(
            Source=config.DESTINATION_PATH, Mount_type="Bind", Enable=True
        )

        if any(volume_device_obj):
            storage_obj.unmount_static_server(config.DESTINATION_PATH)
            volume_device_obj[0].delete()
        else:
            parent_device = usb_detector.get_parent_device(
                "{}1".format(payload.Device_kname)
            )
            console_logger.debug(parent_device)
            if parent_device is not None:
                storage_obj.safely_remove_drive(device, parent_device)

        if any(bind_device_obj):
            storage_obj.unmount_static_server(config.BACKUP_PATH)
            bind_device_obj[0].delete()

        requests.post(
            url=config.GENERAL_SETTINGS_URL,
            data=json.dumps({"Size": int(psutil.disk_usage("/").free * 0.8)}),
        )

        return JSONResponse(
            content=util_models.DefaultResponseModel(detail="Success").dict(),
            status_code=200,
        )
    except DoesNotExist:
        raise HTTPException(status_code=400)


@router.get("/storagedevices/mounted")
async def endpoint_for_fetching_mounted_volume():
    storage_obj = Storage()
    volume_device_obj = ExternalDevices.objects(
        Mount_type="Volume", Enable=True
    ).first()
    if volume_device_obj:
        kname = "".join(
            i for i in volume_device_obj.Device_name.split("/")[-1] if not i.isdigit()
        )
        selected_device = storage_obj.get_drive_model(kname)
        if selected_device is None:
            selected_device = "Default"
        return {"details": {"model": selected_device, "kname": kname}}
    return {"details": {"model": "Default", "kname": "/"}}


@router.get("/jetpack/info")
async def endpoint_to_fetch_device_info():
    try:
        jetpack_version = get_jetpack_version()
        return {"version": jetpack_version}
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.get("/stats")
async def get_stats():
    try:
        stats = {
            "cpu_usage": helpers.stats.get_cpu_percent(),
            "ram_usage": helpers.stats.get_ram_percent(),
        }
        return stats
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/update")
async def update_services_using_file(file: UploadFile = File(...)):
    try:
        old_file = os.path.join(os.getcwd(), "..", "baseservice", "docker-compose.yml")
        if file.content_type in ["application/x-yaml"]:
            file_path = os.path.join(os.getcwd(), "docker-compose-new.yml")
            with open(file_path, "wb+") as buffer:
                shutil.copyfileobj(file.file, buffer)
        else:
            return JSONResponse(
                content=util_models.DefaultResponseModel(
                    detail="invaild file type"
                ).dict(),
                status_code=400,
            )
        try:
            if os.path.exists(old_file):
                updateprocess.backup_old_file()
            updateprocess.copy_file_to_base()
            if updateprocess.pull_containers():
                updateprocess.update_services()
                sleep(10)
                return "success"
            else:
                return JSONResponse(
                    content=util_models.DefaultResponseModel(
                        detail="failed to update / please upload correct config file"
                    ).dict(),
                    status_code=400,
                )
        except Exception:
            return JSONResponse(
                content=util_models.DefaultResponseModel(
                    detail="failed to update / please upload correct config file"
                ).dict(),
                status_code=400,
            )
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        raise HTTPException(status_code=500)


@router.get("/network/test")
async def endpoint_for_check_for_ip_availability(ip: str):
    if network_manager._check_for_ip(ip):
        return {"detail": {"status": "found"}}
    else:
        return {"detail": {"status": "not found"}}


#     storage_obj = Storage()
#     volume_device_obj = ExternalDevices.objects(Mount_type= 'Volume', Enable=True).first()
#     if volume_device_obj:
#         selected_device = storage_obj.get_drive_model(
#             ''.join(
#                 i for i in volume_device_obj.Device_name.split("/")[-1] if not i.isdigit()
#             )
#         )
#         if selected_device is None: selected_device = "Default"
#         return {"details": selected_device}
#     # storage_obj = Storage()
#     # base_mount = storage_obj.get_default_mointpoint()
#     # console_logger.debug(base_mount)
#     # console_logger.debug(usb_detector.device_list(base_mount))
#     # get_mac_id_using_shell()
#     return {"details": "Default"}


# @router.get("/onvif/discovery", tags=["Onvif"])
# async def endpoint_to_fetch_network_cameras():
#     try:
#         cameraIpList = onvifHandler.discovery()
#         return {"detail": cameraIpList}
#     except Exception as e:
#         console_logger.debug(e)
#         raise HTTPException(status_code=500)


@router.get("/notification/sound")
async def endpoint_to_fetch_notification_sound_settings():
    try:
        soundSettings = SoundSettings.objects.first()
        if soundSettings:
            return {"detail": soundSettings.payload()}
        else:
            raise HTTPException(status_code=404)
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.post("/notification/sound")
async def endpoint_to_post_notification_sound_settings(status: bool):
    try:
        soundSettings = SoundSettings.objects.first()
        if soundSettings:
            soundSettings.notificationSound = status
            soundSettings.save()
        else:
            SoundSettings(notificationSound=status).save()
        return {"detail": "success"}
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.post("/theme/default", tags=["Theme"])
async def endpoint_to_set_deafult_theme_metadata():
    themeMeta = Themes.objects.first()
    if themeMeta:
        themeMeta.delete()
    Themes(**config.THEME_META).save()
    createThemeJson(config.THEME_META)
    shutil.copyfile(
        "{}/..{}".format(os.getcwd(), config.THEME_META["favicon"]),
        os.path.join(os.getcwd(), "..", "frontend", "html", "favicon.ico"),
    )
    return {"detail": "success"}


@router.post("/theme", tags=["Theme"])
async def endpoint_to_upload_theme_metadata(
    label: Optional[str] = Form(None),
    logo_white_theme: UploadFile = File(None),
    logo_black_theme: UploadFile = File(None),
    startup_video: UploadFile = File(None),
    favicon: UploadFile = File(None),
    primary_colour: Optional[str] = Form(None),
    secondary_colour: Optional[str] = Form(None),
    button_colour1: Optional[str] = Form(None),
    button_colour2_primary: Optional[str] = Form(None),
    button_colour2_secondary: Optional[str] = Form(None),
):
    themeMeta = Themes.objects.first()
    if themeMeta:
        metadata = copy.deepcopy(themeMeta.payload())
    else:
        metadata = copy.deepcopy(config.THEME_META)

    if logo_white_theme:
        contents = await logo_white_theme.read()
        file_name = "logo.png"
        with open(
            os.path.join(theme_directory_path, file_name), "wb"
        ) as f:
            f.write(contents)
        metadata["logo_white_theme"] = "/static_server/theme/{}".format(
            file_name
        )

    if logo_black_theme:
        contents = await logo_black_theme.read()
        file_name = "logo_dark.png"
        with open(
            os.path.join(theme_directory_path, file_name), "wb"
        ) as f:
            f.write(contents)
        metadata["logo_black_theme"] = "/static_server/theme/{}".format(
            file_name
        )

    if startup_video:
        if startup_video.filename.find(".mp4") != -1:
            contents = await startup_video.read()
            file_name = "Splash_Screen.mp4"
            with open(
                os.path.join(theme_directory_path, file_name), "wb"
            ) as f:
                f.write(contents)
            metadata["startup_video"] = "/static_server/theme/{}".format(
                file_name
            )
        else:
            raise HTTPException(status_code=400)

    if favicon:
        contents = await favicon.read()
        with open(os.path.join(theme_directory_path, "favicon.ico"), "wb") as f:
            f.write(contents)
        metadata["favicon"] = "/static_server/theme/favicon.ico"

    if label:
        metadata["label"] = label

    if primary_colour:
        metadata["primary_colour"] = primary_colour

    if secondary_colour:
        metadata["secondary_colour"] = secondary_colour

    if button_colour1:
        metadata["button_colour1"] = button_colour1

    if button_colour2_primary:
        metadata["button_colour2_primary"] = button_colour2_primary

    if button_colour2_secondary:
        metadata["button_colour2_secondary"] = button_colour2_secondary

    if themeMeta:
        themeMeta.delete()
    Themes(**metadata).save()
    createThemeJson(metadata)

    if favicon:
        shutil.copyfile(
            os.path.join(theme_directory_path, "favicon.ico"),
            os.path.join(os.getcwd(), "..", "frontend", "html", "favicon.ico"),
        )

    return {"detail": "success"}


@router.get("/theme", tags=["Theme"])
async def endpoint_to_fetch_theme_metadata():
    themeMeta = Themes.objects.first()
    if themeMeta:
        return {"detail": themeMeta.payload()}
    else:
        return {"detail": config.THEME_META}


@router.get("/downloadtheme", tags=["Theme"])
async def download_theme():
    try:
        
        zip_operation.clean_zip()
            
        file_name = zip_operation.zip_files()
        if file_name:
            return {"path": f"/static_server/theme/{file_name}"}
        else:
            raise HTTPException(status_code=404)
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.post("/uploadtheme", tags=["Theme"])
async def upload_theme(zip_file: UploadFile = File(None)):
    try:
        if zip_file:

            zip_operation.clean_files()

            zip_directory = os.path.join(theme_directory_path, zip_file.filename)
            contents = await zip_file.read()

            with open(zip_directory, "wb") as f:
                f.write(contents)

            result = zip_operation.unzip_files(zip_file.filename)
            if result == "failed":
                raise HTTPException(status_code=400)
            elif result == False:
                raise HTTPException(status_code=404)
        

        return {"path": "success"}
    except Exception as e :
        console_logger.debug(e)
        raise HTTPException(status_code=404)


@router.post("/hostlogs")
async def hostlogs(
    since: Optional[int] = 0, until: Optional[int] = 0, tail: Optional[int] = 0
):
    try:
        filter = {"since": since, "until": until, "tail": tail}
        logs = host_logs(**filter)
        return {"detail": logs}
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.get("/network/statistics/speed", tags=["Network Detail"])
async def endpoint_to_network_speed():
    try:
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        future = executor.submit(network_manager._fetchDownloadUploadSpeed)
        future.add_done_callback(network_statistics)
        # await speed_stats()
        return {"details": "success"}
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.get("/network/statistics/latpack", tags=["Network Detail"])
async def endpoint_to_network_details():
    try:
        data = network_manager._collectNetDetails()
        return {"detail": dict(data)}
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/folder")
async def endpoint_to_create_folder(payload: FolderPostIn):
    try:
        static_directory_path = os.path.join(
            os.getcwd(), "..", "static_server", payload.path
        )
        console_logger.debug(static_directory_path)
        if not os.path.exists(static_directory_path):
            os.makedirs(static_directory_path)
        return {"detail": "success"}
    except DoesNotExist:
        raise HTTPException(status_code=400)


# @router.get("/test")
# async def endpoint_to_create_folder():
#     folder_operations.test()


@router.get("/fifo")
async def new_fifo(type: str, days_or_month: int):

    filter = {"type": type, "days_or_month": days_or_month}

    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    future = executor.submit(fifo.main, **filter)
    future.add_done_callback(fifo_socket_url)
    return {"detail": "success"}
