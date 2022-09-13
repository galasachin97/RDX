from mongoengine.base.datastructures import BaseDict, BaseList
from pydantic.utils import deep_update
import datetime
import json
import copy
import os
import string
import random

from api.service.helpers.docker_operations import *
from api.service.helpers.api_operations import APIOperations
from api.service.helpers.logs import console_logger

dockerImageHandler = DockerImageHandler()
dockerServiceHandler = DockerServiceHandler()
dockerContainerHandler = DockerContainerHandler()
dockerTaskHandler = DockerTaskHandler()


class ServiceMetadataOperations:
    def __init__(self) -> None:
        self.host = "192.168.0.150"
        self.socketPort = "80"

        if os.path.exists(os.path.join(os.getcwd(), "envs", "env.json")):
            with open(os.path.join(os.getcwd(), "envs", "env.json"), "r") as f:
                self.host = json.loads(f.read())["HOST"]

        self.apiOperationsHandler = APIOperations()
        self.serviceSchema = {
            "serviceId": None,
            "serviceName": None,
            "serviceType": None,
            "description": None,
            "metadata": {
                "packagedServiceIds": {},
                "dockerParameters": {},
                "databaseParameters": {},
                "settingsParameters": {},
                "analyticsParameters": {},
                "icon": None,
                "updatePriority": None,
                "isLatest": None
            },
            "installedVersion": None,
            "availableVersion": None,
            "validity": None,
            "status": None
        }
        self.restart_policy = {
            "Name": "unless-stopped"
        }
        self.update_config = {
            "Parallelism": 1,
            "FailureAction": "rollback"
        }
        self.rollback_config = {
            "Parallelism": 1,
            "FailureAction": "pause"
        }
        self.mode = {
            "Replicated": {
                "Replicas": 1
            }
        }
        self.usecaseNetworks = [
            {
                "Target": "usecase"
            }
        ]
        self.defaultNetwork = [
            {
                "Target": "system-default"
            }
        ]
        self.envVariables = [
            "IP={}".format(self.host),
            "PORT={}".format(self.socketPort)
        ]

    def fetchRawMetadataOfAssignedServices(self):
        try:
            serviceMetadata = []
            serviceIdsToBeAdded = []

            status_code, assignedServiceData = self.apiOperationsHandler.fetchAssignedServices()

            if status_code == 200:

                for service in assignedServiceData["detail"]:

                    status_code, data = self.apiOperationsHandler.fetchServiceMetadata(
                        service["serviceId"])

                    for serviceType in data["detail"]["metadata"]["packagedServiceIds"]:
                        for dependentService in data["detail"]["metadata"]["packagedServiceIds"][serviceType]:

                            if dependentService not in serviceIdsToBeAdded:
                                status_code, dependentServiceData = \
                                    self.apiOperationsHandler.fetchServiceMetadata(
                                        dependentService)

                                if status_code != 200:
                                    raise Exception(
                                        "Service Metadata Fetching Failed")

                                dependentServiceData["detail"].update({
                                    "validity": datetime.datetime.strptime(service["expiry"], "%d/%m/%Y %H:%M:%S")
                                })

                                serviceMetadata.append(
                                    dependentServiceData["detail"])

                                serviceIdsToBeAdded.append(dependentService)

                    data["detail"].update({
                        "validity": datetime.datetime.strptime(service["expiry"], "%d/%m/%Y %H:%M:%S")
                    })

                    serviceMetadata.append(data["detail"])

                return serviceMetadata
            else:
                raise Exception("Assigned Services Fetching Failed")

        except Exception as e:
            return str(e)

    def convertRawMetadataToFinalData(self, rawServiceMetadata: list) -> list:
        finalMetadata = []
        # console_logger.debug(rawServiceMetadata)

        for rawMetadata in rawServiceMetadata:
            tempServiceSchemaCopy = copy.deepcopy(self.serviceSchema)

            for k, v in rawMetadata.items():
                if k in tempServiceSchemaCopy:
                    if k == "metadata":
                        for sub_k, sub_v in rawMetadata[k].items():
                            if sub_k in tempServiceSchemaCopy[k]:
                                tempServiceSchemaCopy[k].update({sub_k: sub_v})
                    else:
                        tempServiceSchemaCopy.update({k: v})

            tempServiceSchemaCopy["serviceId"] = rawMetadata["id"]
            tempServiceSchemaCopy["serviceName"] = rawMetadata["serviceName"].replace(
                " ", "_")
            tempServiceSchemaCopy["installedVersion"] = rawMetadata["version"]
            tempServiceSchemaCopy["availableVersion"] = rawMetadata["version"]
            tempServiceSchemaCopy["status"] = "purchased"

            finalMetadata.append(copy.deepcopy(tempServiceSchemaCopy))

        return finalMetadata

    def convertDoubleToInt(self, serviceMetadata):
        tempDict = {}
        if type(serviceMetadata) == BaseDict or type(serviceMetadata) == dict:
            for k, v in serviceMetadata.items():
                if type(v) == BaseList or type(v) == list:
                    tempList = []
                    for metadata in v:
                        tempList.append(self.convertDoubleToInt(metadata))
                    tempDict[k] = tempList
                if type(v) == BaseDict or type(v) == dict:
                    tempDict[k] = self.convertDoubleToInt(v)
                elif type(v) == float:
                    tempDict[k] = int(v)
                else:
                    tempDict[k] = v
        return tempDict

    def updateServiceMetadata(self, metadata, updateEnv=[]):

        if not any(updateEnv):
            updatedEnvVariables = self.envVariables.copy()
            updatedEnvVariables.append("SERVICE_ID={}".format(
                metadata["Name"].replace(" ", "_")))
        else:
            tempList = copy.deepcopy(
                metadata["TaskTemplate"]["ContainerSpec"]["Env"])
            tempList.extend(updateEnv)
            updatedEnvVariables = copy.deepcopy(list(set(tempList)))

        networks = []
        networks.extend(self.usecaseNetworks)
        metadata["Name"] = metadata["Name"].replace(" ", "_")
        metadata["UpdateConfig"] = self.update_config
        metadata["RollbackConfig"] = self.rollback_config
        metadata["TaskTemplate"]["RestartPolicy"] = self.restart_policy
        metadata["TaskTemplate"]["Networks"] = networks
        metadata["TaskTemplate"]["ContainerSpec"]["Env"] = copy.deepcopy(
            updatedEnvVariables)
        return metadata

    def updateContainerMetadata(self, containerName, metadata):
        updatedEnvVariables = self.envVariables.copy()
        updatedEnvVariables.append("SERVICE_ID={}".format(containerName))
        hostConfig = {
            "Image": metadata["TaskTemplate"]["ContainerSpec"]["Image"],
            "Env": updatedEnvVariables,
            "Privileged": True,
            "HostConfig": {
                "Memory": metadata["TaskTemplate"]["Resources"]["Reservations"]["MemoryBytes"],
                "MemoryReservation": metadata["TaskTemplate"]["Resources"]["Limits"]["MemoryBytes"],
                "RestartPolicy": self.restart_policy,
                "NetworkMode": "host",
                "Mounts": metadata["TaskTemplate"]["ContainerSpec"]["Mounts"]
            }
        }
        return hostConfig

    def updateContainerMetadataWithNetwork(self, containerName, metadata):
        updatedEnvVariables = self.envVariables.copy()
        updatedEnvVariables.append("SERVICE_ID={}".format(containerName))

        hostConfig = {
            "Image": metadata["TaskTemplate"]["ContainerSpec"]["Image"],
            "Env": updatedEnvVariables,
            "Privileged": True,
            "HostConfig": {
                "Memory": metadata["TaskTemplate"]["Resources"]["Reservations"]["MemoryBytes"],
                "MemoryReservation": metadata["TaskTemplate"]["Resources"]["Limits"]["MemoryBytes"],
                "RestartPolicy": self.restart_policy,
                "Mounts": metadata["TaskTemplate"]["ContainerSpec"]["Mounts"]
            }
        }

        if "Ports" in metadata["EndpointSpec"].keys() and len(metadata["EndpointSpec"]["Ports"]):
            hostConfig["HostConfig"]["PortBindings"] = {}
            hostConfig["ExposedPorts"] = {}
            for portsToBeExposed in metadata["EndpointSpec"]["Ports"]:
                if "PublishedPort" in portsToBeExposed:
                    portBinding = "{}/tcp".format(
                        portsToBeExposed["PublishedPort"])
                    hostConfig["ExposedPorts"][portBinding] = {}
                    hostConfig["HostConfig"]["PortBindings"][portBinding] = [{"HostPort": ""}]

        return hostConfig

    def fetchLatestServiceMetadata(self, serviceId):
        serviceMetadata = []
        statusCode, metadata = self.apiOperationsHandler.fetchLatestServiceMetadata(
            serviceId)

        if statusCode == 200:
            for serviceType in metadata["detail"]["metadata"]["packagedServiceIds"]:
                for dependentService in metadata["detail"]["metadata"]["packagedServiceIds"][serviceType]:

                    status_code, dependentServiceData = \
                        self.apiOperationsHandler.fetchServiceMetadata(
                            dependentService)

                    if status_code != 200:
                        raise Exception("Service Metadata Fetching Failed")

                    serviceMetadata.append(dependentServiceData["detail"])

            serviceMetadata.append(metadata["detail"])
            return serviceMetadata
        else:
            return {}

    def databaseServiceConfig(self, serviceName, databaseName, serviceObject):
        dictionary = {}
        dictionary["username"] = serviceName
        dictionary["password"] = ''.join(random.choices(
            string.ascii_letters + string.digits, k=16))
        dictionary["databaseName"] = databaseName
        dictionary["Host"] = serviceObject.serviceName
        dictionary["Port"] = serviceObject.metadata["dockerParameters"]["EndpointSpec"]["Ports"][0]["TargetPort"]
        return dictionary

    def updateBaseServiceMetdata(self, serviceMetadata):
        runnningServiceMetadata = dockerServiceHandler.inspect_service(
            serviceMetadata["Name"])
        # console_logger.debug(runnningServiceMetadata)
        updatedMetadata = deep_update(
            runnningServiceMetadata["Spec"], serviceMetadata)
        updatedMetadata["Labels"]["com.docker.stack.image"] = serviceMetadata["TaskTemplate"]["ContainerSpec"]["Image"]
        return updatedMetadata, runnningServiceMetadata
