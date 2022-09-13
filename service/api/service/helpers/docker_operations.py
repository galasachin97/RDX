import json
import time
from urllib import response
import requests_unixsocket
import os

from api.service.helpers.logs import console_logger


class DockerContainerHandler:
    def __init__(self) -> None:
        self.url = "http+unix://%2Fvar%2Frun%2Fdocker.sock"

        self.session = requests_unixsocket.Session()

    def fetch_containers(self, type=["running"], all=True, **kwargs):
        dictionary = {}

        params = {"filters": json.dumps({"status": type})}
        resp = self.session.get("{}/containers/json".format(self.url), params=params)

        queriedContainer = None
        if "container_name" in kwargs:
            queriedContainer = kwargs["container_name"]

        for container in json.loads(resp.text):
            containerName = container["Names"][0].split("/")[1].split(".")[0]
            dictionary[containerName] = {
                "id": container["Id"],
                "image": container["Image"],
            }
            if containerName == queriedContainer:
                return {containerName: dictionary[containerName]}

        if "container_name" in kwargs:
            return {}

        if all:
            return dictionary
        else:
            return {}

    def create_container(self, containerName, parameters):
        # console_logger.debug(self.fetch_containers({"container_name":containerName}))
        # if containerName:
        #     try:
        #         self.stop_container(containerName)
        #     except Exception as e:
        #         console_logger.debug(e)
        try:
            container_id = None

            params = {"name": containerName}
            headers = {"content-type": "application/json"}

            resp = self.session.post(
                "{}/containers/create".format(self.url),
                params=params,
                data=json.dumps(parameters),
                headers=headers,
            )
            console_logger.debug(resp.text)
            time.sleep(5)
            if resp.status_code == 201:
                console_logger.debug(json.loads(resp.text))
                container_id = json.loads(resp.text)["Id"]
            return container_id
        except Exception as e:
            console_logger.debug(e)
            return None

    def start_container(self, containerId, containerName=None):
        try:
            console_logger.debug(containerId)
            headers = {"content-type": "application/json"}

            res = self.session.post(
                "{}/containers/{}/start".format(self.url, containerId), headers=headers
            )
            time.sleep(10)
            console_logger.debug(res.text)
            console_logger.debug(res.status_code)
            if res.status_code == 204:
                return True
            else:
                return False
        except Exception as e:
            console_logger.debug(e)
            return False

    def stop_container(self, containerName):
        try:
            params = {"force": True}
            r = self.session.delete(
                "{}/containers/{}".format(self.url, containerName), params=params
            )
            return r.status_code
        except Exception as e:
            console_logger.debug(e)
            return False

    def run_command(self, id):
        payload = {"Detach": True, "Tty": False}
        res = self.session.post(
            "{}/exec/{}/start".format(self.url, id),
            headers={"content-type": "application/json"},
            data=json.dumps(payload),
        )
        if res.status_code == 200:
            return True
        else:
            return False

    def execute_command(self, containerName, command):
        payload = {
            "AttachStdin": True,
            "AttachStdout": True,
            "AttachStderr": True,
            "DetachKeys": "ctrl-p,ctrl-q",
            "Tty": True,
            "Cmd": ["bin/bash", "-c", command],
            "Privileged": True,
            "User": "root",
        }
        res = self.session.post(
            "{}/containers/{}/exec".format(self.url, containerName),
            headers={"content-type": "application/json"},
            data=json.dumps(payload),
        )
        if res.status_code == 201:
            command_id = json.loads(res.text)["Id"]
            if self.run_command(command_id):
                return True
            else:
                return False
        else:
            return False

    def fetch_logs(self, containerId, **kwargs):
        try:
            params = {}
            if any(kwargs):
                params.update(kwargs)
            r = self.session.get(
                "{}/containers/{}/logs".format(self.url, containerId), params=params
            )
            return r.status_code, r.text
        except Exception as e:
            console_logger.debug(e)
            return False

    def inspect_container(self, containerName: str):
        try:
            params = {}
            response = self.session.get(
                "{}/containers/{}/json".format(self.url, containerName), params=params
            )
            return response.status_code, json.loads(response.text)
        except Exception as e:
            console_logger.debug(e)
            return False


class DockerImageHandler:
    def __init__(self) -> None:
        self.url = "http+unix://%2Fvar%2Frun%2Fdocker.sock"
        self.session = requests_unixsocket.Session()

    def fetch_image_details(self, image=None):
        try:
            params = {}
            if image:
                params = {"filters": json.dumps({"reference": [image]})}
            response = self.session.get(
                "{}/images/json".format(self.url), params=params
            )
            return json.loads(response.text)
        except Exception as e:
            console_logger.debug(e)
            return str(e)

    def create_image(self, image: str) -> bool:
        try:
            if any(self.fetch_image_details(image=image)):
                return True

            headers = {"content-type": "application/json"}
            params = {"fromImage": image}
            response = self.session.post(
                "{}/images/create".format(self.url), params=params, headers=headers
            )
            if response.text and response.text.find("error") != -1:
                return False
            if response.status_code == 200:
                return True
            return False
        except Exception as e:
            console_logger.debug(e)
            return False

    def delete_image(self, image: str) -> bool:
        try:
            console_logger.debug(image)
            headers = {"content-type": "application/json"}
            response = self.session.delete(
                "{}/images/{}".format(self.url, image), headers=headers
            )
            # console_logger.debug(response.text)
            # if response.status_code == 200:
            return True
            # return False
        except Exception as e:
            console_logger.debug(e)
            return False


