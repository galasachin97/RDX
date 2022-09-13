import subprocess
import os
import requests
import socket
import json
import time

from api.service.helpers.logs import console_logger
from config import TestConfig as Config


class OTAHandler:
    def __init__(self) -> None:
        console_logger.debug("check for ota")
        software_version = self.fetch_latest_version()
        if software_version and software_version != Config.SOFTWARE_VERSION:
            self.download_shell_file(software_version)
            self.shell_script_path = os.path.join(os.getcwd(), "host-{}.sh".format(software_version))
            self.temp_folder_path = os.path.join(os.getcwd(), "temp")
            if os.path.exists(self.shell_script_path) and not os.path.exists(self.temp_folder_path):
                console_logger.debug("ota is running")
                self.run_shell_script()

    def run_shell_script(self):
        subprocess.run(['/bin/bash', self.shell_script_path])

    def check_for_internet(self):
        try:
            console_logger.debug("checking internet")
            host = socket.gethostbyname("marketplace.diycam.com")
            sock = socket.create_connection((host,80),2)
            if sock:
                sock.close()
            return True
        except:
            console_logger.debug("not found")    
        return False

    def download_shell_file(self, software_version):
        if self.check_for_internet():
            subprocess.run(['wget', "https://infinityos.s3.ap-south-1.amazonaws.com/host-{}.sh".format(software_version)])

    def fetch_latest_version(self):
        try:
            envFileLocation = os.path.join(os.getcwd(), "..", "env.json")
            data = json.loads(open(envFileLocation, 'r').read())
            url="http://{}:{}/api/v1/base/device/unprotected".format(data["HOST"], data["PORT"])
            console_logger.debug(url)
            response = requests.get(url=url, timeout=60)
            if response.status_code == 200:
                softwareVersion = json.loads(response.text)["Software_version"]
                console_logger.debug(softwareVersion)
                return softwareVersion
            else:
                return None
        except requests.RequestException:
            console_logger.debug("base api call fail. calling again")
            time.sleep(2)
            return self.fetch_latest_version()

    
otaHandler = OTAHandler()