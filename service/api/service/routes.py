from distutils.command.config import config
from sys import stdin
from fastapi import APIRouter, HTTPException, File, Form, UploadFile
from mongoengine.errors import DoesNotExist
from mongoengine.queryset.visitor import Q
from typing import Optional
from fastapi_utils.tasks import repeat_every
import asyncio
import os, subprocess, time
import psutil

from api.service.models import *
from api.service.serializers import *
from api.service.helpers.logs import console_logger
from api.service.helpers.service_matadata_operations import ServiceMetadataOperations
from api.service.helpers.database_operations import DatabaseOperations
from api.service.helpers.service_operator import ServiceOperator
from api.service.helpers.api_operations import APIOperations
from api.service.helpers.docker_operations import DockerServiceHandler
from api.service.helpers.socket_operations import socketOperationsHandler
from api.service.helpers.upload_operations import uploadHandler
from api.service.helpers.general_helpers import send_socket_event,zip_socket_event,unzip_socket_event
from api.service.helpers.zip_operations import ZipConverter
from config import Config
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import threading


router = APIRouter()
serviceOperationsHandler = ServiceOperator()
serviceMetadataOperationsHandler = ServiceMetadataOperations()
databaseOperationsHandler = DatabaseOperations()
apiOperationsHandler = APIOperations()
dockerServiceHandler = DockerServiceHandler()
zipconverter = ZipConverter()
initialized = False
streaming_process = None
live_services = []

async def services_verification():
    asyncio.create_task(asyncio.to_thread(serviceOperationsHandler.CheckValidity), name="taskName")

def getimezone():
    command = ["cat", "/etc/timezone"]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    timezone = process.stdout.readline().rstrip().decode("utf8")
    return timezone

scheduler = AsyncIOScheduler(timezone = getimezone())
scheduler.add_job(services_verification,trigger="cron",hour="00",minute="00",second="01")
scheduler.start()

@router.on_event('startup')
@repeat_every(seconds=60)
async def startup_event():
    global initialized
    if not initialized:
        console_logger.debug("performing startup activity")

        currentVersionInfo = SystemUpdateInfo.objects.first()
        if not currentVersionInfo:
            currentVersionInfo = SystemUpdateInfo(currentVersion=Config.__version__)
            currentVersionInfo.save()

        console_logger.debug(currentVersionInfo.currentVersion)
        console_logger.debug(Config.__version__)    

        if currentVersionInfo.currentVersion != Config.__version__:
            console_logger.debug("inside")
            currentVersionInfo.currentVersion = Config.__version__
            currentVersionInfo.save()
            socketOperationsHandler.sendSocketData("updating system", "None")

        if serviceOperationsHandler.serviceStartupActivity():
            initialized = True
    else:
        console_logger.debug("repeated task")
        serviceOperationsHandler.startActiveServices()
        serviceOperationsHandler.serviceHandlingBasedOnSlots()

@router.get("/startup", status_code=200)
async def endpoint_to_run_startup_activity(accessKey: str):
    taskName = "running startup activity"
    task = asyncio.create_task(asyncio.to_thread(serviceOperationsHandler.serviceStartupActivity,accessKey), name=taskName)
    task.add_done_callback(databaseOperationsHandler.logServiceStatus)

    return {"detail": "success"}


