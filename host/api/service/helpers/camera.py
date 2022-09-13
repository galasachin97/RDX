import cv2
import argparse
import os, sys, subprocess, threading, datetime
import asyncio
from api.service.helpers.logs import console_logger


os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"

image_obj = None
cam_health = None
image_path = None

def capture_with_thread(Source, Link, ImageType):
    console_logger.debug(Source)
    console_logger.debug(Link)
    console_logger.debug(ImageType)
    e = threading.Event()
    console_logger.debug("Capturing using thread")
    global image_obj
    image_obj = None
    thread = threading.Thread(target=CaptureImage, args=(Source, Link, ImageType), daemon=True)
    thread.start()                   
    thread.join(20)
    if thread.is_alive():
        e.set()
        console_logger.debug("killing thread")                        
        console_logger.debug(thread.is_alive())
        thread.join()
        
    console_logger.debug("Killed thread and exited")
    return image_obj


def health_with_thread(Source, Link, Consent):
    
    e = threading.Event()
    console_logger.debug("Checking Health")
    console_logger.debug(Consent)
    global cam_health, image_path
    cam_health = None
    if not Consent:
        thread = threading.Thread(target=CameraHealthCheck, args=(Source, Link), daemon=True)
        thread.start()                   
        thread.join(20)
        if thread.is_alive():
            e.set()
            console_logger.debug("killing thread")                        
            console_logger.debug(thread.is_alive())
            thread.join()
    else:
        thread = threading.Thread(target=CameraHealthCapture, args=(Source, Link), daemon=True)
        thread.start()                   
        thread.join(20)
        if thread.is_alive():
            e.set()
            console_logger.debug("killing thread")                        
            console_logger.debug(thread.is_alive())
            thread.join()
        
    console_logger.debug("Killed thread and exited")
    return cam_health,image_path

def gstreamer_pipeline(
    sensor_id=0,
    sensor_mode=3,
    capture_width=640,
    capture_height=480,
    display_width=640,
    display_height=480,
    framerate=15,
    flip_method=0,
):
    return (
        "nvarguscamerasrc sensor-id=%d sensor-mode=%d ! "
        "video/x-raw(memory:NVMM), "
        "width=(int)%d, height=(int)%d, "
        "format=(string)NV12, framerate=(fraction)%d/1 ! "
        "nvvidconv flip-method=%d ! "
        "video/x-raw, width=(int)%d, height=(int)%d, format=(string)BGRx ! "
        "videoconvert ! "
        "video/x-raw, format=(string)BGR ! appsink"
        % (
            sensor_id,
            sensor_mode,
            capture_width,
            capture_height,
            framerate,
            flip_method,
            display_width,
            display_height,
        )
    )

def CaptureImage(cam_source, link, imagetype):    
    try:
        global image_obj
        image_obj = False
        console_logger.debug(cam_source)
        console_logger.debug(link)
        if cam_source == 'rtsp' or cam_source == 'usb':        
            console_logger.debug("got rtsp/usb camera")
            cap = cv2.VideoCapture(link)
        if cam_source =='mipi':  
            cap = cv2.VideoCapture(gstreamer_pipeline(sensor_id=int(link)), cv2.CAP_GSTREAMER)        
        ret, frame = cap.read()
        console_logger.debug(ret)
        if not ret:                
            return image_obj
        path = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
        image_path = os.path.join(path,"static_server",imagetype+".jpg")
        console_logger.debug(image_path)
        if os.path.exists(image_path):
            console_logger.debug("Existing Image Found Deleting")
            os.remove(image_path)
        console_logger.debug(frame.shape)
        resized = cv2.resize(frame, (640,480), interpolation=cv2.INTER_AREA)
        # cv2.imwrite(image_save_path, resized)            
        cv2.imwrite(image_path, resized)
        cap.release()
        console_logger.debug("Success")
        image_obj = imagetype+".jpg"
        console_logger.debug(image_obj)
        return image_obj
        
    except Exception as e:    
        cap.release()    
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))
        return image_obj
    

def CameraHealthCheck(cam_source, link): 
    try:   
        if cam_source == 'rtsp' or cam_source == 'usb':
            cap = cv2.VideoCapture(link)
        if cam_source =='mipi':  
            cap = cv2.VideoCapture(gstreamer_pipeline(sensor_id=int(link)), cv2.CAP_GSTREAMER)
        ret, frame = cap.read()
        cap.release()
        global cam_health
        cam_health = ret
        return cam_health
    except Exception as e:
        cap.release()
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))

    
def CameraHealthCapture(cam_source, link): 
    try:
        global cam_health, image_path   
        ret,image_save_path = None,None
        console_logger.debug("Capturing with consent")
        if cam_source == 'rtsp' or cam_source == 'usb':
            cap = cv2.VideoCapture(link)
        if cam_source =='mipi':  
            cap = cv2.VideoCapture(gstreamer_pipeline(sensor_id=int(link)), cv2.CAP_GSTREAMER)
        if cap.isOpened():
            name = str(datetime.datetime.now()).replace('-','').replace(' ','').replace(':','').replace('.','')
            path = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
            directory = os.path.join(path,"static_server","health")            
            if not os.path.exists(directory):
                os.mkdir(directory)            
            ret, frame = cap.read()
            image_save_path = os.path.join(directory,name+".jpg")
            if os.path.exists(image_save_path):
                os.remove(image_save_path)
            resized = cv2.resize(frame, (640,480), interpolation=cv2.INTER_AREA)
            cv2.imwrite(image_save_path, resized)            
            console_logger.debug(image_save_path)
            cap.release()            
        
        
        cam_health = ret
        image_path = image_save_path
        console_logger.debug(image_path)
        return cam_health, image_path
    except Exception as e:
        cap.release()
        console_logger.debug(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]         
        console_logger.debug("Error on line {}".format(sys.exc_info()[-1].tb_lineno))



def getUSBCameras():
    CamOutput = subprocess.Popen(['v4l2-ctl --list-devices | grep /dev/video'], shell=True, stdout=subprocess.PIPE)
    line_data = []
    for line in CamOutput.stdout:
        line_data.append(line.decode('utf8').strip('\t').strip('\n'))    
    
    device_list = []
    for link in line_data:
        command = 'v4l2-ctl --list-formats --device {}'.format(link)                
        CamOutput = subprocess.Popen([command], shell=True, stdout=subprocess.PIPE)                                
        lines= []        
        for line_new in CamOutput.stdout:                                            
            lines.append(line_new.decode().strip('\t').strip('\n'))            
        if len(lines)>3:                
            device_list.append(link)    
    return device_list
