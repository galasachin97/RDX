from mongoengine import Document
from mongoengine.fields import *
import datetime


class Services(Document):
    serviceId = StringField()
    serviceName = StringField()
    serviceType = StringField()
    description = StringField()
    metadata = DictField()
    installedVersion = StringField()
    availableVersion = StringField()
    validity = DateTimeField()
    status = StringField()
    added = DateTimeField()

    def dependentServiceName(self, packagedData):
        serviceTypes = ["Base", "Usecase", "AI",
                        "Firmware", "Analytics", "Database"]
        serviceNames = []
        for type in serviceTypes:
            for serviceId in packagedData[type]:
                serviceNames.append(__class__.objects.get(
                    serviceId=serviceId).serviceName)
        return serviceNames

    def payload(self):
        return {
            "Service_id": self.serviceId,
            # "Service_name": self.serviceName.replace("_", " "),
            "Service_name": self.serviceName,
            "Service_type": self.serviceType,
            "Description": self.description,
            "Status": self.status,
            "validity": self.validity.strftime("%d/%m/%Y %H:%M:%S"),
            "Icon": self.metadata["icon"] if "icon" in self.metadata else None,
            "Version": self.installedVersion,
            "Dependent_services": self.dependentServiceName(self.metadata["packagedServiceIds"]),
            "Update_available": True if self.availableVersion != self.installedVersion else False
        }

    def packagedMetadataPayload(self):
        serviceTypes = ["Base", "Usecase", "AI",
                        "Firmware", "Analytics", "Database"]
        serviceIds = {}
        for type in serviceTypes:
            serviceIds[type] = []
            for serviceId in self.metadata["packagedServiceIds"][type]:

                serviceIds[type].append(
                    # __class__.objects.get(serviceId=serviceId).serviceName.replace(" ", "_")
                    __class__.objects.get(serviceId=serviceId).serviceName
                )

        return {
            "Service_name": self.serviceName,
            # "Service_id": self.serviceName.replace(" ", "_"),
            "Service_id": self.serviceName,
            "Service_type": self.serviceType,
            "Description": self.description,
            "Status": self.status,
            "validity": self.validity.strftime("%d/%m/%Y %H:%M:%S"),
            "Icon": self.metadata["icon"] if "icon" in self.metadata else None,
            "Version": self.installedVersion,
            "Dependent_services": serviceIds,
            "Update_available": True if self.availableVersion != self.installedVersion else False
        }

class NewBaseServices(Document):
    serviceId = StringField()
    serviceName = StringField()
    serviceType = StringField()
    description = StringField()
    metadata = DictField()
    installedVersion = StringField()
    availableVersion = StringField()
    validity = DateTimeField()
    status = StringField()
    added = DateTimeField(default=datetime.datetime.utcnow())


# class NewServices(Document):
#     serviceId = StringField()
#     serviceName = StringField()
#     serviceType = StringField()
#     description = StringField()
#     metadata = DictField()
#     installedVersion = StringField()
#     availableVersion = StringField()
#     validity = DateTimeField()
#     status = StringField()
#     added = DateTimeField(default=datetime.datetime.utcnow())

#     def dependentServiceName(self, packagedData):
#         serviceTypes = ["Base", "Usecase", "AI",
#                         "Firmware", "Analytics", "Database"]
#         serviceNames = []
#         for type in serviceTypes:
#             for serviceId in packagedData[type]:
#                 serviceNames.append(__class__.objects.get(
#                     serviceId=serviceId).serviceName)
#         return serviceNames

#     def payload(self):
#         return {
#             "Service_id": self.serviceId,
#             # "Service_name": self.serviceName.replace("_", " "),
#             "Service_name": self.serviceName,
#             "Service_type": self.serviceType,
#             "Description": self.description,
#             "Status": self.status,
#             "validity": self.validity.strftime("%d/%m/%Y %H:%M:%S"),
#             "Icon": self.metadata["icon"] if "icon" in self.metadata else None,
#             "Version": self.installedVersion,
#             "Dependent_services": self.dependentServiceName(self.metadata["packagedServiceIds"]),
#             "Update_available": True if self.availableVersion != self.installedVersion else False
#         }

#     def packagedMetadataPayload(self):
#         serviceTypes = ["Base", "Usecase", "AI",
#                         "Firmware", "Analytics", "Database"]
#         serviceIds = {}
#         for type in serviceTypes:
#             serviceIds[type] = []
#             for serviceId in self.metadata["packagedServiceIds"][type]:

#                 serviceIds[type].append(
#                     # __class__.objects.get(serviceId=serviceId).serviceName.replace(" ", "_")
#                     __class__.objects.get(serviceId=serviceId).serviceName
#                 )
#         return {
#             "Service_name": self.serviceName,
#             # "Service_id": self.serviceName.replace(" ", "_"),
#             "Service_id": self.serviceName,
#             "Service_type": self.serviceType,
#             "Description": self.description,
#             "Status": self.status,
#             "validity": self.validity.strftime("%d/%m/%Y %H:%M:%S"),
#             "Icon": self.metadata["icon"] if "icon" in self.metadata else None,
#             "Version": self.installedVersion,
#             "Dependent_services": serviceIds,
#             "Update_available": True if self.availableVersion != self.installedVersion else False
#         }


class Taskmeta(Document):
    Task_name = StringField()
    Task_time = DateTimeField()
    Status = StringField()
    Traceback = StringField()


class SystemUpdateTime(Document):
    time = StringField(default="00:00")
    auto_update = BooleanField(default=True)

    def get_time(self):
        return datetime.datetime.strptime(self.time, '%H:%M').time()

    def payload(self):
        return {
            "time": self.time,
            "auto_update": self.auto_update
        }

class SystemUpdateInfo(Document):
    currentVersion = StringField()
