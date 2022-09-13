from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import os
from api.service.helpers.logs import console_logger
import concurrent.futures
from api.service.helpers.fifo import Fifo
scheduler = BackgroundScheduler()
fifo = Fifo()

class ScheduleOperations:
    
    def __init__(self) -> None:
        pass
    
    def schedule_folder(self):
        try:
            static_directory_path = os.path.join(os.getcwd(), "..", "static_server")
            dated_folder_path = os.path.join(static_directory_path, datetime.now().strftime("%d-%m-%Y"))
            if not os.path.exists(dated_folder_path):
                os.mkdir(dated_folder_path)
                console_logger.debug(dated_folder_path)
        except Exception as e:
            console_logger.debug(e)
            pass
    
    def schedule_fifo(self):
        # console_logger.debug("schedule_fifo")
        concurrent.futures.ThreadPoolExecutor(max_workers=1).submit(fifo.balance_memory)
        
