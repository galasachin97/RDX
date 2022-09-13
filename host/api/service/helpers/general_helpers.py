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

def network_statistics(data):
    time.sleep(2)
    socket_url = "http://localhost:80/socket/networkspeed"
    headers = {
        "content-type": "application/json"
    }
    console_logger.debug(str(data.result()))
    payload = {"detail": data.result()}
    requests.request("POST", socket_url, headers=headers, data=json.dumps(payload), timeout=10)

    console_logger.debug("got report download event")
    return True

def fifo_socket_url(data):
    time.sleep(2)
    socket_url = "http://localhost:80/socket/fifo"
    headers = {
        "content-type": "application/json"
    }
    console_logger.debug(str(data.result()))
    payload = {"detail": data.result()}
    requests.request("POST", socket_url, headers=headers, data=json.dumps(payload), timeout=10)

    console_logger.debug("got report download event")
    return True

