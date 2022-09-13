from api.service.helpers.logs import console_logger
from api.service.models import TimeSlots, Global, Local, Camera, Module, ServiceStatus
from api.service import routes
from api.utils import requesthandler

from datetime import datetime
import os
import sys
import shutil


time_hrs = ("00:00", "02:00", "04:00", "06:00", "08:00", "10:00",
            "12:00", "14:00", "16:00", "18:00", "20:00", "22:00")


def convert_timeslots_to_date(dateObject) -> list:
    date_list = []
    console_logger.debug(dateObject)
    for timeslot in time_hrs:
        date_list.append(datetime.strptime(datetime.strftime(
            dateObject.date(), "%d/%m/%Y ")+"{}".format(timeslot), "%d/%m/%Y %H:%M"))
    return date_list


def get_current_timeslot():
    job_list = routes.sched.get_jobs(pending=True)
    pending_job_list = []
    for job in job_list:
        if job.name == "slots":
            pending_job_list.append(job.args[0])
    return pending_job_list[0]-1


def set_timeslots_default():
    slot_list = []
    for slot in routes.timeslots:
        g_data = Global(Cameras=[], Usecases=[], Dependent=[], AI=[]).save()
        slot_list.append(TimeSlots(**{"TimeSlot": slot, "Global": g_data}))
    console_logger.debug(slot_list)
    TimeSlots.objects.insert(slot_list)


class TimeSlotManager():

    def get_slot_info(self, slot):
        try:
            t_slot = TimeSlots.objects.get(TimeSlot=slot)
            data = {
                slot: {
                    "global": {},
                    "local": {}
                }
            }
            data[slot]["global"] = t_slot.Global.payload()
            if any(t_slot.Local):
                for d in t_slot.Local:
                    data[slot]["local"].update(d.payload())
            return data[slot]
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))

    def get_all_timeslots(self):
        all = {}
        for slot in routes.timeslots:
            all[slot] = self.get_slot_info(slot)
        return all

    def update_global(self, slot):
        t_slot = TimeSlots.objects.get(TimeSlot=slot)
        cameras = set()
        usecases = set()
        dependents = set()
        ai = set()
        if any(t_slot.Local):
            for d in t_slot.Local:
                if not any(t_slot.Local):
                    pass
                cameras.add(d.CameraID)
                usecases.update(set(d.Usecases))
                dependents.update(set(d.Dependent))
                ai.update(set(d.AI))
        t_slot.Global.update(Cameras=list(cameras))
        t_slot.Global.update(Usecases=list(usecases))
        t_slot.Global.update(Dependent=list(dependents))
        t_slot.Global.update(AI=list(ai))

    def delete_camera(self, camera_id):
        try:
            usecases = set()
            ai = set()
            for slot in TimeSlots.objects():
                for OLocal in slot.Local:
                    if OLocal.CameraID == camera_id:
                        usecases.update(set(OLocal.Usecases))
                        ai.update(set(OLocal.AI))
                        slot.update(pull__Local=OLocal)
                        OLocal.delete()
                        # slot.Global.update(pull__CameraID=camera_id)
            return usecases, ai
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))

    def delete_camera_slot(self, slot, camera_id):
        try:
            t_slot = TimeSlots.objects.get(TimeSlot=slot)
            if any(t_slot.Local):
                for d in t_slot.Local:
                    if d.CameraID == camera_id:
                        t_slot.update(pull__Local=d)
                        d.delete()
            return
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))

    def update_local_camera(self, slot, camera_id, data):
        try:
            Found = False
            t_slot = TimeSlots.objects.get(TimeSlot=slot)
            if any(t_slot.Local):
                for d in t_slot.Local:
                    if d.CameraID == camera_id:
                        Found = True
                        if any(data):
                            d.update(**data)
                        else:
                            t_slot.update(pull__Local=d)
                            d.delete()
            if not Found:
                data.update({"CameraID": camera_id, "Status": True})
                local = Local(**data).save()
                t_slot.update(push_all__Local=[local])
            return
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))

    def get_difference(self, old, new):
        console_logger.debug(old)
        console_logger.debug(new)
        deactivate_uc = set(old["global"]["Usecases"]).difference(
            set(new["global"]["Usecases"]))
        deactivate_ds = set(old["global"]["AI"]).difference(
            set(new["global"]["AI"]))
        deactivate_dep = set(old["global"]["Dependent"]).difference(
            set(new["global"]["Dependent"]))
        if any(deactivate_dep):
            deactivate_dep.difference_update(set(new["global"]["Usecases"]))
            console_logger.debug(new["global"]["Usecases"])
            console_logger.debug(deactivate_dep)
            # if not any(set(new["global"]["Usecases"]).intersection(deactivate_dep)):
            deactivate_uc.update(deactivate_dep)

        console_logger.debug(deactivate_uc)
        console_logger.debug(deactivate_ds)

    def validate_slot(self, slot, camera_id, input):
        ''' validate slot limit according to device limit by base '''
        try:
            current_data = self.get_slot_info(slot)
            usecases = set()
            dependents = set()
            ai = set()
            if input.get("Usecases"):
                usecases.update(set(input["Usecases"]+input["Dependent"]))
                ai.update(set(input["AI"]))

            for camera in current_data["local"]:
                if camera_id not in current_data["global"]["Cameras"]:
                    usecases.update(
                        set(current_data["local"][camera]["Usecases"]))
                    usecases.update(
                        set(current_data["local"][camera]["Dependent"]))
                    ai.update(set(current_data["local"][camera]["AI"]))

            if len(usecases) > routes.ALLOWED_USE_CASES or len(ai) > routes.ALLOWED_DEEPSTREAM_CONTAINERS:
                console_logger.debug(
                    "************* usecase limit validation failed")
                return False
            return True
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))


