import datetime
from api.service.models import *
from api.service.helpers.logs import console_logger

def log_task(task):
    """
        Logs background and async tasks
    """
    # Task 
    if task.exception() == None:
        Taskmeta(Status = task.result(), Task_name = task.get_name(), Task_time = datetime.datetime.utcnow()).save()
    else:
        console_logger.debug(str(task.exception()))
        Taskmeta(Status = "Failed", Task_name = task.get_name(), Task_time = datetime.datetime.utcnow(), Traceback = str(task.exception())).save()