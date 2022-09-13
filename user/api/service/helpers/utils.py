import os, json
import requests

from api.service.helpers.logs import console_logger

def get_host():
    try:
        env_file = os.path.join(os.getcwd(),'envs','env.json')
        with open(env_file) as f:
            data = json.load(f)
            return data
    except Exception as e:
        console_logger.debug(e)
        return None

class ApiCall:
    def __init__(self) -> None:
        pass

    def fetchAccessKey(self):
        url = "http://base:8000/api/v1/base/device/unprotected"
        response = requests.request(method="GET", url=url, timeout=10)
        if response.status_code == 200:
            return response.status_code, json.loads(response.text)["Access_key"]
        else:
            return response.status_code, json.loads(response.text)