@router.get("/", status_code=200)
async def endpoint_to_fetch_all_services(
        type: Optional[str] = "Usecase",
        status: Optional[str] = None,
        packagedData: bool = False,
        text: Optional[str] = None,
        start_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
        end_timestamp: Optional[datetime.datetime] = datetime.datetime.utcnow().replace(microsecond=0),
        parent_id: Optional[str] = None,
        all: Optional[bool] = False):
    response = []
    args = {
        "serviceType": type,
        "metadata__isLatest": True
    }
    if start_timestamp:
        args["added__gte"] = start_timestamp
    if end_timestamp:
        args["added__lte"] = end_timestamp
    if text:
        args = {
            "serviceName__icontains": text
        }

    if status is not None:
        args["status"] = status

    if all == True and status != None:
        args = {}
        if type:
            args = {
                "serviceType": type,
                "metadata__isLatest": True,
                "__raw__": {"$or": [{"status": status}]}
            }
    elif all:
        args = {}
        if type:
            args = {
                "serviceType": type,
                "metadata__isLatest": True,
                "__raw__": {"$or": [{"status": "inactive"}, {"status": "downloaded"}, {"status": "active"}]}
            }
    if parent_id:
        args["metadata__packagedServiceIds__AI__contains"] = parent_id
        args["metadata__isLatest"] = True
        if "__raw__" in args.keys():
            del args["__raw__"]

    latestServices = []
    oldServices = []

    latestServices = Services.objects(**args).order_by('-added')

    args["metadata__isLatest"] = False

    oldServices = Services.objects(**args).order_by('-added')

    if not any(oldServices) and not any(latestServices):
        raise HTTPException(status_code=404)

    latestServicesNames = []
    for service in latestServices:
        latestServicesNames.append(service.serviceName)
        if packagedData:
            response.append(service.packagedMetadataPayload())
        else:
            response.append(service.payload())

    for service in oldServices:
        if service.serviceName not in latestServicesNames:
            if packagedData:
                response.append(service.packagedMetadataPayload())
            else:
                response.append(service.payload())

    return {"detail": response}


@router.get("/apps", status_code=200)
async def endpoint_to_fetch_all_services():
    response = {}
    args = {
        "serviceType": "AI"
    }

    aiModelServiceNames = []

    services = Services.objects(**args).order_by('-added')

    for service in services:
        if service.serviceName not in aiModelServiceNames:
            usecaseServiceNames = []

            subArgs = {
                "serviceType": "Usecase",
                "metadata__packagedServiceIds__AI__contains": service.serviceId
            }

            response[service.serviceId] = service.payload()
            usecaseServices = Services.objects(**subArgs).order_by('-added')

            if any(usecaseServices):
                usecaseList = []
                for usecase in usecaseServices:
                    if usecase.serviceName not in usecaseServiceNames:
                        usecaseList.append(usecase.payload())
                        usecaseServiceNames.append(usecase.serviceName)

                response[service.serviceId].update({
                    "usecases": usecaseList
                })
            else:
                response[service.serviceId].update({
                    "usecases": []
                })

            aiModelServiceNames.append(service.serviceName)
            

    return {"detail": response}


@router.get("/refresh")
async def endpoint_for_fetching_metadata_of_purchased_services():
    try:
        serviceOperationsHandler.fetchServiceLatestVersions()
        if serviceOperationsHandler.fetchServices():
            
            return {"detail": "success"}
        else:
            raise HTTPException(status_code=500)
    except AttributeError:
        raise HTTPException(status_code=500)


