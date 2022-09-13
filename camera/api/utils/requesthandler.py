from api.utils import urls
import json
import requests
import time
from api.service.helpers.logs import console_logger
from api.service.helpers.general_helpers import retry
from api.utils import camservicehelpers


def send_activity_log(token, Action, Result="Success"):
    # send activity logs to user management
    payload = json.dumps({"Action": Action, "Result": Result})
    headers = {
        'Authorization': 'Bearer {}'.format(token),
        'Content-Type': 'application/json'
    }
    response = requests.request(
        "POST", urls.send_activity_log, headers=headers, data=payload)
    return response.status_code


# @retry(exceptions=(TimeoutError, requests.exceptions.ConnectionError, ConnectionRefusedError), delay=10, times=10)
def get_configs_from_base():
    # get device info from base
    try:
        console_logger.debug("getting config from base")
        headers = {
            'Content-Type': 'application/json'
        }
        response = requests.request(
            "GET", urls.get_device_info, headers=headers, timeout=10)
        if response.status_code == 200:
            return json.loads(response.content)
        else:
            return None
    except requests.RequestException:
        console_logger.debug("base api call fail")
        return None


def send_refresh_deepstream(data):
    headers = {
        'Content-Type': 'application/json'
    }
    payload = json.dumps(data)
    response = requests.request(
        "POST", urls.refresh_deepstreams, headers=headers, data=payload)
    if response.status_code == 200:
        return 1
    else:
        return 0


def activate_services(data):
    ''' Activating service list one by one to the service management '''
    console_logger.debug("active request: {}".format(data))
    if len(data) != 0:
        response = requests.request("POST",
                                    urls.activate_services,
                                    headers={
                                        'Content-Type': 'application/json'},
                                    data=json.dumps({"serviceId": data}))
        console_logger.debug(
            "******************** ACTIVATING_services serviceM - {} - {}".format(data, response.status_code))
        return
    else:
        console_logger.debug("got no service to activate")
        return []


def deactivate_services(data):
    ''' deactivate services at camera management '''
    try:
        if data != None and len(data) != 0:
            payload = json.dumps({"serviceIds": data})
            response = requests.request("POST",
                                        urls.deactivate_services,
                                        headers={
                                            'Content-Type': 'application/json'},
                                        data=payload,
                                        timeout=10)
            console_logger.debug(
                "******************** deactivating_services serviceM {} - {}".format(data, response.status_code))

            for service in data:
                camservicehelpers.ChangeServiceStatus(service, False)

            send_service_status()
            return
        return 1
    except requests.exceptions.ReadTimeout:
        return 1


def image_capture(Source, Link, ImgType):
    # image capture data using host server
    try:
        headers = {
            'Content-Type': 'application/json'
        }
        body = {
            "Source": Source,
            "Link": Link,
            "ImageType": ImgType
        }
        payload = json.dumps(body)
        response = requests.request(
            "POST", urls.image_capture, headers=headers, data=payload, timeout=30)
        console_logger.debug(
            "******************** capturing image at host :- {}".format(response.status_code))
        return json.loads(response.content).get("detail")
    except Exception as e:
        return 'False'


def camera_health(Link, Source, Consent):
    # capture image using bool as result
    try:
        headers = {
            'Content-Type': 'application/json'
        }
        body = {
            "Source": Source,
            "Link": Link,
            "Consent": Consent
        }
        payload = json.dumps(body)
        response = requests.request(
            "POST", urls.health_check, headers=headers, data=payload, timeout=30)
        console_logger.debug(
            "******************** camera health at host :- {}".format(response.status_code))
        data = json.loads(response.content)

        return data.get("detail"), data.get("image_path")
    except Exception as e:
        console_logger.debug(e)
        return False, None


def camera_health_with_image(Link, Source):
    # capture image in healthcheck
    try:
        headers = {
            'Content-Type': 'application/json'
        }
        body = {
            "Source": Source,
            "Link": Link,
            "Consent": True
        }
        payload = json.dumps(body)
        response = requests.request(
            "POST", urls.health_check, headers=headers, data=payload, timeout=30)
        console_logger.debug(
            "******************** camera health with image at host :- {}".format(response.status_code))
        return json.loads(response.content).get('detail')
    except Exception as e:
        console_logger.debug(e)
        return 'False'


