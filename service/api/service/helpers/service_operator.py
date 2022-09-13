import json
import time
import requests
import shutil
import os
import copy
import asyncio
import datetime

from api.service.helpers.logs import console_logger
from api.service.helpers.docker_operations import *
from api.service.helpers.database_operations import DatabaseOperations
from api.service.helpers.api_operations import APIOperations
from api.service.helpers.service_matadata_operations import ServiceMetadataOperations
from api.service.helpers.zip_operations import zip_converter
from api.service.helpers.socket_operations import SocketOperations
from api.service.helpers.zip_operations import ZipConverter

from api.service.models import *

dockerImageHandler = DockerImageHandler()
dockerServiceHandler = DockerServiceHandler()
dockerContainerHandler = DockerContainerHandler()
dockerTaskHandler = DockerTaskHandler()
dockerNetworkHandler = DockerNetworkHandler()
databaseOperationsHandler = DatabaseOperations()
serviceMetadataOperationsHandler = ServiceMetadataOperations()
apiOperationHandler = APIOperations()
socketOperationsHandler = SocketOperations()
zipconverter = ZipConverter()


class ServiceOperator:
    def __init__(self) -> None:
        self.serviceTypes = [
            "AI",
            "Database",
            "Base",
            "Usecase",
            "Firmware",
            "Analytics",
        ]
        self.iconsFolder = os.path.join(os.getcwd(), "static_server")
        self.timeout = 60
        self.serviceToBeActivated = []

    def fetchServices(self):
        rawMetadata = (
            serviceMetadataOperationsHandler.fetchRawMetadataOfAssignedServices()
        )
        finalMetadata = serviceMetadataOperationsHandler.convertRawMetadataToFinalData(
            rawMetadata
        )
        return databaseOperationsHandler.addMetadataToDB(finalMetadata)

    def fetchServiceLatestVersions(self):
        dbInstances = databaseOperationsHandler.fetchServiceObject(
            **{"serviceType": "Usecase"}
        )
        for service in dbInstances:
            metadata = serviceMetadataOperationsHandler.fetchLatestServiceMetadata(
                service.serviceId
            )
            if len(metadata):
                if metadata[-1]["version"] != service.installedVersion:
                    service.availableVersion = metadata[-1]["version"]
                    service.save()

    def serviceStartupActivity(self, accessKey=None):
        console_logger.debug("serviceStartupActivity")
        if apiOperationHandler.baseApiCall():
            statusCode, response = apiOperationHandler.fetchCurrentOSDetails(
                apiOperationHandler.softwareVersion
            )
            console_logger.debug(response)
            if (
                statusCode == 200 and apiOperationHandler.accessKey
            ) or accessKey is not None:
                for service in response["detail"]:
                    metadataList = []

                    for serviceMetadata in service["services"]:
                        _, metadata = apiOperationHandler.fetchBaseServiceMetadata(
                            serviceMetadata["serviceId"], accessKey=accessKey
                        )
                        metadataList.append(metadata["detail"][0])

                    metadataList = (
                        serviceMetadataOperationsHandler.convertRawMetadataToFinalData(
                            metadataList
                        )
                    )
                    databaseOperationsHandler.addBaseMetadataToDB(metadataList)
            else:
                return False

            self.downloadStuckedServices()
            self.startActiveServices()
            self.fetchServiceLatestVersions()
            return True
        else:
            return False

    def downloadStuckedServices(self):
        stuckedServices = databaseOperationsHandler.fetchServiceObject(
            **{"status": "downloading"}
        )
        console_logger.debug(stuckedServices)
        if any(stuckedServices):
            for service in stuckedServices:
                self.downloadService(service)

    def startActiveServices(self):
        services = []
        activeServices = databaseOperationsHandler.fetchServiceObject(
            **{"status": "active"}
        )
        if any(activeServices):
            for service in activeServices:
                if service["serviceType"] != "AI":
                    runnningServiceMetadata = dockerServiceHandler.inspect_service(
                        service["serviceName"]
                    )
                    if "message" in runnningServiceMetadata.keys():
                        services.append(service)
                elif service["serviceType"] == "AI":
                    self.activateContainer(service)

            if any(services):
                self.activateService(services)

    def serviceHandlingBasedOnSlots(self):
        servicesToBeActivated = []
        servicesToBeDeactivated = []

        statusCode, response = apiOperationHandler.fetchCurrentSlotsData()

        # stopping running containers which are supposed to be stopped
        for inactiveAiService in databaseOperationsHandler.fetchServiceObject(
            **{"status": "inactive", "serviceType": "AI"}
        ):
            runningContainerMatadata = dockerContainerHandler.fetch_containers(
                type=["running", "restarting", "paused"]
            )

            if (
                inactiveAiService.serviceName.replace(" ", "_")
                in runningContainerMatadata.keys()
                and inactiveAiService.serviceName.replace(" ", "_")
                not in servicesToBeDeactivated
                and inactiveAiService.serviceName.replace(" ", "_")
                not in response["ai"]
            ):

                # self.deactivateContainer(
                self.deactivateContainerWithNetwork(
                    inactiveAiService.serviceName.replace(" ", "_")
                )
                if (
                    inactiveAiService.serviceName.replace(" ", "_")
                    in self.serviceToBeActivated
                ):
                    self.serviceToBeActivated.remove(
                        inactiveAiService.serviceName.replace(" ", "_")
                    )

                servicesToBeDeactivated.append(
                    inactiveAiService.serviceName.replace(" ", "_")
                )

        for inactiveUsecaseService in databaseOperationsHandler.fetchServiceObject(
            **{"status": "inactive", "serviceType": "Usecase"}
        ):
            runningContainerMatadata = dockerContainerHandler.fetch_containers(
                **{
                    "container_name": inactiveUsecaseService.serviceName.replace(
                        " ", "_"
                    )
                }
            )
            if (
                len(runningContainerMatadata.keys())
                and inactiveUsecaseService.serviceName.replace(" ", "_")
                not in servicesToBeDeactivated
                and inactiveUsecaseService.serviceName.replace(" ", "_")
                not in response["usecases"]
            ):

                self.deactivateService(
                    inactiveUsecaseService.serviceName.replace(" ", "_")
                )

                servicesToBeDeactivated.append(
                    inactiveUsecaseService.serviceName.replace(" ", "_")
                )

        # console_logger.debug(servicesToBeDeactivated)

        # if statusCode == 200:
        #     if "usecases" in response:
        #     #     for serviceName in response["usecases"]:
        #     #         serviceDetails = dockerServiceHandler.fetch_service_details(serviceName, **{"status": True})
        #     #         # console_logger.debug(serviceDetails)
        #     #         if isinstance(serviceDetails, list) and len(serviceDetails) == 0:
        #     #             dbObject = databaseOperationsHandler.fetchServiceObject(serviceName=serviceName)
        #     #             servicesToBeActivated.append(dbObject)
        #     #             databaseOperationsHandler.updateServiceObject(dbObject.serviceId, **{"status": "active"})

        #         for service in databaseOperationsHandler.fetchServiceObject(**{"status": "active", "serviceType": "Usecase"}):
        #             if service.serviceName.replace(" ", "_") not in response["usecases"]:
        #                 self.deactivateService(service.serviceName.replace(" ", "_"))
        #                 databaseOperationsHandler.updateServiceObject(service.serviceId, **{"status": "inactive"})

        #         # if any(servicesToBeActivated):
        #         #     self.activateService(servicesToBeActivated)

        #     # if "ai" in response:
        #     #     for serviceName in response["ai"]:
        #     #         dbObject = databaseOperationsHandler.fetchServiceObject(serviceName=serviceName)
        #     #         databaseOperationsHandler.updateServiceObject(dbObject[0].serviceId, **{"status": "active"})
        #     #         self.activateContainer(dbObject[0])

    def downloadServiceIcon(self, serviceId: str, url: str) -> bool:
        try:
            console_logger.debug(url)
            response = requests.get(url, timeout=10)
            imageName = os.path.join(self.iconsFolder, serviceId, "icon.jpg")

            if not os.path.exists(os.path.join(self.iconsFolder, serviceId)):
                os.makedirs(os.path.join(self.iconsFolder, serviceId))

            with open(imageName, "wb") as f:
                f.write(response.content)

            return os.path.join("/", "static_server", serviceId, "icon.jpg")
        except Exception as e:
            console_logger.debug(e)
            return None

    def removeServiceFolder(self, serviceId: str) -> bool:
        try:
            if os.path.exists(os.path.join(self.iconsFolder, serviceId)):
                shutil.rmtree(os.path.join(self.iconsFolder, serviceId))
            return True
        except OSError as e:
            console_logger.debug(e)
            return False

    def downloadServiceImageAndIcon(self, serviceObject: object) -> bool:
        try:
            console_logger.debug(
                "downloading service: {}".format(serviceObject.serviceName)
            )
            serviceImage = serviceObject.metadata["dockerParameters"]["TaskTemplate"][
                "ContainerSpec"
            ]["Image"]
            console_logger.debug(serviceImage)
            if not dockerImageHandler.create_image(serviceImage):
                console_logger.debug("image download error: {}".format(serviceImage))
                # if not dockerServiceHandler.inspect_service(serviceObject.serviceName.replace(" ", "_")):
                databaseOperationsHandler.updateServiceObject(
                    serviceObject.serviceId, **{"status": "purchased"}
                )

                return False

            if "icon" in serviceObject.metadata and serviceObject.metadata["icon"]:
                iconPath = self.downloadServiceIcon(
                    str(serviceObject.serviceId), serviceObject.metadata["icon"]
                )
                if iconPath is not None:
                    databaseOperationsHandler.updateServiceObjectMetadata(
                        serviceObject, **{"icon": iconPath}
                    )

            if not databaseOperationsHandler.updateServiceObject(
                serviceObject.serviceId, **{"status": "downloaded"}
            ):
                return False

            return True
        except Exception as e:
            console_logger.debug(e)
            return False

    def downloadService(self, serviceInstanceObject: object) -> bool:
        try:
            if not databaseOperationsHandler.updateServiceObject(
                serviceInstanceObject.serviceId, **{"status": "downloading"}
            ):
                return False

            for type in self.serviceTypes:
                for serviceId in serviceInstanceObject.metadata["packagedServiceIds"][
                    type
                ]:

                    serviceObject = databaseOperationsHandler.fetchServiceObject(
                        serviceId=serviceId
                    )

                    if serviceObject is None:
                        return False

                    if serviceObject.status == "purchased":
                        if not databaseOperationsHandler.updateServiceObject(
                            serviceObject.serviceId, **{"status": "downloading"}
                        ):
                            databaseOperationsHandler.updateServiceObject(
                                serviceObject.serviceId, **{"status": "purchased"}
                            )
                            databaseOperationsHandler.updateServiceObject(
                                serviceInstanceObject.serviceId,
                                **{"status": "purchased"},
                            )
                            return False

                        if not self.downloadServiceImageAndIcon(serviceObject):
                            databaseOperationsHandler.updateServiceObject(
                                serviceObject.serviceId, **{"status": "purchased"}
                            )
                            databaseOperationsHandler.updateServiceObject(
                                serviceInstanceObject.serviceId,
                                **{"status": "purchased"},
                            )
                            return False

            if not self.downloadServiceImageAndIcon(serviceInstanceObject):
                databaseOperationsHandler.updateServiceObject(
                    serviceInstanceObject.serviceId, **{"status": "purchased"}
                )
                return False
            return True
        except Exception as e:
            console_logger.debug(e)
            databaseOperationsHandler.updateServiceObject(
                serviceInstanceObject.serviceId, **{"status": "purchased"}
            )
            return False

    def activateContainer(self, serviceInstanceObject: object):
        containerName = serviceInstanceObject.serviceName.replace(" ", "_")
        containerDetails = dockerContainerHandler.fetch_containers(
            all=False, **{"container_name": containerName}
        )

        if any(containerDetails):
            return True

        serviceDockerMetadata = serviceInstanceObject.metadata["dockerParameters"]
        updatedMetadata = serviceMetadataOperationsHandler.convertDoubleToInt(
            serviceDockerMetadata
        )
        finalMetadata = serviceMetadataOperationsHandler.updateContainerMetadata(
            containerName, updatedMetadata
        )
        containerId = dockerContainerHandler.create_container(
            containerName, finalMetadata
        )

        if containerId:
            status = dockerContainerHandler.start_container(containerId, containerName=containerName)
            return status

        return False

    def createUserForDatabase(self, dbServiceName, databaseName):
        status = dockerTaskHandler.fetch_task_status(dbServiceName)
        console_logger.debug(status)

        if status in ["shutdown", "failed", "complete"]:
            serviceInspectData = dockerServiceHandler.inspect_service(dbServiceName)
            console_logger.debug(serviceInspectData)

        else:
            while status not in ["running", "complete"] and self.timeout > 0:
                status = dockerTaskHandler.fetch_task_status(dbServiceName)
                time.sleep(30)
                console_logger.debug("checking for service")
                self.timeout -= 1

            # if status in ["running", "complete"]:
            #     time.sleep(5)
        console_logger.debug("service started")

        container_info = dockerContainerHandler.fetch_containers(
            **{"container_name": dbServiceName}
        )
        console_logger.debug(container_info)
        console_logger.debug(databaseName)
        dockerContainerHandler.execute_command(
            container_info[dbServiceName]["id"],
            "mongo {} mongo.js".format(databaseName),
        )
        time.sleep(1)

        self.timeout = 60
        return True

    def removeUserFromDatabase(self, serviceName, databaseName):
        container_info = dockerContainerHandler.fetch_containers(
            **{"container_name": serviceName}
        )
        dockerContainerHandler.execute_command(
            container_info[serviceName]["id"], "mongo {} mongo.js".format(databaseName)
        )

    def activateService(self, serviceInstanceObjects: list):
        # time.sleep(60)
        servicesList = []

        for serviceInstanceObject in serviceInstanceObjects:
            console_logger.debug(self.serviceToBeActivated)
            console_logger.debug(serviceInstanceObject.serviceName)
            if serviceInstanceObject.serviceName not in self.serviceToBeActivated:
                self.serviceToBeActivated.append(serviceInstanceObject.serviceName)
                servicesList.append(serviceInstanceObject.serviceName)

                if "message" in dockerServiceHandler.inspect_service(
                    serviceInstanceObject.serviceName
                ):
                    serviceDockerMetadata = serviceInstanceObject.metadata[
                        "dockerParameters"
                    ]
                    updatedMetadata = (
                        serviceMetadataOperationsHandler.convertDoubleToInt(
                            serviceDockerMetadata
                        )
                    )
                    finalMetadata = (
                        serviceMetadataOperationsHandler.updateServiceMetadata(
                            updatedMetadata
                        )
                    )
                    parentAIids = []

                    dependentServices = serviceInstanceObject.metadata[
                        "packagedServiceIds"
                    ]
                    for type in self.serviceTypes:
                        for serviceId in dependentServices[type]:
                            serviceObject = (
                                databaseOperationsHandler.fetchServiceObject(
                                    serviceId=serviceId,
                                    **{
                                        "__raw__": {
                                            "$or": [
                                                {"status": "inactive"},
                                                {"status": "downloaded"},
                                            ]
                                        }
                                    },
                                )
                            )

                            if serviceObject:
                                console_logger.debug(
                                    "activating : {}".format(serviceObject.serviceName)
                                )
                                dependentServiceDockerMetadata = serviceObject.metadata[
                                    "dockerParameters"
                                ]
                                dependentUpdatedMetadata = (
                                    serviceMetadataOperationsHandler.convertDoubleToInt(
                                        dependentServiceDockerMetadata
                                    )
                                )
                                dependentFinalMetadata = serviceMetadataOperationsHandler.updateServiceMetadata(
                                    dependentUpdatedMetadata
                                )

                                if serviceObject.serviceType == "Database":
                                    if dockerServiceHandler.create_service(
                                        dependentFinalMetadata
                                    ):
                                        databaseOperationsHandler.updateServiceObject(
                                            serviceObject.serviceId,
                                            **{"status": "active"},
                                        )

                                    if (
                                        "username"
                                        not in serviceInstanceObject.metadata[
                                            "databaseParameters"
                                        ]
                                    ):
                                        dictionary = serviceMetadataOperationsHandler.databaseServiceConfig(
                                            serviceInstanceObject.serviceName,
                                            serviceInstanceObject.metadata[
                                                "databaseParameters"
                                            ]["databaseName"],
                                            serviceObject,
                                        )
                                        databaseOperationsHandler.mongo_add_db_config_generator(
                                            **dictionary
                                        )
                                        serviceInstanceObject.metadata[
                                            "databaseParameters"
                                        ].update(**dictionary)

                                        if self.createUserForDatabase(
                                            serviceObject.serviceName,
                                            serviceInstanceObject.metadata[
                                                "databaseParameters"
                                            ]["databaseName"],
                                        ):

                                            serviceInstanceObject.save()

                                elif serviceObject.serviceType == "AI":
                                    self.serviceToBeActivated.append(
                                        serviceObject.serviceName.replace(" ", "_")
                                    )
                                    parentAIids.append(
                                        serviceObject.serviceName.replace(" ", "_")
                                    )

                                    # if self.activateContainer(serviceObject):
                                    if self.activateContainerWithNetwork(serviceObject):
                                        databaseOperationsHandler.updateServiceObject(
                                            serviceObject.serviceId,
                                            **{"status": "active"},
                                        )
                                        self.serviceToBeActivated.remove(
                                            serviceObject.serviceName.replace(" ", "_")
                                        )

                                else:
                                    if dockerServiceHandler.create_service(
                                        dependentFinalMetadata
                                    ):
                                        databaseOperationsHandler.updateServiceObject(
                                            serviceObject.serviceId,
                                            **{"status": "active"},
                                        )
                            else:
                                serviceObject = (
                                    databaseOperationsHandler.fetchServiceObject(
                                        serviceId=serviceId, status="active"
                                    )
                                )

                                if serviceObject.serviceType == "Database":

                                    if (
                                        "username"
                                        not in serviceInstanceObject.metadata[
                                            "databaseParameters"
                                        ]
                                    ):
                                        dictionary = serviceMetadataOperationsHandler.databaseServiceConfig(
                                            serviceInstanceObject.serviceName,
                                            serviceInstanceObject.metadata[
                                                "databaseParameters"
                                            ]["databaseName"],
                                            serviceObject,
                                        )

                                        databaseOperationsHandler.mongo_add_db_config_generator(
                                            **dictionary
                                        )
                                        serviceInstanceObject.metadata[
                                            "databaseParameters"
                                        ].update(**dictionary)

                                        if self.createUserForDatabase(
                                            serviceObject.serviceName,
                                            serviceInstanceObject.metadata[
                                                "databaseParameters"
                                            ]["databaseName"],
                                        ):

                                            serviceInstanceObject.save()

                                elif serviceObject.serviceType == "AI":
                                    self.serviceToBeActivated.append(
                                        serviceObject.serviceName.replace(" ", "_")
                                    )
                                    parentAIids.append(
                                        serviceObject.serviceName.replace(" ", "_")
                                    )
                                    # if self.activateContainer(serviceObject):
                                    if self.activateContainerWithNetwork(serviceObject):
                                        databaseOperationsHandler.updateServiceObject(
                                            serviceObject.serviceId,
                                            **{"status": "active"},
                                        )
                                        self.serviceToBeActivated.remove(
                                            serviceObject.serviceName.replace(" ", "_")
                                        )

                    if serviceInstanceObject.serviceType not in ["Database", "AI"]:
                        finalMetadata["TaskTemplate"]["ContainerSpec"]["Env"].extend(
                            [
                                "PARENTS_IDS={}".format(parentAIids),
                                "USERNAME={}".format(
                                    serviceInstanceObject.metadata[
                                        "databaseParameters"
                                    ]["username"]
                                ),
                                "PASSWORD={}".format(
                                    serviceInstanceObject.metadata[
                                        "databaseParameters"
                                    ]["password"]
                                ),
                                "HOST={}".format(
                                    serviceInstanceObject.metadata[
                                        "databaseParameters"
                                    ]["Host"]
                                ),
                                "DB_PORT={}".format(
                                    serviceInstanceObject.metadata[
                                        "databaseParameters"
                                    ]["Port"]
                                ),
                            ]
                        )
                    if serviceInstanceObject.serviceType not in [
                        "AI"
                    ] and dockerServiceHandler.create_service(finalMetadata):
                        databaseOperationsHandler.updateServiceObject(
                            serviceInstanceObject.serviceId, **{"status": "active"}
                        )

                    self.serviceToBeActivated.remove(serviceInstanceObject.serviceName)

                for service in servicesList:
                    if service in self.serviceToBeActivated:
                        self.serviceToBeActivated.remove(service)

            else:
                console_logger.debug(
                    "already in pipeline: {}".format(self.serviceToBeActivated)
                )
        self.serviceHandlingBasedOnSlots()
        return True

    def deactivateService(self, serviceName: str):
        while serviceName in self.serviceToBeActivated:
            time.sleep(10)
        dockerServiceHandler.remove_service(serviceName)
        self.serviceHandlingBasedOnSlots()

    def deactivateContainer(self, serviceName: str):
        while serviceName in self.serviceToBeActivated:
            time.sleep(10)
        dockerContainerHandler.stop_container(serviceName)

    def downloadMetadataAndImages(self, serviceObject):
        finalMetadata = {}
        metadata = serviceMetadataOperationsHandler.fetchLatestServiceMetadata(
            serviceObject.serviceId
        )

        if len(metadata):
            if metadata[-1]["version"] != serviceObject.installedVersion:
                serviceMetadataToBeAdded = []
                for service in metadata:
                    dbObject = databaseOperationsHandler.fetchServiceObject(
                        serviceName=service["serviceName"].replace(" ", "_"),
                        **{"metadata__isLatest": True},
                    )

                    if not any(dbObject):
                        dbObject = databaseOperationsHandler.fetchServiceObject(
                            serviceName=service["serviceName"].replace(" ", "_"),
                            **{"metadata__isLatest": False},
                        )

                    if (
                        len(dbObject)
                        and list(dbObject)[-1].installedVersion != service["version"]
                    ):
                        tempDict = copy.deepcopy(service)
                        tempDict["validity"] = serviceObject.validity
                        tempDict["metadata"][
                            "databaseParameters"
                        ] = serviceObject.metadata["databaseParameters"]
                        tempDict["metadata"]["dockerParameters"]["TaskTemplate"][
                            "ContainerSpec"
                        ]["Env"] = copy.deepcopy(
                            serviceObject.metadata["dockerParameters"]["TaskTemplate"][
                                "ContainerSpec"
                            ]["Env"]
                        )
                        serviceMetadataToBeAdded.append(tempDict)

                finalMetadata = (
                    serviceMetadataOperationsHandler.convertRawMetadataToFinalData(
                        serviceMetadataToBeAdded
                    )
                )

                console_logger.debug(finalMetadata)
                if not databaseOperationsHandler.addMetadataToDB(finalMetadata):
                    return False

                for service in finalMetadata:
                    console_logger.debug("downloading service")
                    if not self.downloadService(
                        databaseOperationsHandler.fetchServiceObject(
                            serviceId=service["serviceId"]
                        )
                    ):
                        databaseOperationsHandler.deleteDocument(service["serviceId"])
                        return False

                serviceObject.availableVersion = metadata[-1]["version"]
                serviceObject.save()

        return finalMetadata

    def updateService(self, serviceInstanceObject: object):
        try:
            serviceMetadata = self.downloadMetadataAndImages(serviceInstanceObject)
            if isinstance(serviceMetadata, list):
                for service in serviceMetadata:
                    runnningServiceMetadata = dockerServiceHandler.inspect_service(
                        service["serviceName"]
                    )

                    if "message" not in runnningServiceMetadata.keys():
                        serviceVersion = dockerServiceHandler.fetch_service_version(
                            service["serviceName"].replace(" ", "_")
                        )

                        runningServiceEnvs = runnningServiceMetadata["Spec"][
                            "TaskTemplate"
                        ]["ContainerSpec"]["Env"]
                        runningServiceEnvs.extend(
                            service["metadata"]["dockerParameters"]["TaskTemplate"][
                                "ContainerSpec"
                            ]["Env"]
                        )
                        uniqueServiceEnvs = list(set(runningServiceEnvs))

                        if serviceVersion is not None:
                            params = {"version": serviceVersion}
                        serviceDockerMetadata = service["metadata"]["dockerParameters"]
                        updatedMetadata = (
                            serviceMetadataOperationsHandler.convertDoubleToInt(
                                serviceDockerMetadata
                            )
                        )
                        metadata = (
                            serviceMetadataOperationsHandler.updateServiceMetadata(
                                updatedMetadata, updateEnv=uniqueServiceEnvs
                            )
                        )

                        dockerServiceHandler.update_service(
                            service["serviceName"].replace(" ", "_"), params, metadata
                        )

                    databaseOperationsHandler.updateServiceObject(
                        service["serviceId"], **{"status": serviceInstanceObject.status}
                    )
                    databaseOperationsHandler.updateServiceObjectMetadata(
                        serviceInstanceObject,
                        **{"isLatest": False},
                    )

                    databaseOperationsHandler.updateServiceObject(
                        serviceInstanceObject.serviceId, **{"status": "inactive"}
                    )
                return True
            else:
                return False
        except Exception as e:
            console_logger.debug(e)
            return False

    def uninstallService(self, serviceInstanceObjects: list):
        try:
            for serviceObject in serviceInstanceObjects:
                status_code, _ = apiOperationHandler.uninstallServiceFromCloud(
                    serviceObject.serviceId
                )
                console_logger.debug(status_code)
                if status_code == 500:
                    return "server error"

                dictionary = dict(serviceObject.metadata["databaseParameters"])
                console_logger.debug(type(dictionary))

                if "username" in dictionary.keys():
                    dbServiceId = serviceObject.metadata["packagedServiceIds"][
                        "Database"
                    ]
                    if any(dbServiceId):
                        databaseOperationsHandler.mongo_remove_db_config_generator(
                            **dictionary
                        )
                        dbServiceObject = databaseOperationsHandler.fetchServiceObject(
                            serviceId=dbServiceId[0], status="active"
                        )
                        self.removeUserFromDatabase(
                            dbServiceObject.serviceName, dictionary["databaseName"]
                        )

                self.removeServiceFolder(serviceObject.serviceId)

                if not dockerImageHandler.delete_image(
                    serviceObject.metadata["dockerParameters"]["TaskTemplate"][
                        "ContainerSpec"
                    ]["Image"]
                ):
                    return "docker service delete error"

                if not databaseOperationsHandler.deleteDocument(
                    serviceObject.serviceId
                ):
                    return "database service delete error"

            return True
        except Exception as e:
            console_logger.debug(e)
            return False

    def checkForSystemUpdate(self, data):
        currentVersion = apiOperationHandler.fetchSoftwareVersion()
        latestVersion = data["version"]
        if currentVersion == latestVersion:
            return False
        elif data["updatePriority"] == "normal":
            # apiOperationHandler.updateSoftwareVersion("Active", latestVersion)
            return True
        elif data["updatePriority"] == "critical":
            return True

    def rollbackServices(self, serviceNames: list, oldServices: list = [], newServices: list = []):
        for serviceName in serviceNames:
            serviceVersion = dockerServiceHandler.fetch_service_version(serviceName)
            if serviceVersion:
                params = {"version": serviceVersion, "rollback": "previous"}
                dockerServiceHandler.update_service(
                    serviceName, params, serviceNames[serviceName]
                )

        for service in oldServices:
            databaseOperationsHandler.updateBaseServiceObject(
                service.serviceId, **{"status": "active"}
            )

        for service in newServices:
            databaseOperationsHandler.updateBaseServiceObject(
                service.serviceId, **{"status": "inactive"}
            ) 

    def updateSystem(self, data):
        # try:
        serviceMetadata = {}
        metadataList = []
        updatedServices = {}

        for serviceMetata in data["services"]:
            _, metadata = apiOperationHandler.fetchBaseServiceMetadata(
                serviceMetata["serviceId"]
            )
            metadataList.append(metadata["detail"][0])

        metadataList = serviceMetadataOperationsHandler.convertRawMetadataToFinalData(
            metadataList
        )
        (
            baseServiceInstanceList,
            oldBaseServices,
        ) = databaseOperationsHandler.addBaseMetadataToDB(metadataList)

        # download new services
        for baseServiceInstance in baseServiceInstanceList:
            console_logger.debug("downloading")
            databaseOperationsHandler.updateBaseServiceObject(
                baseServiceInstance.serviceId, **{"status": "downloading"}
            )

            if not self.downloadService(baseServiceInstance):
                return "failed to download service : {}".format(
                    baseServiceInstance.serviceName
                )

            databaseOperationsHandler.updateBaseServiceObject(
                baseServiceInstance.serviceId, **{"status": "downloaded"}
            )

        for index, baseServiceInstance in enumerate(baseServiceInstanceList):

            serviceVersion = dockerServiceHandler.fetch_service_version(
                baseServiceInstance.serviceName.replace(" ", "_")
            )

            if serviceVersion is not None:
                params = {"version": serviceVersion}
                serviceDockerMetadata = baseServiceInstance.metadata["dockerParameters"]
                # console_logger.debug(serviceDockerMetadata)
                updatedMetadata = serviceMetadataOperationsHandler.convertDoubleToInt(
                    serviceDockerMetadata
                )
                # console_logger.debug(updatedMetadata)
                (
                    updatedMetadata,
                    previousServiceMetadata,
                ) = serviceMetadataOperationsHandler.updateBaseServiceMetdata(
                    updatedMetadata
                )
                # console_logger.debug(json.dumps(previousServiceMetadata, indent=4))
                # console_logger.debug(json.dumps(updatedMetadata, indent=4))

                if baseServiceInstance.serviceName.replace(" ", "_") == "rdx_service":
                    serviceMetadata = copy.deepcopy(updatedMetadata)
                    # console_logger.debug(serviceMetadata)
                    serviceMetadata["rollbackMetadata"] = copy.deepcopy(
                        previousServiceMetadata["Spec"]
                    )
                    # console_logger.debug(baseServiceInstance)
                    serviceMetadata["databaseInstance"] = copy.deepcopy(
                        baseServiceInstance
                    )
                    # console_logger.debug(index)
                    # console_logger.debug(oldBaseServices)
                    # console_logger.debug(oldBaseServices[index])
                    # if isinstance(oldBaseServices, list) and len(oldBaseServices):
                    if isinstance(oldBaseServices, list):
                        serviceMetadata["oldDatabaseInstance"] = copy.deepcopy(
                            oldBaseServices[index]
                        )
                    else:
                        serviceMetadata["oldDatabaseInstance"] = copy.deepcopy(
                            oldBaseServices
                        )
                    serviceMetadata["serviceVersion"] = copy.deepcopy(params)
                    # console_logger.debug(serviceMetadata)
                else:
                    status = dockerServiceHandler.update_service(
                        baseServiceInstance.serviceName.replace(" ", "_"),
                        params,
                        updatedMetadata,
                    )
                    if not status:
                        self.rollbackServices(updatedServices, oldServices=oldBaseServices, newServices=baseServiceInstanceList)
                        databaseOperationsHandler.removeBaseMetadataFromDB(
                            baseServiceInstanceList
                        )
                        return "{} service update failed inside failed with error: {}".format(
                            baseServiceInstance.serviceName.replace(" ", "_"),
                            serviceInspectData["UpdateStatus"]["State"],
                        )

                    time.sleep(10)

                    serviceInspectData = dockerServiceHandler.inspect_service(
                        baseServiceInstance.serviceName.replace(" ", "_")
                    )
                    while (
                        "UpdateStatus" in serviceInspectData.keys()
                        and serviceInspectData["UpdateStatus"]["State"] == "updating"
                    ):
                        serviceInspectData = dockerServiceHandler.inspect_service(
                            baseServiceInstance.serviceName.replace(" ", "_")
                        )
                        if (
                            "UpdateStatus" in serviceInspectData.keys()
                            and serviceInspectData["UpdateStatus"]["State"]
                            != "updating"
                        ):
                            break
                        console_logger.debug("service updating")
                        time.sleep(10)

                    taskStatus = dockerTaskHandler.fetch_service_update_task_status(
                        baseServiceInstance.serviceName.replace(" ", "_")
                    )
                    # console_logger.debug(taskStatus["Status"]["State"])

                    while (
                        taskStatus["Status"]["State"] != "running" and self.timeout > 0
                    ):
                        taskStatus = dockerTaskHandler.fetch_service_update_task_status(
                            baseServiceInstance.serviceName.replace(" ", "_")
                        )

                        if taskStatus["Status"]["State"] == "rejected":
                            self.rollbackServices(updatedServices, oldServices=oldBaseServices, newServices=baseServiceInstanceList)
                            self.timeout = 60
                            return "{} service update failed inside rejected with error: {}".format(
                                baseServiceInstance.serviceName.replace(" ", "_"),
                                taskStatus["Status"]["Err"],
                            )

                        if taskStatus["Status"]["State"] in ["shutdown", "failed"]:
                            serviceInspectData = dockerServiceHandler.inspect_service(
                                baseServiceInstance.serviceName.replace(" ", "_")
                            )
                            if (
                                "UpdateStatus" in serviceInspectData.keys()
                                and serviceInspectData["UpdateStatus"]["State"]
                                != "completed"
                                and serviceInspectData["UpdateStatus"]["Message"]
                                != "update completed"
                            ):
                                self.timeout = 60
                                self.rollbackServices(updatedServices, oldServices=oldBaseServices, newServices=baseServiceInstanceList)
                                databaseOperationsHandler.removeBaseMetadataFromDB(
                                    baseServiceInstanceList
                                )
                                return "{} service update failed inside failed with error: {}".format(
                                    baseServiceInstance.serviceName.replace(" ", "_"),
                                    serviceInspectData["UpdateStatus"]["State"],
                                )
                            else:
                                break

                        time.sleep(1)
                        console_logger.debug("checking for service")
                        self.timeout -= 1

                    serviceInspectData = dockerServiceHandler.inspect_service(
                        baseServiceInstance.serviceName.replace(" ", "_")
                    )
                    if (
                        "UpdateStatus" in serviceInspectData.keys()
                        and serviceInspectData["UpdateStatus"]["State"]
                        == "rollback_completed"
                        and serviceInspectData["UpdateStatus"]["Message"]
                        == "rollback completed"
                    ):
                        self.rollbackServices(updatedServices, oldServices=oldBaseServices, newServices=baseServiceInstanceList)
                        databaseOperationsHandler.removeBaseMetadataFromDB(
                            baseServiceInstanceList
                        )
                        self.timeout = 60
                        return "{} service update failed outside running with error".format(
                            baseServiceInstance.serviceName.replace(" ", "_")
                        )

                    self.timeout = 60
                
                console_logger.debug(baseServiceInstance.serviceId)
                databaseOperationsHandler.updateBaseServiceObject(
                    baseServiceInstance.serviceId, **{"status": "active"}
                )
                console_logger.debug(databaseOperationsHandler)
                if any(oldBaseServices):
                    databaseOperationsHandler.updateBaseServiceObject(
                        oldBaseServices[index].serviceId, **{"status": "inactive"}
                    )

                if baseServiceInstance.serviceName.replace(" ", "_") != "rdx_service":
                    updatedServices.update(
                        {
                            baseServiceInstance.serviceName.replace(
                                " ", "_"
                            ): previousServiceMetadata["Spec"]
                        }
                    )

        if any(serviceMetadata):
            self.timeout = 60
            dbInstance = serviceMetadata.pop("databaseInstance")
            oldDbInstance = serviceMetadata.pop("oldDatabaseInstance")
            params = serviceMetadata.pop("serviceVersion")
            # params = {"version": "108"}
            rollbackMetadata = serviceMetadata.pop("rollbackMetadata")

            status = dockerServiceHandler.update_service(
                serviceMetadata["Name"], params, serviceMetadata
            )

            if not status:
                self.rollbackServices(updatedServices, oldServices=oldBaseServices, newServices=baseServiceInstanceList)
                databaseOperationsHandler.removeBaseMetadataFromDB(
                    baseServiceInstanceList
                )
                return "{} service update failed inside failed with error: {}".format(
                    baseServiceInstance.serviceName.replace(" ", "_"),
                    serviceInspectData["UpdateStatus"]["State"],
                )

            time.sleep(10)

            serviceInspectData = dockerServiceHandler.inspect_service(
                baseServiceInstance.serviceName.replace(" ", "_")
            )
            while (
                "UpdateStatus" in serviceInspectData.keys()
                and serviceInspectData["UpdateStatus"]["State"] == "updating"
            ):
                serviceInspectData = dockerServiceHandler.inspect_service(
                    baseServiceInstance.serviceName.replace(" ", "_")
                )
                if (
                    "UpdateStatus" in serviceInspectData.keys()
                    and serviceInspectData["UpdateStatus"]["State"] != "updating"
                ):
                    break
                console_logger.debug("service updating")
                time.sleep(10)

            taskStatus = dockerTaskHandler.fetch_service_update_task_status(
                baseServiceInstance.serviceName.replace(" ", "_")
            )

            while taskStatus["Status"]["State"] != "running" and self.timeout > 0:
                taskStatus = dockerTaskHandler.fetch_service_update_task_status(
                    baseServiceInstance.serviceName.replace(" ", "_")
                )

                if taskStatus["Status"]["State"] == "rejected":
                    self.rollbackServices(updatedServices, oldServices=oldBaseServices, newServices=baseServiceInstanceList)
                    self.timeout = 60
                    return "{} service update failed inside rejected with error: {}".format(
                        baseServiceInstance.serviceName.replace(" ", "_"),
                        taskStatus["Status"]["Err"],
                    )

                if taskStatus["Status"]["State"] in ["shutdown", "failed"]:
                    serviceInspectData = dockerServiceHandler.inspect_service(
                        baseServiceInstance.serviceName.replace(" ", "_")
                    )
                    if (
                        "UpdateStatus" in serviceInspectData.keys()
                        and serviceInspectData["UpdateStatus"]["State"] != "completed"
                        and serviceInspectData["UpdateStatus"]["Message"]
                        != "update completed"
                    ):
                        self.timeout = 60
                        self.rollbackServices(updatedServices, oldServices=oldBaseServices, newServices=baseServiceInstanceList)
                        databaseOperationsHandler.removeBaseMetadataFromDB(
                            baseServiceInstanceList
                        )
                        return "{} service update failed inside failed with error: {}".format(
                            baseServiceInstance.serviceName.replace(" ", "_"),
                            serviceInspectData["UpdateStatus"]["State"],
                        )
                    else:
                        break

                time.sleep(1)
                console_logger.debug("checking for service")
                self.timeout -= 1

            serviceInspectData = dockerServiceHandler.inspect_service(
                baseServiceInstance.serviceName.replace(" ", "_")
            )
            if (
                "UpdateStatus" in serviceInspectData.keys()
                and serviceInspectData["UpdateStatus"]["State"] == "rollback_completed"
                and serviceInspectData["UpdateStatus"]["Message"]
                == "rollback completed"
            ):
                self.rollbackServices(updatedServices, oldServices=oldBaseServices, newServices=baseServiceInstanceList)
                databaseOperationsHandler.removeBaseMetadataFromDB(
                    baseServiceInstanceList
                )
                self.timeout = 60
                return "{} service update failed outside running with error".format(
                    baseServiceInstance.serviceName.replace(" ", "_")
                )

            self.timeout = 60

            databaseOperationsHandler.updateBaseServiceObject(
                dbInstance.serviceId, **{"status": "active"}
            )

            if oldDbInstance is not None:
                databaseOperationsHandler.updateBaseServiceObject(
                    oldDbInstance.serviceId, **{"status": "inactive"}
                )
        apiOperationHandler.updateSoftwareVersion("Active", data["version"])
        apiOperationHandler.rebootSystem()
        # except Exception as e:
        #     console_logger.debug(e)

    def updateServiceEnvVeriables(self, ip="192.168.0.150"):
        serviceObjects = databaseOperationsHandler.fetchServiceObject(
            **{"status": "active"}
        )
        if any(serviceObjects):
            for serviceObject in serviceObjects:
                if serviceObject.serviceType == "Usecase":
                    serviceInspectData = dockerServiceHandler.inspect_service(
                        serviceName=serviceObject.serviceName.replace(" ", "_")
                    )
                    dockerParameters = copy.deepcopy(serviceInspectData["Spec"])
                    envParams = copy.deepcopy(
                        dockerParameters["TaskTemplate"]["ContainerSpec"]["Env"]
                    )
                    for i, param in enumerate(envParams):
                        if param.find("IP") != -1:
                            envParams[i] = "IP={}".format(ip)
                    dockerParameters["TaskTemplate"]["ContainerSpec"]["Env"] = envParams
                    serviceVersion = dockerServiceHandler.fetch_service_version(
                        serviceObject.serviceName.replace(" ", "_")
                    )
                    if serviceVersion is not None:
                        params = {"version": serviceVersion}
                        dockerServiceHandler.update_service(
                            serviceObject.serviceName.replace(" ", "_"),
                            params,
                            dockerParameters,
                        )
                elif serviceObject.serviceType == "AI":
                    # self.deactivateContainer(
                    self.deactivateContainerWithNetwork(
                        serviceObject.serviceName.replace(" ", "_")
                    )
        return True

    def fetchContainerLogs(self, **kwargs):
        runningContainers = dockerContainerHandler.fetch_containers()

        filters = {
            "since": kwargs["since"],
            "until": kwargs["until"],
            "tail": kwargs["tail"],
            "timestamps": True,
            "stdout": True,
        }
        for container in runningContainers:
            code, response = dockerContainerHandler.fetch_logs(
                runningContainers[container]["id"], **filters
            )

            if code == 200:
                zip_converter.create_zip(container, response)

        code, response = apiOperationHandler.fetch_host_logs(**filters)
        if code == 200:
            zip_converter.create_zip("host", response)
        zip_converter.set_password()

        return "/static_server/logs/containers_logs.zip"

    def activateContainerWithNetwork(self, serviceInstanceObject: object):
        # fetch container details
        gatewayContainerDetails = dockerContainerHandler.fetch_containers(
            all=False, **{"container_name": "rdx_kong"}
        )
        # console_logger.debug(gatewayContainerDetails)
        containerName = serviceInstanceObject.serviceName.replace(" ", "_")
        # console_logger.debug(containerName)
        dockerNetworkHandler.deattach_from_network(
            containerName, gatewayContainerDetails["rdx_kong"]["id"]
        )
        dockerContainerHandler.stop_container(containerName)
        dockerNetworkHandler.delete_network(containerName)
        
        containerDetails = dockerContainerHandler.fetch_containers(
            all=False, **{"container_name": containerName}, type=["created","restarting","running","removing","paused","exited","dead"]
        )
        # console_logger.debug(containerDetails)
        # console_logger.debug(any(containerDetails))

        # if container is already running then return
        if any(containerDetails):
            return True

        # fetch gateway container details
        # gatewayContainerDetails = dockerContainerHandler.fetch_containers(
        #     all=False, **{"container_name": "rdx_kong"}
        # )

        # load docker parameters from database and perform the metadata modifications for docker api
        serviceDockerMetadata = serviceInstanceObject.metadata["dockerParameters"]
        # console_logger.debug(serviceDockerMetadata)
        updatedMetadata = serviceMetadataOperationsHandler.convertDoubleToInt(
            serviceDockerMetadata
        )
        # console_logger.debug(updatedMetadata)

        finalMetadata = (
            serviceMetadataOperationsHandler.updateContainerMetadataWithNetwork(
                containerName, updatedMetadata
            )
        )

        # console_logger.debug(finalMetadata)

        for mount in finalMetadata["HostConfig"]["Mounts"]:
            if not os.path.exists(mount["Source"]):
                splittedPath = mount["Source"].split("/")
                console_logger.debug(splittedPath)
                if any(splittedPath):
                    try:
                        index = splittedPath.index("static_server")
                        console_logger.debug(index)
                        path = "/".join(splittedPath[index + 1 :])
                        console_logger.debug(path)
                        apiOperationHandler.createFolder(path)
                    except Exception as e:
                        console_logger.debug(e)
                        pass

        # # create container by passing the required matadata
        containerId = dockerContainerHandler.create_container(
            containerName, finalMetadata
        )
        console_logger.debug(containerId)

        if containerId:
            status = dockerContainerHandler.start_container(containerId)
            dockerNetworkHandler.create_network(containerName)
            dockerNetworkHandler.attach_to_network(
                containerName, gatewayContainerDetails["rdx_kong"]["id"]
            )
            dockerNetworkHandler.attach_to_network(containerName, containerId)
            return status

        return False

    def deactivateContainerWithNetwork(self, serviceName: str):
        while serviceName in self.serviceToBeActivated:
            time.sleep(10)

        containerDetails = dockerContainerHandler.fetch_containers(
            all=False, **{"container_name": serviceName}, type=["created","restarting","running","removing","paused","exited","dead"]
        )
        console_logger.debug(containerDetails)

        # fetch gateway container details
        gatewayContainerDetails = dockerContainerHandler.fetch_containers(
            all=False, **{"container_name": "rdx_kong"}
        )
        console_logger.debug(gatewayContainerDetails)

        dockerNetworkHandler.deattach_from_network(
            serviceName, gatewayContainerDetails["rdx_kong"]["id"]
        )
        dockerNetworkHandler.deattach_from_network(
            serviceName, containerDetails[serviceName]["id"]
        )
        dockerContainerHandler.stop_container(serviceName)
        dockerNetworkHandler.delete_network(serviceName)

    def returnContainerLiveViewLink(self, containerName):
        status, containerDetails = dockerContainerHandler.inspect_container(
            containerName
        )
        portMappings = containerDetails["NetworkSettings"]["Ports"]
        port = None
        rtspLink = None

        for portMapping in portMappings:
            console_logger.debug(portMapping)
            if (
                portMappings[portMapping][0]["HostPort"] != None
                and portMappings[portMapping][0]["HostPort"] != ""
            ):
                port = portMappings[portMapping][0]["HostPort"]

        if port:
            rtspLink = ":{}/{}".format(port, containerName)

        return rtspLink

    def downloadAll(self, services):
        for service in services:
            console_logger.debug(service["serviceName"])
            status = self.downloadService(service)
            data = {"detail": {"taskName": service["serviceName"], "status": status}}

            socketOperationsHandler.sendServiceDownloadStatus(data)
        return True

    def updateAll(self, services):
        for service in services:
            status = self.updateService(service)
            data = {"detail": {"taskName": service["serviceName"], "status": status}}
            socketOperationsHandler.sendServiceUpdateStatus(data)
        return True

    def ZipServices(self, **kwargs):
        detail = zipconverter.unzip_file(**kwargs)
        return detail

    def UnzipServices(self, **kwargs):
        detail = zipconverter.unzip_default_file(**kwargs)
        return detail
    
    def CheckValidity(self):
        console_logger.debug("checking Service Validity")
        services = Services.objects()
        # console_logger.debug(services)
        for service in services:
            if service['serviceType'] == "Usecase" and service['status'] != "suspended":
                currentime = datetime.datetime.now()
                service_validity_date = datetime.datetime.strptime(str(service['validity']), '%Y-%m-%d %H:%M:%S')
                if currentime > service_validity_date:
                    console_logger.debug(
                        "Service Suspending: {}".format(service["serviceName"])
                    )
                    # if service["status"] == "Active":
                    #     self.deactivateService(service["serviceName"].replace(" ", "_"))
                    service["status"] = "suspended"
                    service.save()
                    console_logger.debug(
                        "Service Suspended: {}".format(service["serviceName"])
                    )


