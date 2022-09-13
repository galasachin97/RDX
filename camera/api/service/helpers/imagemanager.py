import datetime
import os
import sys
import shutil

from api.service.models import *
from api.service.helpers.logs import console_logger


def add_ref_image(ref_image, ImgType, Camera_id):
    try:
        existingImage = ReferenceImage.objects(
            Camera_id=Camera_id, ImageType=ImgType)
        if existingImage:
            save_img = ReferenceImage.objects(
                Camera_id=Camera_id, ImageType=ImgType).first()
            save_img.ImagePath = ref_image
            save_img.TSmodified = datetime.datetime.utcnow()
            save_img.save()
            obj = save_img
        else:
            _object = ReferenceImage(
                Camera_id=Camera_id, ImageType=ImgType, ImagePath=ref_image).save()
            obj = _object
        return obj
    except Exception as e:
        console_logger.debug(e)
        return 0


def update_ref_image(ref_image, ImgType, Camera_id):
    try:
        existingImage = ReferenceImage.objects.get(
            Camera_id=Camera_id, ImageType=ImgType)
        if existingImage:
            Camera.objects(id=Camera_id).update_one(
                pull__RefImage=str(existingImage.id))
            save_img = ReferenceImage.objects(
                Camera_id=Camera_id, ImageType=ImgType).first()
            save_img.ImagePath = ref_image
            save_img.TSmodified = datetime.datetime.utcnow()
            save_img.save()
            obj = save_img
            Camera.objects(id=Camera_id).update_one(push__RefImage=save_img)
        else:
            _object = ReferenceImage(
                Camera_id=Camera_id, ImageType=ImgType, ImagePath=ref_image).save()
            Camera.objects(id=Camera_id).update_one(push__RefImage=_object)
            obj = _object
        return obj
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        return 0


def delete_images(image_list):
    try:
        os.chdir('ref_image')
        file_list = set(os.listdir())-set(image_list)
        for file in file_list:
            os.remove(file)
        return 1
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        return 0


def AddRenameImage(new_name, old_name, image_type, Camera_id):
    try:
        # move image to seperate folder
        extension = old_name.split('.')[-1]
        new_folder = os.path.join(os.getcwd(), 'ref_image', new_name)
        if not os.path.exists(new_folder):
            os.mkdir(new_folder)

        path = os.path.join(os.getcwd(), 'ref_image')
        old_file = os.path.join(path, old_name)
        new_file = os.path.join(new_folder, new_name)+image_type+'.'+extension

        if os.path.exists(new_file):
            os.remove(new_file)
        os.rename(old_file, new_file)

        ref_image = new_name+'/'+new_name+image_type+'.'+extension

        # save image object and return objet
        existingImage = ReferenceImage.objects(
            Camera_id=Camera_id, ImageType=image_type)
        if existingImage:
            console_logger.debug('Existing Image Found Updating Image')
            save_img = ReferenceImage.objects(
                Camera_id=Camera_id, ImageType=image_type).first()
            save_img.ImagePath = ref_image
            save_img.TSmodified = datetime.datetime.utcnow()
            save_img.save()
            obj = save_img
        else:
            _object = ReferenceImage(
                Camera_id=Camera_id, ImageType=image_type, ImagePath=ref_image).save()
            obj = _object
        return obj
    except Exception as e:
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        console_logger.debug("Error on line {}".format(
            sys.exc_info()[-1].tb_lineno))
        return 0