@router.post("/download")
async def endpoint_for_download_the_service(payload: DownloadServicePostIn):
    try:
        args = {
            "serviceName": payload.serviceId,
            "metadata__isLatest": True,
            "status": "purchased"
        }

        serviceObject = Services.objects(**args)

        if not any(serviceObject):
            args["metadata__isLatest"] = False

            serviceObject = Services.objects(**args).order_by('-added')

        if not any(serviceObject):
            raise HTTPException(status_code=404)

        taskName = "downloading service: {}".format(
            serviceObject[0].serviceName)
        task = asyncio.create_task(
            asyncio.to_thread(
                serviceOperationsHandler.downloadService,
                serviceObject[0]
            ),
            name=taskName
        )
        task.add_done_callback(databaseOperationsHandler.logServiceStatus)
        return {"detail": "success"}
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.post("/activate")
async def endpoint_for_activate_the_service(payload: ActivateServicePostIn):
    try:
        services = []
        
        console_logger.debug(payload.dict())
        for service in payload.serviceId:
            # for task in asyncio.all_tasks():
                
            #     if (task.get_name()).find(service) != -1 and (task.get_name()).find("deactivating") != -1 and task.done() == False:
            #         console_logger.debug(task.get_name())
            #         console_logger.debug(task.done())
            #         taskName = task.get_name()
            #         task.cancel()
            #         try:
            #             await task
            #         except asyncio.CancelledError:
            #             console_logger.debug("{} is cancelled".format(taskName))
            #         finally:
            #             pass

            serviceObject = Services.objects(
                serviceName=service,
                **{"metadata__isLatest": True},
                **{"__raw__": {"$or": [{"status": "inactive"}, {"status": "downloaded"}]}}
            )

            if not any(serviceObject):
                serviceObject = Services.objects(
                    serviceName=service,
                    **{"metadata__isLatest": False},
                    **{"__raw__": {"$or": [{"status": "inactive"}, {"status": "downloaded"}]}}
                ).order_by('-added')

            if not any(serviceObject):
                serviceObject = Services.objects(serviceName=service, status="active")
                if any(serviceObject):
                    pass
                else:
                    raise HTTPException(status_code=404)

            services.append(serviceObject[0])

        # console_logger.debug(services)

        # TODO
        console_logger.debug(serviceOperationsHandler.serviceToBeActivated)
        # serviceOperationsHandler.activateService(services)
        taskName = "activating service: "
        for service in services:
            taskName += service.serviceName
            taskName += ","
        
        taskName = taskName[:-1]

        console_logger.debug(taskName)

        task = asyncio.create_task(
            asyncio.to_thread(
                serviceOperationsHandler.activateService,
                services
            ),
            name=taskName
        )
        task.add_done_callback(databaseOperationsHandler.logServiceStatus)
        return {"detail": "success"}
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.post("/deactivate")
async def endpoint_for_dectivate_the_service(payload: DeactivateServicePostIn):
    try:
        console_logger.debug(payload.serviceIds)

        for serviceId in payload.serviceIds:
            serviceObjects = Services.objects(
                serviceName=serviceId,
                # status="active",
                # **{"metadata__isLatest": True}
            ).order_by('-added')

            # if not any(serviceObjects):
            #     serviceObjects = Services.objects(
            #         serviceName=serviceId,
            #         # status="active",
            #         **{"metadata__isLatest": False}
            #     ).order_by('-added')

            if not any(serviceObjects):
                continue

            taskName = "deactivating service: {}".format(
                serviceObjects[0].serviceName)
            console_logger.debug(taskName)

            if serviceObjects[0].serviceType == "AI":
                task = asyncio.create_task(
                    asyncio.to_thread(
                        # serviceOperationsHandler.deactivateContainer,
                        serviceOperationsHandler.deactivateContainerWithNetwork,
                        serviceObjects[0].serviceName.replace(" ", "_")
                    ),
                    name=taskName
                )
                task.add_done_callback(
                    databaseOperationsHandler.logServiceStatus)
            else:
                task = asyncio.create_task(
                    asyncio.to_thread(
                        serviceOperationsHandler.deactivateService,
                        serviceObjects[0].serviceName.replace(" ", "_")
                    ),
                    name=taskName
                )
                task.add_done_callback(
                    databaseOperationsHandler.logServiceStatus)

            for serviceObject in serviceObjects:
                serviceObject.status = "inactive"
                serviceObject.save()

        return {"detail": "success"}
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.post("/update")
async def endpoint_for_updating_the_service(payload: UpdateServicePostIn):
    try:
        serviceObject = Services.objects(
            serviceName=payload.serviceId,
            **{"metadata__isLatest": True},
            **{
                "__raw__":
                    {"$or": [
                        {"status": "inactive"},
                        {"status": "downloaded"},
                        {"status": "active"}
                    ]
                }
            }
        )

        if not any(serviceObject):
            serviceObject = Services.objects(
                serviceName=payload.serviceId,
                **{"metadata__isLatest": False},
                **{"__raw__":
                    {"$or": [
                        {"status": "inactive"},
                        {"status": "downloaded"},
                        {"status": "active"}
                    ]
                    }
                   }
            ).order_by('-added')

        if not any(serviceObject):
            raise HTTPException(status_code=404)
        
        # serviceOperationsHandler.updateService(serviceObject[0])

        taskName = "updating service: {}".format(serviceObject[0].serviceName)
        task = asyncio.create_task(
            asyncio.to_thread(
                serviceOperationsHandler.updateService,
                serviceObject[0]
            ),
            name=taskName
        )
        task.add_done_callback(databaseOperationsHandler.logServiceStatus)
        return {"detail": "success"}
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.post("/uninstall")
async def endpoint_for_uninstalling_the_service(payload: UpdateServicePostIn):
    try:
        console_logger.debug(payload.dict())
        serviceObject = None
        serviceObjects = Services.objects(
            serviceName=payload.serviceId
        ).order_by('-added')

        for serviceObject in serviceObjects:
            console_logger.debug(serviceObject.status)
            if serviceObject.status == "active":
                raise HTTPException(status_code=403)

        if serviceObject:
            # console_logger.debug(serviceOperationsHandler.uninstallService(serviceObjects))
            taskName = "uninstall service: {}".format(
                serviceObject.serviceName)
            task = asyncio.create_task(
                asyncio.to_thread(
                    serviceOperationsHandler.uninstallService,
                    serviceObjects
                ),
                name=taskName
            )
            task.add_done_callback(databaseOperationsHandler.logServiceStatus)
            return {"detail": "success"}
        else:
            raise HTTPException(status_code=404)
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.get('/health')
def service_health():
    return {"detail": "success"}


