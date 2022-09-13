import socket
from api.service.helpers.logs import console_logger

def is_internet_present():
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