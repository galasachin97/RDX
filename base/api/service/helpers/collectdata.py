import os
import datetime
import time
from config import TestConfig as config
from api.service.helpers.check_internet import is_internet_present
from api.service.helpers.logs import console_logger
from api.service.models import CloudSettings, DeviceInfo
from api.service.helpers.upload import Upload

def upload_file(localpath):
    settings = CloudSettings.objects.get()
    serial_number = DeviceInfo.objects.first().Serial_number
    uploader = Upload()
    target_img = "{}/health/{}.jpg".format(serial_number, datetime.datetime.utcnow().strftime("%m-%d-%Y_%H-%M-%S"))
    img_status, img_url =  uploader.upload_file(localpath, target_img)
    return img_status

def delete_file(filepath):
    os.remove(filepath)
    return True

def collect_n_upload():
    # files collected
    console_logger.debug("uploading to cloud")
    while True:
        if is_internet_present():
            collection_dir = os.path.join(os.getcwd(), config.STATICFILE_DIR, config.DATA_COLLECTION_DIR)
            filelist = os.listdir(collection_dir)[:5]
            imglist = list()
            
            for filename in filelist:
                if filename.endswith(".jpg"):
                    imglist.append(filename)
            if not len(imglist):
                return "Success"
            for image in imglist:
                status = upload_file("{}/{}".format(collection_dir, image))
                time.sleep(1)
                if status:
                    status = delete_file("{}/{}".format(collection_dir, image))
            # time.sleep(10)
        else:
            return "Success"