@router.post('/settings')
def endpoint_to_fetch_service_settings(payload: ServiceSettingsPostIn):
    serviceObject = Services.objects(
        serviceName=payload.serviceId,
        **{"metadata__isLatest": True}
    )

    if not any(serviceObject):
        serviceObject = Services.objects(
            serviceName=payload.serviceId,
            **{"metadata__isLatest": False}
        ).order_by('-added')

    if not any(serviceObject):
        raise HTTPException(status_code=404)

    return {"detail": serviceObject[0].metadata["settingsParameters"]}


@router.get('/system/update')
async def endpoint_to_check_for_system_update():
    try:
        _, response = apiOperationsHandler.fetchLatestOSVersion()
        if serviceOperationsHandler.checkForSystemUpdate(response["detail"][0]):
            return {"detail": "success"}
        else:
            raise HTTPException(status_code=404)
    except:
        raise HTTPException(status_code=404)


@router.post('/system/update')
async def endpoint_to_update_the_system():
    # try:
        _, response = apiOperationsHandler.fetchLatestOSVersion()
        # serviceOperationsHandler.updateSystem(response["detail"][0])
        taskName = "updating system"
        task = asyncio.create_task(
            asyncio.to_thread(
                serviceOperationsHandler.updateSystem,
                response["detail"][0]
            ),
            name=taskName
        )
        task.add_done_callback(databaseOperationsHandler.logServiceStatus)
        return {"detail": "success"}
    # except Exception as e:
    #     console_logger.debug(e)
    #     raise HTTPException(status_code=404)


@router.post('/system/update/schedule')
async def endpoint_to_schedule_update_the_system(payload: SystemUpdateSchedPostIn):
    try:
        console_logger.debug(payload.time)
        SystemUpdateTime.objects().update_one(
            set__time=payload.time,
            set__auto_update=payload.auto_update,
            upsert=True
        )
        # taskName = "updating system"
        # task = asyncio.create_task(
        #     asyncio.to_thread(
        #         serviceOperationsHandler.updateService,
        #         serviceObject[0]
        #     ),
        #     name=taskName
        # )
        # task.add_done_callback(databaseOperationsHandler.logServiceStatus)
        return {"detail": "success"}
    except:
        raise HTTPException(status_code=404)


@router.get('/system/update/schedule')
async def endpoint_to_fetch_schedule_update_details():
    try:
        systemUpdateInfo = SystemUpdateTime.objects.first()
        return {"detail": systemUpdateInfo.payload()}
    except:
        raise HTTPException(status_code=404)


@router.get('/system/version')
async def endpoint_to_fetch_system_versions_details():
    try:
        avilableVersion = None
        apiOperationsHandler.baseApiCall()
        statusCode, response = apiOperationsHandler.fetchLatestOSVersion()
        if statusCode == 200:
            for service in response["detail"]:
                avilableVersion = service["version"]
                break

        data = {
            "current_version": apiOperationsHandler.softwareVersion,
            "available_version": avilableVersion
        }

        return {"detail": data}
    except:
        raise HTTPException(status_code=404)


@router.get('/system/inspect')
async def endpoint_to_inspect_system_versions_details():
    try:
        response = dockerServiceHandler.inspect_service("rdx_camera")
       
        return response
    except:
        raise HTTPException(status_code=404)