def usb_list():
    # get usb list from host settings
    headers = {
        'Content-Type': 'application/json'
    }
    response = requests.request("GET", urls.usb_list, headers=headers)

    return json.loads(response.content)


def send_camera_alert(data):
    # send direct alert to camera to send email
    headers = {
        'Content-Type': 'application/json'
    }
    response = requests.request(
        "POST", urls.send_camera_alert, headers=headers, data=json.dumps(data), timeout=10)
    console_logger.debug(
        "******************** sending camera alert at base :- {}".format(response.status_code))
    return response


def send_service_status():
    # send direct alert to camera to send email
    data = {"detail": camservicehelpers.GetAllServiceStatus()}
    headers = {
        'Content-Type': 'application/json'
    }
    response = requests.request(
        "POST", urls.service_status, headers=headers, data=json.dumps(data), timeout=10)
    console_logger.debug(
        "******************** sending service status to socket :- {}".format(response.status_code))
    return response


def send_camera_modules(data):
    """
    Whenever new camera will get added or usecase will get added, updated or removed
    this api will be called
    """
    headers = {
        'Content-Type': 'application/json'
    }
    payload = json.dumps(data)
    response = requests.request(
        "PUT", urls.send_socket, data=payload, headers=headers, timeout=10)
    console_logger.debug(
        "*********************** PUT api to socket server sending one camera data at a time: {}".format(response.status_code))
    return response


def send_camera_modules_many(data):
    """
    Whenever new camera will get added or usecase will get added, updated or removed
    this api will be called
    """
    headers = {
        'Content-Type': 'application/json'
    }
    for _data in data:
        payload = json.dumps(_data)
        response = requests.request(
            "PUT", urls.send_socket, data=payload, headers=headers, timeout=10)
        console_logger.debug(
            "******************** camera_modules to socket server response: {}".format(response.status_code))
    return response


def change_of_schedule(data):
    # send current schedule hours to socket
    try:
        headers = {
            'content-type': 'application/json'
        }
        payload = json.dumps({"current_hours": data})
        response = requests.request(
            "POST", urls.send_schedule, data=payload, headers=headers)
        console_logger.debug(
            "********************* send change of schedule to socket: {}".format(response.status_code))
        return response
    except requests.exceptions.ConnectionError:
        time.sleep(20)
        response = requests.request(
            "POST", urls.send_schedule, data=payload, headers=headers)
        console_logger.debug(response.status_code)
        return response


def get_user_consent():
    # get user consent from base service
    headers = {
        "content-type": "application/json"
    }
    response = requests.request(
        "GET", "consent url", headers=headers, timeout=10)
    return json.loads(response.content)


def factory_reset_base():
    headers = {
        "content-type": "application/json"
    }
    response = requests.request("POST", "reset url")


def trigger_socket_schedule():
    # update schedule hours to socket server
    headers = {
        "content-type": "application/json"
    }

    response = requests.request(
        "GET", urls.send_schedule, headers=headers, timeout=10)
    return json.loads(response.content)


def delete_modules_socket(data):
    # send newly added modules to socket
    headers = {
        "content-type": "application/json"
    }
    console_logger.debug("Trigger Delete Endpint")
    payload = json.dumps(data)
    response = requests.request(
        "DELETE", urls.send_modules, data=payload, headers=headers, timeout=10)
    return 0


def delete_camera_socket(data):
    # delete camera metadata from socket server
    try:
        headers = {"content-type": "application/json"}

        payload = {"camera_id": data}
        response = requests.request("DELETE", urls.send_socket, params=payload, headers={
                                    "content-type": "application/json"}, timeout=10)
        console_logger.debug(
            "******************** removing one camera from socket :- {}".format(response.status_code))
        return 0
    except Exception as e:
        return 0