time_manager = TimeSlotManager()


class check_difference:

    def __init__(self, camera_id) -> None:
        self.camera_id = camera_id
        self.old_usecases = self.retrive_data(TimeSlots.objects)

    def new_object(self):
        self.new_usecases = self.retrive_data(TimeSlots.objects)
        difference = self.old_usecases.difference(self.new_usecases)
        if any(difference):
            return difference, self.new_usecases
        return [], self.new_usecases

    def retrive_data(self, inst):
        usecases = set()
        for slot in inst:
            for Ocamera in slot.Local:
                if Ocamera.CameraID == self.camera_id:
                    usecases.update(set(Ocamera.Usecases))
        return usecases


class CameraHandler:

    def __init__(self, camera_id, difference=[], all_modules=[None]) -> None:
        self.cameraObject = Camera.objects.get(Camera_id=camera_id)
        self.all_modules = set(all_modules) if any(all_modules) else set()
        self.previous_modules = set()
        self.difference = set(difference) if any(difference) else set()
        self.servicedata = None

    def remove_usecase(self):
        ''' remove deleted module from camera module list '''
        if not any(self.difference):
            for module in self.cameraObject.Modules:
                self.previous_modules.add(module.ServiceID)
        else:
            for module in self.cameraObject.Modules:
                for usecase in self.difference:
                    self.previous_modules.add(module.ServiceID)
                    if module.ServiceID == usecase:
                        self.cameraObject.update(pull__Modules=module)
                        module.delete()

        self.add_usecase()
        return

    def get_parent_details(self, serviceid):
        ''' return parent container list of service id '''
        parent_list = []
        for service in self.servicedata:
            if service["Service_id"] == serviceid:
                for parent in service["Dependent_services"]:
                    if not parent == "Database":
                        parent_list.extend(
                            service["Dependent_services"][parent])
        return list(set(parent_list))

    def add_usecase(self):
        ''' add usecase in camera module list (make parents into list)'''

        if not self.servicedata:
            self.servicedata = requesthandler.get_services()

        new_modules = self.all_modules.difference(self.previous_modules)
        objectList = []
        if any(new_modules):
            for module in new_modules:
                parents = self.get_parent_details(module)
                mod = Module(ServiceID=module,
                             ParentContainerID=parents).save()
                objectList.append(mod)
        if any(objectList):
            self.cameraObject.update(push_all__Modules=objectList)
        return

    def delete_camera_usecases(self, camera_id=None):
        ''' delete usecase module from camera '''
        for module in self.cameraObject.Modules:
            module.delete()

        for images in self.cameraObject.RefImage:
            images.delete()

        image = os.path.join('ref_image', self.cameraObject.Camera_name)
        if os.path.exists(image):
            shutil.rmtree(image)
        self.cameraObject.delete()
        return


