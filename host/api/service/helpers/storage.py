import subprocess
import sys
import os
import shutil
import glob
import psutil
from api.service.helpers.logs import console_logger
from config import TestConfig as config

def get_drives():
    drivelist = list()
    command = ["lsblk", "-o", "KNAME,TYPE,SIZE,MODEL"]
    process = subprocess.Popen(command, stdout=subprocess.PIPE)
    for index,line in enumerate(process.stdout):
        if index != 0:
            l = line.decode("utf8")
            l = l.rstrip().split("\n")
            l = l[0].split(" ")
            l = list(filter(("").__ne__, l))
            drive = {}
            # print(l)
            if l[1] == "disk" and (l[0].startswith("sd") or l[0].startswith("nvme")):
                # print(l)
                drive["KNAME"] = l[0]
                drive["TYPE"] = l[1]
                drive["SIZE"] = l[2]
                drive["MODEL"] = "".join(l[3:len(l)])
                drivelist.append(drive)
        else:
            pass
    return drivelist

def mount_drive_to_folder(device_path, target_folder):
    command = ["sudo", "mount", "-B", device_path, target_folder]
    print(command)
    process = subprocess.Popen(command, stderr=subprocess.STDOUT)
    response = False if process.stderr else True
    return response 

def get_mount_point(device_kname):
    mountpoint = None
    command = ["lsblk", "-o", "KNAME,MOUNTPOINT"]
    process = subprocess.Popen(command, stdout=subprocess.PIPE)
    for index, line in enumerate(process.stdout):
        if index != 0:
            l = line.decode("utf8")
            l = l.rstrip().split("\n")
            l = l[0].split(" ")
            l = list(filter(("").__ne__, l))
            if len(l)==2 and l[0].startswith(device_kname) and l[1]:
                mountpoint = l[1]
            else:
                pass
        else:
            pass
    return mountpoint

def eject_device(device_kname):
    command = ["sudo", "eject", "/dev/{}".format(device_kname)]
    process = subprocess.Popen(command, stderr=subprocess.STDOUT)
    response = False if process.stderr else True
    return response

class Storage:
    def __init__(self):
        self.backup_source = config.DESTINATION_PATH
        self.backup_destination = config.BACKUP_PATH

    def get_source_mount(self, kname):
        console_logger.debug(kname)
        command = ["lsblk", "-o", "KNAME"]
        process = subprocess.Popen(command, stdout=subprocess.PIPE)
        for index, line in enumerate(process.stdout):
            l = line.decode("utf8").rstrip()
            if kname in l and kname != l:
                console_logger.debug("/dev/{}".format(l))
                return "/dev/{}".format(l)
        return None  

    def get_default_mointpoint(self):
        command = ["lsblk", "-o", "KNAME,MOUNTPOINT"]
        process = subprocess.Popen(command, stdout=subprocess.PIPE)
        for index, line in enumerate(process.stdout):
            l = line.decode("utf8").rstrip().split("\n")
            l = l[0].split(" ")
            if l[-1] == "/":
                return l[0]
        return None 

    def check_volume(self, volume_name):
        command = ["lsblk", "-o", "KNAME"]
        process = subprocess.Popen(command, stdout=subprocess.PIPE)
        for index, line in enumerate(process.stdout):
            l = line.decode("utf8").rstrip()
            if volume_name == l:
                return True
        return False 

    def check_device_free_memory(self, device):
        return int(psutil.disk_usage(device).free/1024)

    def check_used_memory(self):
        return subprocess.check_output(['du','-s', self.backup_source]).split()[0].decode('utf-8')

    def bind_mount_static_server(self):
        command = ["sudo", "mount", "-B", "--make-private", self.backup_source, self.backup_destination]
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if any(process.stderr):
            for line in process.stderr:
                console_logger.debug(line)
            return False
        return True  

    def volume_mount_static_server(self, source):
        command = ["sudo", "mount", source, self.backup_source]
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if any(process.stderr):
            for line in process.stderr:
                console_logger.debug(line)
            return False
        return True 

    def unmount_static_server(self, destination):
        command = ["sudo", "umount", destination]
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if any(process.stderr):
            for line in process.stderr:
                console_logger.debug(line)
            return False
        return True 

    def safely_remove_drive(self, volume_name, parent_volume_name):
        command1 = ["sudo", "udisksctl", "unmount", "-b", volume_name]
        command2 = ["sudo", "udisksctl", "power-off", "-b", parent_volume_name]
        console_logger.debug(command1)
        console_logger.debug(command2)
        process1 = subprocess.Popen(command1, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        process2 = subprocess.Popen(command2, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if any(process1.stderr) or any(process2.stderr):
            for line in process1.stderr:
                console_logger.debug(line)
            for line in process2.stderr:
                console_logger.debug(line)
            return False
        return True 
        
    def copy_data_from_backup_to_external_device(self, symlinks=False, ignore=None):
        GLOB_PARMS = "*" 
        source_folder_name = os.path.basename(os.path.normpath(self.backup_destination))
        destination_folder_name = os.path.basename(os.path.normpath(self.backup_source))
        for item in os.listdir(self.backup_destination):
            source = os.path.join(self.backup_destination, item)
            destination = os.path.join(self.backup_source, item)
            if os.path.isdir(source) and os.path.exists(destination):
                for file in glob.glob(os.path.join(source, GLOB_PARMS)):
                    if file.replace(source_folder_name, destination_folder_name) not in glob.glob(os.path.join(destination, GLOB_PARMS)):
                        shutil.copy(file, destination)
            elif os.path.isdir(source):
                shutil.copytree(source, destination, symlinks, ignore)
            elif not os.path.exists(destination):
                shutil.copy2(source, destination)

    def get_drive_model(self, kname):
        print(kname)
        command = ["lsblk", "-o", "KNAME,TYPE,MODEL"]
        process = subprocess.Popen(command, stdout=subprocess.PIPE)
        for index,line in enumerate(process.stdout):
            if index != 0:
                l = line.decode("utf8")
                l = l.rstrip().split("\n")
                l = l[0].split(" ")
                l = list(filter(("").__ne__, l))
                if l[1] == "disk" and (l[0].startswith("sd") or l[0].startswith("nvme")):
                    if l[0] == kname:
                        return "".join(l[2:len(l)])
                    
        return None