@router.get('/update/envs')
async def endpoint_to_update_environment_variable(ip: str):
    try:
        # serviceOperationsHandler.updateServiceEnvVeriables()
        taskName = "updating environment"
        task = asyncio.create_task(
            asyncio.to_thread(
                serviceOperationsHandler.updateServiceEnvVeriables,
                ip
            ),
            name=taskName
        )
        task.add_done_callback(databaseOperationsHandler.logServiceStatus)
        return {"status": "success"}
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)

@router.get('/tasks')
async def endpoint_to_fetch_tasks():
    try:
        # serviceOperationsHandler.updateServiceEnvVeriables()
        for task in asyncio.all_tasks():
            console_logger.debug(task.get_name())
            console_logger.debug(task.done())
        return {"status": "success"}
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)

@router.get("/logs", tags=["logs"])
async def endpoint_to_fetch_logs(since: Optional[int] = 0, until: Optional[int] = 0, tail: Optional[int] = None):
    try:
        filter = {
            "since": since,
            "until": until,
            "tail": tail
        }
        taskName = "download_zipfile"
        task = asyncio.create_task(asyncio.to_thread(serviceOperationsHandler.fetchContainerLogs,**filter), name=taskName)
        task.add_done_callback(send_socket_event)
        return {"detail": "success"}

    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)

@router.post("/upload/ai", tags=["upload"])
async def endpoint_to_upload_model_zip(
        zip: UploadFile = File(...), 
        serviceId: str = Form(...)
    ):
    try:
        serviceObject = Services.objects.get(serviceId=serviceId)
        if zip.filename.find(".zip") != -1:
            await uploadHandler.aiModelUploader(zip, serviceObject.serviceName)
            return {"detail": "success"}
        else:
            raise HTTPException(status_code=400)
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.get("/live/start", tags=["live"])
async def endpoint_to_start_live_feed(serviceId: str, link: str):
    global streaming_process, live_services   
    live_directory = os.path.join(os.getcwd(), "static_server", "live", serviceId)
    # if live_directory
    # live_services.append

    os.makedirs(live_directory, exist_ok=True)
    os.system(f"rm -rf {live_directory}/*")

    link = "rtsp://{}{}".format(serviceMetadataOperationsHandler.host, link)

    for proc in psutil.process_iter(attrs=['pid', 'name']):
        console_logger.debug(proc.info['name'])
        if proc.info['name'] == "ffmpeg" or proc.info['name'] == "sh":
            proc.kill()
    # if streaming_process:
    #     try:
    #         streaming_process.communicate(str.encode("q"))
    #         time.sleep(3)
    #         streaming_process.terminate()
    #     except ValueError:
    #         pass

    command = f"ffmpeg -r 25 -rtsp_transport tcp \
        -use_wallclock_as_timestamps 1 -i '{link}'\
        -vcodec copy -f hls -hls_flags delete_segments+append_list \
        -f segment -segment_list_flags live -segment_time 0.5 \
        -segment_list_size 1 -segment_wrap 10 \
        -segment_format mpegts -segment_list \
        {live_directory}/index.m3u8 -segment_list_type m3u8 -segment_list_entry_prefix ./ {live_directory}/%3d.ts"

    streaming_process = subprocess.Popen(command, shell=True, stdin=subprocess.PIPE)
    while not os.path.exists:
        time.sleep(2)
    return {"link":f"{Config.STATICFILESERVER}live/{serviceId}/index.m3u8"}

@router.delete("/live/stop", tags=["live"])
async def endpoint_to_stop_live_feed():
    for proc in psutil.process_iter(attrs=['pid', 'name']):
        # console_logger.debug(proc.info['name'])
        if proc.info['name'] == "ffmpeg" or proc.info['name'] == "sh":
            proc.kill()
    # global streaming_process
    # if streaming_process:
    #     streaming_process.communicate(str.encode("q"))
    #     time.sleep(3)
    #     streaming_process.terminate()
    return "success"