def get_camera_service_slots(camera_id, service_id):
    # data = []
    slot_data = {}
    for slot in TimeSlots.objects():
        slot_data[slot.TimeSlot] = None
        for local in slot.Local:
            if local.CameraID == camera_id:
                if service_id in local.Usecases:
                    slot_data[slot.TimeSlot] = local.CameraID
    # console_logger.debug(slot_data)
    return slot_data


class CameraServiceManager:

    def get_slot_services(self):
        services = {}
        for camera in Camera.objects():
            services[camera] = set()
            for slot in routes.new_slots:
                slotData = TimeSlotManager().get_slot_info(slot)
            services[camera].update(set(slotData["local"][camera]["Usecases"]))

        return services

    def get_camera_modules(self):
        for camera in Camera.objects():
            for module in camera.Modules:
                yield module, camera

    def get_modules(self):
        for module in self.get_camera_modules():
            pass

    def retrive_camera_services(self, cameras=None):
        ''' retrive all camera services '''
        module_list = []
        if cameras:
            for camera in Camera.objects(Camera_id__in=cameras):
                for module in camera.Modules:
                    module_list.append(module.ServiceID)
                    module_list.extend(module.ParentContainerID)
            return list(set(module_list))
        for camera in Camera.objects():
            for module in camera.Modules:
                module_list.append(module.ServiceID)
                module_list.extend(module.ParentContainerID)
        return list(set(module_list))


