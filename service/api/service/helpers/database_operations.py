from mongoengine.errors import DoesNotExist, ValidationError
import os

from api.service.models import *
from api.service.helpers.socket_operations import socketOperationsHandler
from api.service.helpers.logs import console_logger
from config import Config


class DatabaseOperations:
    def __init__(self) -> None:
        pass

    def addMetadataToDB(self, metadataList: list) -> bool:
        collections = []

        try:
            for metadata in metadataList:
                try:
                    Services.objects.get(serviceId=metadata["serviceId"])
                except DoesNotExist:
                    collections.append(Services(**metadata, **{"added": datetime.datetime.utcnow()}))

            if len(collections):
                Services.objects.insert(collections)
            return True
        except Exception as e:
            console_logger.debug(e)
            return False

    def fetchServiceObject(self, serviceId=None, serviceName=None, **kwargs):
        # console_logger.debug(kwargs)
        try:
            if serviceId:
                return Services.objects.get(serviceId=serviceId, **kwargs)
            elif serviceName:
                return Services.objects(serviceName=serviceName, **kwargs).order_by('-added')
            elif any(kwargs.keys()):
                return Services.objects(**kwargs).order_by('-added')
        except DoesNotExist:
            return None

    def updateServiceObject(self, serviceId: str, **kwargs):
        try:
            args = {}
            for k, v in kwargs.items():
                args["set__{}".format(k)] = v
            Services.objects(serviceId=serviceId).update(**args)
            return True
        except ValidationError:
            return False

    def deleteDocument(self, serviceId: str) -> bool:
        try:
            console_logger.debug(serviceId)
            serviceObject = Services.objects.get(serviceId=serviceId)
            serviceObject.delete()
            return True
        except Exception as e:
            console_logger.debug(e)
            return False

    def updateServiceObjectMetadata(self, serviceObject, **kwargs):
        try:
            metadata = serviceObject.metadata
            metadata.update(**kwargs)
            serviceObject.save()
            return True
        except ValidationError:
            return False

    def mongo_add_db_config_generator(self, **kwargs):
        console_logger.debug(kwargs)
        file_content = "db = db.getSiblingDB('{}');\n".format(
            kwargs["databaseName"])
        file_content += "db.createUser(\n"
        file_content += "   {\n"
        file_content += "       user: \"{}\",\n".format(kwargs["username"])
        file_content += "       pwd: \"{}\",\n".format(kwargs["password"])
        file_content += "       roles: [\"dbOwner\"]\n"
        file_content += "   }\n"
        file_content += ");\n"
        file_content += "db.auth(\"{}\", \"{}\");".format(
            kwargs["username"], kwargs["password"])

        js_path = os.path.join(os.getcwd(), "usecase_db", "mongo", "mongo.js")
        with open(js_path, 'w') as file:
            file.write(file_content)
        return True

    def mongo_remove_db_config_generator(self, **kwargs):
        try:
            console_logger.debug(kwargs)
            console_logger.debug(kwargs["username"])
            file_content = "db.dropUser(\"{}\")".format(kwargs["username"])
            
            console_logger.debug(file_content)
            js_path = os.path.join(os.getcwd(), "usecase_db", "mongo", "mongo.js")
            with open(js_path, 'w') as file:
                file.write(file_content)
            return True
        except Exception as e:
            console_logger.debug(e)
            return False

    def logServiceStatus(self, task):
        if task.exception() == None:
            Taskmeta(
                Status=str(task.result()),
                Task_name=task.get_name(),
                Task_time=datetime.datetime.utcnow()
            ).save()
            socketOperationsHandler.sendSocketData(task.get_name(), str(task.result()))
        else:
            console_logger.debug(str(task.exception()))
            Taskmeta(
                Status="Failed",
                Task_name=task.get_name(),
                Task_time=datetime.datetime.utcnow(),
                Traceback=str(task.exception())
            ).save()
            socketOperationsHandler.sendSocketData(task.get_name(), "Failed")

    def addBaseMetadataToDB(self, metadataList):
        collections = []
        addedService = []
        oldBaseServices = []

        disableActiveStatus = NewBaseServices.objects.count()
        console_logger.debug(disableActiveStatus)

        try:
            for metadata in metadataList:
                try:
                    newServiceInstance = NewBaseServices.objects.get(
                        serviceId=metadata["serviceId"])
                    if newServiceInstance.status != "active":
                        console_logger.debug(metadata["serviceName"])
                        addedService.append(newServiceInstance)
                    
                        oldBaseServiceObjects = NewBaseServices.objects(
                            serviceName=newServiceInstance.serviceName,
                            **{"metadata__isLatest": True}
                        )

                        if not any(oldBaseServiceObjects):
                            oldBaseServiceObjects = NewBaseServices.objects(
                                serviceName=newServiceInstance.serviceName,
                                **{"metadata__isLatest": False}
                            ).order_by('-added')

                        if any(oldBaseServiceObjects):
                            oldBaseService = oldBaseServiceObjects[0]
                            oldBaseService.metadata["isLatest"] = False
                            oldBaseService.save()
                            oldBaseServices.append(oldBaseService)

                except DoesNotExist:
                    oldBaseServiceObjects = NewBaseServices.objects(
                        serviceName=metadata["serviceName"],
                        **{"metadata__isLatest": True}
                    )

                    if not any(oldBaseServiceObjects):
                        oldBaseServiceObjects = NewBaseServices.objects(
                            serviceName=metadata["serviceName"],
                            **{"metadata__isLatest": False}
                        ).order_by('-added')

                    if any(oldBaseServiceObjects):
                        oldBaseService = oldBaseServiceObjects[0]
                        oldBaseService.metadata["isLatest"] = False
                        oldBaseService.save()
                        oldBaseServices.append(oldBaseService)

                    if disableActiveStatus == 0:
                        metadata["status"] = "active"

                    collections.append(NewBaseServices(**metadata))

            if len(collections):
                NewBaseServices.objects.insert(collections)

            collections.extend(addedService)
            return collections, oldBaseServices
        except Exception as e:
            console_logger.debug(e)
            return []

    def removeBaseMetadataFromDB(self, dbInstances: list):
        for dbInstance in dbInstances:
            try:
                oldBaseServiceObjects = NewBaseServices.objects(
                    serviceName=dbInstance.serviceName,
                    **{"metadata__isLatest": True}
                )

                if not any(oldBaseServiceObjects):
                    oldBaseServiceObjects = NewBaseServices.objects(
                        serviceName=dbInstance.serviceName,
                        **{"metadata__isLatest": False}
                    ).order_by('-added')

                if any(oldBaseServiceObjects):
                    oldBaseService = oldBaseServiceObjects[0]
                    oldBaseService.dbInstance.isLatest = True
                    oldBaseService.save()
                dbInstance.delete()
            except Exception as e:
                pass
        return True


    def updateBaseServiceObject(self, serviceId: str, **kwargs):
        try:
            args = {}
            for k, v in kwargs.items():
                args["set__{}".format(k)] = v
            NewBaseServices.objects(serviceId=serviceId).update(**args)
            return True
        except ValidationError:
            return False