class DockerTaskHandler:
    def __init__(self) -> None:
        self.url = "http+unix://%2Fvar%2Frun%2Fdocker.sock"
        self.session = requests_unixsocket.Session()

    def fetch_task_status(self, serviceName):
        params = {"filters": json.dumps({"service": [serviceName]})}
        res = self.session.get("{}/tasks".format(self.url), params=params)
        if res.status_code == 200:
            data = json.loads(res.text)
            if len(data) != 0:
                return data[-1]["Status"]["State"]
            else:
                return "not_running"
        else:
            return "not_running"

    def fetch_service_update_task_status(self, serviceName):
        params = {"filters": json.dumps({"service": [serviceName]})}
        res = self.session.get("{}/tasks".format(self.url), params=params)
        if res.status_code == 200:
            data = json.loads(res.text)
            if len(data) != 0:
                return data[0]
            else:
                return "not_running"
        else:
            return "not_running"


class DockerServiceHandler:
    def __init__(self) -> None:
        self.url = "http+unix://%2Fvar%2Frun%2Fdocker.sock"
        self.session = requests_unixsocket.Session()

    def fetch_service_details(self, serviceName, **kwargs):
        params = {"filters": json.dumps({"name": [serviceName]})}
        if "status" in kwargs:
            params["status"] = kwargs["status"]
        res = self.session.get("{}/services".format(self.url), params=params)
        return json.loads(res.text)

    def fetch_service_version(self, serviceName):
        try:
            console_logger.debug(serviceName)
            params = {"filters": json.dumps({"name": [serviceName]})}
            res = self.session.get("{}/services".format(self.url), params=params)
            data = json.loads(res.text)
            return data[0]["Version"]["Index"]
        except Exception as e:
            console_logger.debug(e)
            return None

    def create_service(self, parameters: dict):
        try:
            headers = {"content-type": "application/json"}
            response = self.session.post(
                "{}/services/create".format(self.url),
                data=json.dumps(parameters),
                headers=headers,
            )
            console_logger.debug(response.text)
            return True
        except Exception as e:
            console_logger.debug(e)
            return False

    def remove_service(self, serviceName):
        try:
            response = self.session.delete(
                "{}/services/{}".format(self.url, serviceName)
            )
            console_logger.debug(response.text)
            return True
        except Exception as e:
            console_logger.debug(e)
            return False

    def update_service(self, serviceName, params, data):
        try:
            response = self.session.post(
                "{}/services/{}/update".format(self.url, serviceName),
                params=params,
                data=json.dumps(data),
            )
            console_logger.debug(response.text)
            if response.text and "message" in json.loads(response.text) and json.loads(response.text)["message"].find("error") != -1:
                return False
            return True
        except Exception as e:
            console_logger.debug(e)
            return False

    def inspect_service(self, serviceName):
        try:
            response = self.session.get("{}/services/{}".format(self.url, serviceName))
            return json.loads(response.text)
        except Exception as e:
            console_logger.debug(e)
            return None


class DockerNetworkHandler:
    def __init__(self) -> None:
        self.url = "http+unix://%2Fvar%2Frun%2Fdocker.sock"
        self.session = requests_unixsocket.Session()

    def list_network(self):
        try:
            response = self.session.get("{}/networks".format(self.url))
            return json.loads(response.text)
        except Exception as e:
            console_logger.debug(e)
            return None

    def create_network(self, networkName: str):
        try:
            data = {
                "Name": networkName,
                "Driver": "bridge",
                "Attachable": True,
                "Labels": {"com.docker.stack.namespace": "rdx"},
            }
            headers = {"content-type": "application/json"}
            response = self.session.post(
                "{}/networks/create".format(self.url),
                data=json.dumps(data),
                headers=headers,
            )
            return json.loads(response.text)
        except Exception as e:
            console_logger.debug(e)
            return False

    def delete_network(self, networkName: str):
        try:
            response = self.session.delete(
                "{}/networks/{}".format(self.url, networkName)
            )
            console_logger.debug(response.text)
            return True
        except Exception as e:
            console_logger.debug(e)
            return False

    def attach_to_network(self, networkName: str, containerId: str):
        try:
            headers = {"content-type": "application/json"}
            data = {"Container": containerId}
            response = self.session.post(
                "{}/networks/{}/connect".format(self.url, networkName),
                data=json.dumps(data),
                headers=headers,
            )
            console_logger.debug(response.text)
            return True
        except Exception as e:
            console_logger.debug(e)
            return False

    def deattach_from_network(self, networkName: str, containerId: str):
        try:
            headers = {"content-type": "application/json"}
            data = {"Container": containerId}
            response = self.session.post(
                "{}/networks/{}/disconnect".format(self.url, networkName),
                data=json.dumps(data),
                headers=headers,
            )
            console_logger.debug(response.text)
            return True
        except Exception as e:
            console_logger.debug(e)
            return False