class CurrentSlotManager:

    def __init__(self) -> None:
        self.camera_objects = Camera.objects()
        self.cameras = self.get_camera_metadata()

    def get_camera_metadata(self):
        _camera_dict = {}
        for camera in self.camera_objects:
            if camera.Camera_status == True:
                _camera_dict[camera.Camera_id] = camera
        return _camera_dict

    def get_current_slot(self):
        ''' get current running slot '''
        job_list = routes.sched.get_jobs(pending=True)
        if not job_list:
            job_list = routes.sched.get_jobs(pending=True)
        pending_job_list = []
        if job_list:
            for job in job_list:
                if job.name == "slots":
                    pending_job_list.append(job.args[0])
        return routes.timeslots[pending_job_list[0]-1]

    def get_usecases_from_inactive_slots(self, current_slot=None):
        try:
            usecases = set()
            ai = set()
            cameras = set()

            if not current_slot:
                current_slot = self.get_current_slot()

            for timeslot in TimeSlots.objects():
                if not timeslot.TimeSlot == current_slot and any(timeslot.Local):
                    for local_slot in timeslot.Local:
                        if local_slot.CameraID not in self.cameras:
                            cameras.add(local_slot.CameraID)
                        usecases.update(local_slot.Usecases)
                        ai.update(local_slot.AI)
                        usecases.update(local_slot.Dependent)

            return usecases, ai, cameras
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            return False

    def retrive_camera_meta(self, camera_id, local_slot):
        _camera_meta = {}
        _camera_meta["usecases"] = []
        self.cameras = self.get_camera_metadata()

        for module in self.cameras[camera_id].Modules:
            _camera_meta["camera_id"] = camera_id
            _camera_meta["link"] = self.cameras[camera_id].getRTSP()
            _camera_meta["camera_name"] = self.cameras[camera_id].Camera_name
            _camera_meta["location"] = self.cameras[camera_id].Location

            _module_data = dict()
            if module.ServiceID in local_slot.Usecases:
                _module_data["service_id"] = module.ServiceID
                _module_data["parent_ids"] = module.ParentContainerID
                _module_data["scheduled"] = True
                _module_data["runtime"] = 1

            _camera_meta["usecases"].append(_module_data)

        return _camera_meta

    def get_usecases_from_current_slot(self, current_slot=None):
        try:
            usecases = set()
            ai = set()
            cameras = set()
            camera_metadata = []

            if not current_slot:
                current_slot = self.get_current_slot()

            if not any(TimeSlots.objects):
                set_timeslots_default()
            t_slot = TimeSlots.objects.get(TimeSlot=current_slot)

            if any(t_slot.Local):
                for local_slot in t_slot.Local:
                    camera_meta = {}
                    if local_slot.CameraID in self.cameras:
                        camera_meta = self.retrive_camera_meta(
                            local_slot.CameraID, local_slot)
                        usecases.update(local_slot.Usecases)
                        ai.update(local_slot.AI)
                        usecases.update(local_slot.Dependent)
                        cameras.add(local_slot.CameraID)
                        camera_metadata.append(camera_meta)
            return usecases, ai, cameras, camera_metadata
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            return False

    def get_camera_data_from_current_slot(self, camera_id):
        usecases = set()
        ai = set()
        t_slot = TimeSlots.objects.get(TimeSlot=self.get_current_slot())
        for local_slot in t_slot.Local:
            if local_slot.CameraID == camera_id:
                usecases.update(local_slot.Usecases)
                usecases.update(local_slot.Dependent)
                ai.update(local_slot.AI)
        return usecases, ai

    def get_usecases_from_slot(self, slot):
        usecases = set()
        ai = set()
        cameras = set()
        if not any(TimeSlots.objects):
            set_timeslots_default()
        t_slot = TimeSlots.objects.get(TimeSlot=slot)
        usecases.update(t_slot.Global.Usecases)
        ai.update(t_slot.Global.AI)
        usecases.update(t_slot.Global.Dependent)
        cameras.add(t_slot.Global.Cameras)
        return usecases, ai, cameras

    def map_current_slot_camera_services(self, camera_list):
        try:
            cam_data = list()
            service_list = requesthandler.get_services()

            for camera in camera_list:
                cam_object = Camera.objects.get(Camera_id=camera)
                data = {"camera_id": cam_object.Camera_id,
                        "link": cam_object.Link,
                        "camera_name": cam_object.Camera_name,
                        "location": cam_object.Location,
                        "usecases": []
                        }
                for module in cam_object.Modules:
                    for service in service_list:
                        if module.ServiceID == service["Service_id"]:
                            data["usecases"].append(
                                {"service_id": module.ServiceID,
                                 "parent_ids": service["Dependent_services"]["AI"],
                                 "scheduled": True,
                                 "runtime": 1}
                            )
                cam_data.append(data)
            return cam_data
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))


def map_service_data(camera_list):
    try:
        cam_data = list()
        service_list = requesthandler.get_services()

        for camera in camera_list:
            console_logger.debug(camera)
            cam_object = Camera.objects.get(Camera_id=camera)
            data = {"camera_id": cam_object.Camera_id,
                    "link": cam_object.getRTSP(),
                    "camera_name": cam_object.Camera_name,
                    "location": cam_object.Location,
                    "usecases": []
                    }
            for module in cam_object.Modules:
                for service in service_list:
                    if module.ServiceID == service["Service_id"]:
                        data["usecases"].append(
                            {"service_id": module.ServiceID,
                             "parent_ids": service["Dependent_services"]["AI"],
                             "scheduled": True,
                             "runtime": 1}
                        )
            cam_data.append(data)
        return cam_data
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))


class ServiceStatusManager:

    def __init__(self) -> None:
        self.timeslots = routes.new_slots

    def createservicestatus(self, servicelist):
        console_logger.debug(
            "****************** setting service status to false by default")
        for service in servicelist:
            if not any(ServiceStatus.objects(ServiceName=service)):
                ServiceStatus(ServiceName=service, Status=False).save()
        return

    def SetServiceStatusFalse(self):
        if any(ServiceStatus.objects()):
            for service in ServiceStatus.objects():
                service.update(Status=False)
        return

    def DeleteServicesStatus(self, serviceList):
        console_logger.debug("deleting from service status")
        console_logger.debug(serviceList)
        for service in serviceList:
            if any(ServiceStatus.objects(ServiceName=service)):
                ServiceStatus.objects(ServiceName=service).first().delete()
        return
