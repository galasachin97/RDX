import os,shutil
import pyzipper
from api.service.helpers.logs import console_logger
from api.service.helpers.socket_operations import socketOperationsHandler
from zipfile import ZipFile

class ZipConverter:
    def __init__(self) -> None:
        self.static_directory_path = os.path.join(os.getcwd(), "static_server", "logs")
        if not os.path.exists(self.static_directory_path):
            os.makedirs(self.static_directory_path)
        self.logs_zip_path = os.path.join(self.static_directory_path, 'containers_logs.zip')
        self.encrypt_zip_name = os.path.join(self.static_directory_path, 'logs.zip')
        self.secret_password = b'1'
        

    def create_zip(self, container_name, container_log):
        with pyzipper.AESZipFile('logs.zip', 'a') as zipObj:
            zipObj.writestr("{}_logs.txt".format(container_name), str(container_log))
            zipObj.close()

    def set_password(self):
        with pyzipper.AESZipFile(self.logs_zip_path, 'w', compression=pyzipper.ZIP_LZMA, encryption=pyzipper.WZ_AES) as zipObj:
            zipObj.setpassword(self.secret_password)
            zipObj.write('logs.zip')
            zipObj.close()
        os.remove('logs.zip')
    
    def unzip_file(self, **kwargs):
        folderName = "Primary_Detector" if kwargs["type"] == "primary" else kwargs["type"]

        serviceid_folder = os.path.join(os.getcwd(),'static_server', kwargs["serviceName"], "models", folderName)
        zip_directory = os.path.join(os.getcwd(), kwargs["zip_file"])

        if not os.path.exists(serviceid_folder):
            os.makedirs(serviceid_folder)
        
        filelist = [ f for f in os.listdir(serviceid_folder)]
        for file_name in filelist:
            if file_name != 'default.zip':
                os.remove(os.path.join(serviceid_folder, file_name))
                
        with ZipFile(zip_directory, 'r') as zip_ref:
            zip_ref.extractall(serviceid_folder)
            
        os.remove(zip_directory)
        self.sendRestartEvent(kwargs["serviceName"])
        return 'success'

    
    def unzip_default_file(self, **kwargs):
        folderName = "Primary_Detector" if kwargs["type"] == "primary" else kwargs["type"]

        unzip_serviceid_folder = os.path.join(os.getcwd(),'static_server', kwargs["serviceName"], "models", folderName)
        if not os.path.exists(unzip_serviceid_folder):
            return 'Folder not exist'
        
        filelist = [ f for f in os.listdir(unzip_serviceid_folder)]
        # console_logger.debug(filelist)
        if 'default.zip' in filelist:
            for file_name in filelist:
                if file_name != 'default.zip':
                    os.remove(os.path.join(unzip_serviceid_folder, file_name))
            with ZipFile(os.path.join(unzip_serviceid_folder, 'default.zip'), 'r') as zip_ref:
                zip_ref.extractall(unzip_serviceid_folder)
        self.sendRestartEvent(kwargs["serviceName"])
        
        return 'success'

    def sendRestartEvent(self, serviceName):
        socketOperationsHandler.restartService(data={"detail": {"data": serviceName}})


zip_converter = ZipConverter()

