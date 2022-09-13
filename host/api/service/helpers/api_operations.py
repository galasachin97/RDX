import requests
from config import TestConfig as config

class ApiOperationHandler:
    def __init__(self) -> None:
        pass

    def sendIpToServiceManagement(self, ip):
        resposne = requests.get(config.SERVICE_ENV_UPDATE_URL, params={"ip": ip}, timeout=10)
        return resposne.status_code

apiOperationHandler = ApiOperationHandler()