def delete_camera_socket_many(cameras):
    ''' delete many cameras from socket metadata '''
    try:
        for camera in cameras:
            response = requests.request("DELETE", urls.send_socket, params={
                                        "camera_id": camera}, headers={"content-type": "application/json"}, timeout=10)
            console_logger.debug(
                "******************** removing cameras fom socket one by one :- {}".format(response.status_code))
        return 0
    except Exception as e:
        return 0


def restart_service_socket(data):
    # restart service at socket server
    headers = {
        "content-type": "application/json"
    }

    payload = {"service_ids": data}

    response = requests.request("POST", urls.restart_service, data=json.dumps(
        payload), headers=headers, timeout=10)

    return 0


def stop_service_socket(usecase=None, parent=[]):
    # delete usecase from socket server
    headers = {
        "content-type": "application/json"
    }
    payload = {"usecase_id": usecase, "parent_ids": parent}

    response = requests.request(
        "DELETE", urls.send_modules, params=payload, headers=headers, timeout=10)
    console_logger.debug(
        "******************** DELETE usecases from socket server :- {}".format(response.status_code))
    return 0


def stop_service_socket_many(usecaselist=[], parent=[], camera_id=None):
    # delete usecase from socket server
    headers = {
        "content-type": "application/json"
    }
    for usecase in usecaselist:
        payload = {"usecase_id": usecase,
                   "parent_ids": parent, "camera_id": camera_id}
        response = requests.request(
            "DELETE", urls.send_modules, params=payload, headers=headers, timeout=10)
        console_logger.debug(
            "******************** DELETE camera services from socket one at a time :- {}".format(response.status_code))
    return 0


def stop_usecase_socket(service_id):
    # remove usecase to socket
    headers = {
        "content-type": "application/json"
    }
    payload = {"service_id": service_id}
    response = requests.request("POST", urls.give_updates_to_service,
                                headers=headers, data=json.dumps(payload), timeout=10)
    console_logger.debug(
        "******************** POST update usecase at socket :- {}".format(response.status_code))

    return 1


def restart_usecase_socket(service_id):
    # send updated modules to socket server
    headers = {
        "content-type": "application/json"
    }
    payload = {"service_id": service_id}
    response = requests.request(
        "POST", urls.give_updates_to_service, data=json.dumps(payload), timeout=10)
    console_logger.debug(
        "******************** POST updated modules to socket :- {}".format(response.status_code))
    return 1


def send_camera_alert_priority(data):
    # send camera alert to save in base container

    headers = {
        "content-type": "application/json"
    }
    response = requests.request(
        "POST", urls.send_camera_alert_url, data=json.dumps(data), timeout=10)
    console_logger.debug(
        "******************** POST priority alert to base :- {}".format(response.status_code))
    return 1


def send_usecase_parameters(data):
    # send usecase added parameters to socket server
    try:
        headers = {
            "content-type": "application/json"
        }
        response = requests.request(
            "POST", urls.update_parameters, headers=headers, data=json.dumps(data), timeout=10)
        console_logger.debug(
            "******************** POST sending usecase params to socket :- {}".format(response.status_code))
        return 1
    except Exception as e:
        return 1


@retry(exceptions=(TimeoutError, ConnectionError, ConnectionRefusedError), delay=1, times=3)
def trigger_cloud_sync():
    try:
        headers = {
            "content-type": "application/json"
        }
        response = requests.request(
            "GET", urls.send_sync_trigger, headers=headers, timeout=10)
    except Exception as e:
        return 1


def delete_acknowlegment():
    try:
        headers = {
            "content-type": "application/json"
        }
        response = requests.request(
            "DELETE", urls.delete_acknowlegement, headers=headers, timeout=10)
        console_logger.debug(
            "******************** DELETE removing socket ack :- {}".format(response.status_code))
    except Exception as e:
        return 1


def get_services():
    try:
        headers = {
            "content-type": "application/json"
        }
        params = {"type": "Usecase", "packagedData": True, "all": True}
        response = requests.request(
            "get", urls.get_services_full, params=params, headers=headers, timeout=10)
        console_logger.debug(
            "******************** GET services from serviceM :- {}".format(response.status_code))
        return json.loads(response.content)["detail"]
    except Exception as e:
        return 1
