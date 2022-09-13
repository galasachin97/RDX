
import os
import sys
import datetime
import threading
from api.service.models import Camera, CameraHealthCheck
from api.service.helpers.logs import console_logger
from api.utils import scheduler, servicemanager
from api.utils import requesthandler
import shutil
import cryptocode
from config import Config
import urllib.parse
from api.utils import interval_manager

from api.utils import scheduler

pause_healthcheck = False


def send_camera_health_alert(camera, image_path):
    # generate camera alert of activity / inactivity at base
    camdata = Camera.objects(Camera_id=camera).first()
    new_camera_status = 'Camera connected' if camdata.Camera_status else 'Camera disconnected'
    camera_status = {
        "Camera_id": camera,
        "Camera_name": camdata.Camera_name,
        "Location": camdata.Location,
        "Service_id": "CAMV1",
        "Alert": new_camera_status,
        "Timestamp": str(camdata.TSmodified),
        "Image_path": [
            Config.STATIC_IMAGE if not image_path else image_path,
        ]
    }
    requesthandler.send_camera_alert(camera_status)
    return None


def encrypt_camera_password(password):
    return cryptocode.encrypt(password, Config.ACCESS_SECRET_KEY)


def decrypt(password):
    return cryptocode.decrypt(password, Config.ACCESS_SECRET_KEY)


def generate_rtsp(link, username, password):
    try:
        if username not in ["", None]:
            pUsername = urllib.parse.quote_plus(username)
            pPassword = urllib.parse.quote_plus(password)
            link = "rtsp://{}:{}@{}".format(pUsername,
                                            pPassword, "/".join(link.split("/")[2:]))

        return link
    except Exception as e:
        console_logger.debug(e)
        return 0


def check_cameras():
    try:
        healthObj = CameraHealthCheck.objects.first()
        if not healthObj.HealthCheck:
            console_logger.debug(
                "Camera Healthcheck Status:------------------------------------  {}".format(healthObj.HealthCheck))
            return 1
        else:
            status_changed = list()
            changend_cameras = set()
            for camera in Camera.objects():
                old_status = camera.Camera_status  # <------------ Old status of the camera
                link = camera.getRTSP()
                source = camera.Camera_source.lower()

                if source == 'mipi':
                    link = camera.Link[-1]
                status, image_path = requesthandler.camera_health(
                    link, source, True)
                camera.Camera_status = True if status else False
                camera.TSmodified = datetime.datetime.utcnow()
                camera.save()

                if old_status != camera.Camera_status:  # <---------- if camera status is changed then perform the activity
                    # <---------- append camera to changed camera list
                    changend_cameras.add(camera.Camera_id)
                    status_changed.append(1)
                    img_path = None
                    image_name = None
                    if image_path:
                        # copy image from the folder if there is no user consent then move image to alert folder
                        # <---------- get image name
                        image_name = image_path.split("/")[-1]
                        datestring = datetime.datetime.strftime(
                            datetime.datetime.now(), "%d-%m-%Y")
                        new_path = os.path.join(
                            os.getcwd(), 'ref_image', datestring, Config.ALERT_REPORT, camera.Camera_id)
                        if not os.path.exists(new_path):
                            os.makedirs(new_path)
                        path = os.path.join(new_path, image_name)
                        old_path = os.path.join(
                            os.getcwd(), 'ref_image', 'health', image_name)
                        img_path = os.path.join(
                            Config.ALERT_REPORT, datestring, camera.Camera_id, image_name)
                        # <--------- copy the image to new folder
                        shutil.copy(old_path, path)
                        # os.path.join(image_path,path)

                        if not healthObj.UserConsent:
                            # <--------- if user consent is false then remove old image
                            os.remove(old_path)
                    # <-------- Send alert using base service
                    if healthObj.HealthCheck:
                        # alert with camera image functionality
                        send_camera_health_alert(camera.Camera_id, image_name)
            if len(status_changed) > 0:
                scheduler.run_slot(
                    int(interval_manager.get_current_timeslot()))
            return 1

    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        return 0
