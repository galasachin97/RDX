import datetime
from api.service.models import *
from api.service.helpers.logs import console_logger


def log_task(task):
    """
        Logs background and async tasks
    """        
    if not task.exception:
        console_logger.debug(task.job_id)    
        Taskmeta(Status ="success", Task_name = task.job_id, Traceback="").save()           
    else:
        console_logger.debug(str(task.exception))
        Taskmeta(Status = "Failed", Task_name = task.job_id, Traceback = str(task.exception)).save()