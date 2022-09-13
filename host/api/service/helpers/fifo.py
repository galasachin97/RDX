from calendar import month
import os 
from dateutil.relativedelta import relativedelta
import datetime
import shutil
from api.service.helpers.stats import get_memory_details
from api.service.helpers.logs import console_logger

class Fifo:

    def __init__(self,) -> None:
        self.location = os.path.join(os.getcwd(), "..", "static_server")
        self.today = datetime.datetime.today()
        self.formated_today = self.today.strftime('%d-%m-%Y')

    def gb_to_bytes(self, gb):
        return gb * 1073741824

    def check_folder_size(self, folder_location):
        folder_size  = 0 
        for path, dirs, files in os.walk(folder_location):
            for i in files:
                fp = os.path.join(path,i)
                folder_size += os.path.getsize(fp)
        
        return int(folder_size) 

    def balance_memory(self):
        formated_date = []
        final_formated_date = []
        # step 1: fetch total folder size
        original_system_size = self.gb_to_bytes(get_memory_details()["storage_total"])
        used_original_system_size = self.gb_to_bytes(get_memory_details()["storage_used"])
        threshold_value_70 = original_system_size * 0.7
        threshold_value_60 = original_system_size * 0.6
        # console_logger.debug(f"threshold_value_70: {threshold_value_70}")
        # console_logger.debug(f"threshold_value_60: {threshold_value_60}")
        
        #step 2: list folder name into datetime and sort
        for i in os.listdir(self.location):
            try:
                new_date=datetime.datetime.strptime(i,'%d-%m-%Y')
                formated_date.append(new_date)
            except:pass

        formated_date.sort()
        # console_logger.debug(f"formated_date.sort(): {formated_date}")

        #step 3: list datewise sorted folder names 
        for i in formated_date:
            new_date = i.strftime('%d-%m-%Y')
            final_formated_date.append(new_date)
        
        #step 3: delete first folder if folder size if greater than threshold
        if used_original_system_size > int(threshold_value_70):
            # console_logger.debug(f"70 ori size: {threshold_value_70}")
            for i in final_formated_date:
                new_path = os.path.join(self.location, i)
                if used_original_system_size > int(threshold_value_60):
                    shutil.rmtree(new_path)
                    # console_logger.debug(f"File Deleted: {i}")
                    used_original_system_size = self.gb_to_bytes(get_memory_details()["storage_used"])
                    # console_logger.debug(f"60 ori size: {threshold_value_60}")

    def main(self, **data):
        type = data["type"]
        count = data["days_or_month"]
        
        self.balance_memory()

        if type == "Days":
            try:
                previous_date = self.today - datetime.timedelta(days = count)
                formated_previous_date = previous_date.strftime('%d-%m-%Y')
                new_formated_previous_Date = datetime.datetime.strptime(formated_previous_date,'%d-%m-%Y')
                for i in os.listdir(self.location):
                    try:
                        datetime_i = datetime.datetime.strptime(i,'%d-%m-%Y')
                        if datetime_i <= new_formated_previous_Date:
                            new_path = os.path.join(self.location,i)
                            if os.path.exists(new_path):
                                shutil.rmtree(new_path)
                    except:pass
                    
                return "success"
            except Exception as e:
                console_logger.debug(e)
                return "error"
            
        elif type == "Month":
            try:
                # To determine previous months date
                previous_month_date  = self.today - relativedelta(months=count)
                for i in os.listdir(self.location):
                    try:
                        datetime_i = datetime.datetime.strptime(i,'%d-%m-%Y')
                        if datetime_i <= previous_month_date:
                            new_path = os.path.join(self.location,i)
                            if os.path.exists(new_path):
                                shutil.rmtree(new_path)
                    except:pass
                return "success"
            except Exception as e:
                console_logger.debug(e)
                return "error"
