import functools
import time
import requests
import json
from config import TestConfig as config
from api.service.helpers.logs import console_logger


def retry(exceptions, delay=0, times=2):
    def outer_wrapper(function):
        @functools.wraps(function)
        def inner_wrapper(*args, **kwargs):
            final_excep = None
            for counter in range(times):
                if counter > 0:
                    time.sleep(delay)
                final_excep = None
                try:
                    value = function(*args, **kwargs)
                    return value
                except (exceptions) as e:
                    final_excep = e
                    pass  # or log it

            if final_excep is not None:
                raise final_excep
        return inner_wrapper
    return outer_wrapper


def send_socket_event(data):
    env_file = json.loads(open("./mounts/env.json", 'r').read())
    socket_url = "http://socketserver:8000/socket/download/event"
    headers = {
        "content-type": "application/json"
    }
    console_logger.debug(data)
    payload = {"type": data.result()[1], "data": data.result()[0]}
    response = requests.request(
        "POST", socket_url, headers=headers, data=json.dumps(payload), timeout=10)

    console_logger.debug("got report download event")
    return True


##### sachin

def anpr_avg_count_socket_event(data):
    if data.exception() == None:
        time.sleep(2)
        
        socket_url = "http://socketserver:8000/socket/getcountavg"
        headers = {
            "content-type": "application/json"
        }
        console_logger.debug(str(data.result()))
        payload = {"detail": data.result()}
        response = requests.request("POST", socket_url, headers=headers, data=json.dumps(payload), timeout=10)

        console_logger.debug("got report download event")
        return True
    
def alert_count_socket_event(data):
    console_logger.debug(data)
    if data.exception() == None:
        time.sleep(2)
        
        socket_url = "http://socketserver:8000/socket/alertscount"
        headers = {
            "content-type": "application/json"
        }
        console_logger.debug(str(data.result()))
        payload = {"detail": data.result()}
        response = requests.request("POST", socket_url, headers=headers, data=json.dumps(payload), timeout=10)

        console_logger.debug("got report download event")
        return True
    
def reports_download(data):
    if data.exception() == None:
        time.sleep(2)
        
        socket_url = "http://socketserver:8000/socket/reportsdownload"
        headers = {
            "content-type": "application/json"
        }
        console_logger.debug(str(data.result()))
        payload = {"detail": data.result()}
        response = requests.request("POST", socket_url, headers=headers, data=json.dumps(payload), timeout=10)

        console_logger.debug("got report download event")
        return True