@router.post("/add",tags=["zip/unzip"])
async def create_zip_inside_serviceidfolder(serviceId: Optional[str] = "", type: Optional[str] = "",  zip_file: UploadFile = File(None)):
    try:
        serviceObject = Services.objects.get(serviceId=serviceId)
        details = {"serviceId": serviceObject.serviceId, "serviceName": serviceObject.serviceName, "type": type, "zip_file": zip_file.filename}
        if zip_file:
            zip_directory = os.path.join(os.getcwd(),zip_file.filename)
            contents = await zip_file.read()
            with open(zip_directory, "wb") as f:
                f.write(contents)
            
            taskName = "create_zip"
            task = asyncio.create_task(asyncio.to_thread(serviceOperationsHandler.ZipServices,**details), name=taskName)
            task.add_done_callback(zip_socket_event)

            return {"detail":'success'}
        else:
            return {"detail":"file not found"}

    except DoesNotExist:
        raise HTTPException(status_code=404)

@router.post("/default",tags=["zip/unzip"])
async def unzip_file_inside_serviceidfolder(serviceId: Optional[str] = "", type: Optional[str] = ""):
    try:
        serviceObject = Services.objects.get(serviceId=serviceId)
        details = {"serviceId": serviceId, "serviceName": serviceObject.serviceName, "type": type}
        taskName = "unzip_file"
        task = asyncio.create_task(asyncio.to_thread(serviceOperationsHandler.UnzipServices,**details), name=taskName)
        task.add_done_callback(unzip_socket_event)
        return {"detail":'success'}
    except Exception as e:
        console_logger.debug(e)
        raise HTTPException(status_code=500)


@router.post("/container/with_nw", tags=["test"])
async def endpoint_to_test_container_with_network():
    try:
        serviceObject = Services.objects.get(serviceName="person_detector")
        console_logger.debug(serviceObject)
        serviceOperationsHandler.activateContainerWithNetwork(serviceObject)
        return {"detail": "success"}
    except DoesNotExist:
        raise HTTPException(status_code=404)


@router.get("/live/details", tags=["live"])
async def endpoint_to_fetch_rtsp_details(serviceId: str):
    try:
        serviceObject = Services.objects.get(serviceId=serviceId, status="active")
        link = serviceOperationsHandler.returnContainerLiveViewLink(serviceObject.serviceName)
        return {"detail": link}
    except DoesNotExist:
        raise HTTPException(status_code=404)

        
@router.post("/download/all")
async def dowloadAllApps():
    try:
        args = {
            "metadata__isLatest": True,
            "status": "purchased"
        }
        
        serviceObject = Services.objects(**args)
        
        if not any(serviceObject):
            args["metadata__isLatest"] = False
            serviceObject = Services.objects(**args).order_by('-added')
            
        if not any(serviceObject):
            raise HTTPException(status_code=404)
        
        task = asyncio.create_task(asyncio.to_thread(serviceOperationsHandler.downloadAll,serviceObject), name='download_apps')
        task.add_done_callback(databaseOperationsHandler.logServiceStatus)
        
        return {"detail":'success'}
    except DoesNotExist:
        raise HTTPException(status_code=404)
    
@router.post("/upload/all")
async def updateAllApps():
    try:
        serviceObject = Services.objects(
            **{"metadata__isLatest": True},
            **{"__raw__":
                {"$or": [
                    {"status": "inactive"},
                    {"status": "downloaded"},
                    {"status": "active"}
                ]
                }
            }
        )

        if not any(serviceObject):
            serviceObject = Services.objects(
                **{"metadata__isLatest": False},
                **{"__raw__":
                    {"$or": [
                        {"status": "inactive"},
                        {"status": "downloaded"},
                        {"status": "active"}
                    ]
                    }
                }
            ).order_by('-added')

        if not any(serviceObject):
            raise HTTPException(status_code=404)
        
        task = asyncio.create_task(asyncio.to_thread(serviceOperationsHandler.updateAll,serviceObject), name='update_apps')
        task.add_done_callback(databaseOperationsHandler.logServiceStatus)
            
        return {"detail":'success'}
    except DoesNotExist:
        raise HTTPException(status_code=404)

@router.get("/validity")
async def check_service_validity():
    taskName = "validation checking"
    asyncio.create_task(asyncio.to_thread(serviceOperationsHandler.CheckValidity), name=taskName)

    return {"detail":'success'}

