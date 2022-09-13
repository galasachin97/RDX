import json
import os,shutil
import time
from zipfile import ZipFile
from api.service.helpers.logs import console_logger
from api.service.models import *
from os.path import basename

class Zip_Converter:
    
    def __init__(self):
        self.main_directory = ""
        self.themefile_loc = os.path.join(os.getcwd(),'..','frontend','html','Theme.json')
        self.themefolder_loc = os.path.join(os.getcwd(),'..','static_server','theme')
        self.zip_name = 'themezipfile.zip'
    def zip_files(self):
        try:
            console_logger.debug(self.main_directory)
            shutil.copy(self.themefile_loc,  self.themefolder_loc)
            with ZipFile(os.path.join(self.themefolder_loc, self.zip_name),'w') as zip:
                files_list = []
                
                while True:
                    for folderName, subfolders, filenames in os.walk(self.themefolder_loc):
                        for filename in filenames:
                            if "found" in files_list:
                                filePath = os.path.join(folderName, filename)
                                if '.zip' not in filePath:
                                    zip.write(filePath, basename(filePath))
                            else:
                                files_list.append(filename)
                        break
                    if "found" in files_list:
                        self.themefolder_loc = os.path.join(os.getcwd(),'..','static_server','theme')
                        break
                    if "logo_dark.png" in files_list:
                        del files_list[:]
                        files_list.append("found")
                    else:
                        del files_list[:]
                        self.themefolder_loc = os.path.join(self.themefolder_loc,"default")
                        files_list.append("found")
            return self.zip_name
        except Exception as e:
            console_logger.debug(e)
            return False

    def clean_files(self):
        try:
            for filename in os.listdir(self.themefolder_loc):
                new_path = os.path.join(self.themefolder_loc,filename)
                if filename != "default":
                    try:shutil.rmtree(new_path)
                    except:os.remove(new_path)
        except Exception as e:
            console_logger.debug(e)
            return False
        
    def clean_zip(self):
        try:
            for filename in os.listdir(self.themefolder_loc):
                new_path = os.path.join(self.themefolder_loc,filename)
                if filename.endswith(".zip"):
                    os.remove(new_path)
        except Exception as e:
            console_logger.debug(e)
            return False

    def unzip_files(self,zip_name):
        try:
            console_logger.debug(self.main_directory)
            themeMeta = Themes.objects.first()
            
            with ZipFile(os.path.join(self.themefolder_loc,zip_name), 'r') as zip_ref:
                for zip_info in zip_ref.infolist():
                    if zip_info.filename[-1] == '/':
                        continue
                    zip_info.filename = os.path.basename(zip_info.filename)
                    zip_ref.extract(zip_info, self.themefolder_loc)
            
            file_check = {
                "favicon":"favicon.ico",
                "logo_dark":"logo_dark.png",
                "logo":"logo.png",
                "splash_screen":"Splash_Screen.mp4",
                "theme":"Theme.json"
            }
            
            for filename in os.listdir(self.themefolder_loc):
                if filename != "default":
                    console_logger.debug(filename)
                    if file_check["favicon"] == filename : file_check["favicon"] = True
                    elif file_check["logo_dark"] == filename : file_check["logo_dark"] = True
                    elif file_check["logo"] == filename : file_check["logo"] = True
                    elif file_check["splash_screen"] == filename : file_check["splash_screen"] = True
                    elif file_check["theme"] == filename : file_check["theme"] = True
                    else:
                        try:os.remove(os.path.join(self.themefolder_loc,filename))
                        except:pass

            if all([file_check["favicon"],file_check["logo_dark"],file_check["logo"],file_check["splash_screen"],file_check["theme"]]) == False:
                console_logger.debug("*** somefiles are missing ***")
                return "failed"
            for folder in ['html','public']:
                try:
                    shutil.copyfile(os.path.join(self.themefolder_loc,'Theme.json'),os.path.join(os.getcwd(),'..','frontend',folder,'Theme.json'))
                    shutil.copyfile(os.path.join(self.themefolder_loc,'favicon.ico'),os.path.join(os.getcwd(),'..','frontend',folder,'favicon.ico'))
                except:
                    pass
            # os.remove(os.path.join(self.themefolder_loc,zip_name))
            # shutil.rmtree(extracted_zipname)
            jsonfile = open(self.themefile_loc,'r')
            jsondata = json.load(jsonfile)

            themeMeta = Themes.objects.first()
            if themeMeta:
                themeMeta.delete()
            Themes(**jsondata).save()
            return 'success'
        except Exception as e:
            console_logger.debug(e)
            return False
