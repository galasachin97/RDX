import os
import shutil
import datetime
import subprocess
from mongoengine.errors import DoesNotExist
from api.service.models import GeneralSettings
from config import TestConfig as config
from api.service.helpers.logs import console_logger

class Fifo:
    def __init__(self):
        self.static_server_dir = os.path.join(os.getcwd(), "static_server")
        try:
            self.alloted_static_server_size = GeneralSettings.objects.first().Static_server_size
        except Exception as e:
            self.alloted_static_server_size = 16000000
        self.max_allowed_static_server_size = 0.8 * self.alloted_static_server_size
        self.current_day_folder = datetime.datetime.now().date()

    def get_folder_size(self, folder_path):
        return subprocess.check_output(['du','-s', folder_path]).split()[0].decode('utf-8')

    def get_subdirectories_with_total_memory_consumption(self):
        folder_list = []
        total_memory_used = 0
        for folder in sorted(os.listdir(self.static_server_dir)):
            try:
                if isinstance(datetime.datetime.strptime(folder, "%d-%m-%Y").date(), datetime.date):
                    folder_size = self.get_folder_size(os.path.join(self.static_server_dir, folder))
                    folder_list.append({"name": folder, "size": int(folder_size)})
                    total_memory_used += int(folder_size)
            except ValueError:
                pass
            
        return folder_list, total_memory_used

    def recursive_folder_deletion(self, total_usage, directory_with_usage):
        if total_usage < 0.7 * self.alloted_static_server_size:
            return total_usage
        else:
            folder_info = directory_with_usage.pop(0)
            shutil.rmtree(os.path.join(self.static_server_dir, folder_info["name"]))
            total_usage -= folder_info["size"]
            return self.recursive_folder_deletion(total_usage, directory_with_usage)

    def run(self):
        directories, total_usage = self.get_subdirectories_with_total_memory_consumption()
        directories.sort(key = lambda x:datetime.datetime.strptime(x['name'], '%d-%m-%Y'))
        console_logger.debug(directories)
        if total_usage >= self.max_allowed_static_server_size:
            console_logger.debug("need to run fifo")
            console_logger.debug(
                self.recursive_folder_deletion(
                    total_usage,
                    directories
                )
            )
        else:
            console_logger.debug("memory within limit")

    @staticmethod
    def get_current_usage():
        # get the current disk usage of the fifo dir 
        command = ["du", "-s", os.path.join(os.getcwd(), config.STATICFILE_DIR, datetime.datetime.now().strftime("%d-%m-%Y"))]
        process = subprocess.Popen(command, stdout=subprocess.PIPE)
        for line in process.stdout:
            l = line.decode("utf8")
            l = l.rstrip().split("\n")
            l = l[0].split("\t")
            current_usage = int(l[0])
        return current_usage

    def run_fifo(self):
        # fetching static serversize from the general settings
        settings = GeneralSettings.objects.first()
        if settings and settings.Static_server_size:
            size = settings.Static_server_size

            # fetching the current static server size  
            current_usage = self.get_current_usage()
            if current_usage >= size:
                console_logger.debug("deleting")
                status = self.delete_excess_reports()
            else:
                return "Success"
            if status:
                return "Success"
            else:
                return "Failed"
        else:
            return "Success"

    @staticmethod
    def delete_excess_reports():
        # deleting the oldest folder from the fifo dir
        
        # getting the dir list and convert to date list
        datelist = [Fifo.get_date(str(directory)) for directory in os.listdir(config.FIFO_DIR)]

        # finding the oldest date and removing that folder
        mindatestring = min(datelist).strftime("%D-%M-%Y")
        console_logger.debug(mindatestring)
        status = Fifo.remove_folder(mindatestring)
        return status
    
    @staticmethod
    def get_date(datestring):
        return datetime.datetime.strptime(datestring, '%D-%M-%Y')

    @staticmethod
    def remove_folder(foldername):
        # removes the entire folder
        shutil.rmtree(config.FIFO_DIR + foldername)
        return True
