import pyudev
import time
import requests
import json
from api.service.helpers.logs import console_logger
from api.service.helpers.storage import Storage
from config import TestConfig as config


class USBDetector():
    ''' Monitor udev for detection of usb '''

    def __init__(self):
        ''' Initiate the object '''
        self.storage_handler = Storage()
        self.base_mount = self.storage_handler.get_default_mointpoint()
        self.context = pyudev.Context()
        self.monitor = pyudev.Monitor.from_netlink(self.context)
        self.present_devices = []
        self.base_device = self.get_parent_device(self.base_mount)
        for device in self.context.list_devices(subsystem='block', DEVTYPE='partition'):
            if self.base_device == device.parent.device_node and device.parent.device_node not in self.present_devices:
                self.present_devices.append(device.parent.device_node)
        self.mounted_base = False
        self.url = config.USB_DEVICE_DISCONNECT_WEBHOOK
        console_logger.debug(self.present_devices)

    def api_call(self, volume_name):
        body = {
            "Device_kname": volume_name
        }
        console_logger.debug(body)
        try:
            requests.post(url = self.url, data = json.dumps(body))
        except Exception as e:
            console_logger.debug(e)

    def get_parent_device(self, mount_point):
        console_logger.debug(mount_point)
        try:
            device = pyudev.Devices.from_name(self.context, 'block', mount_point)
            console_logger.debug(device)
            return device.parent.device_node
        except pyudev._errors.DeviceNotFoundByNameError:
            return None

 
    def listen(self):
        ''' Runs the actual loop to detect the events '''
        volume_list = []
        self.monitor.filter_by(subsystem='block')
        self.monitor.start()
        for device in iter(self.monitor.poll, None):
            console_logger.debug("Got USB event: {}".format(device.action))
            if device.action == 'add':
                # some function to run on insertion of usb
                if self.mounted_base:
                    time.sleep(5)
                    volume_list = self.on_connect()
                    console_logger.debug("connected")
                else:
                    self.mounted_base = True
            else:
                # some function to run on removal of usb
                if self.mounted_base:
                    time.sleep(5)
                    volume_list = self.on_disconnect()
                    console_logger.debug("disconnected")
                    try:
                        self.api_call(volume_list[0].split("/")[-1])
                    except IndexError:
                        pass
                else:
                    self.mounted_base = True
            if any(volume_list):
                console_logger.debug(volume_list)
                volume_list = []
    
    def on_connect(self):
        new_volume_list = []
        for device in self.context.list_devices(subsystem='block', DEVTYPE='partition'):
            if device.parent.device_node not in self.present_devices:
                self.present_devices.append(device.parent.device_node)
                new_volume_list.append(device.parent.device_node)
        self.mounted_base = False
        console_logger.debug(self.present_devices)
        return new_volume_list

    def on_disconnect(self):
        new_volume_list = []
        for device in self.context.list_devices(subsystem='block', DEVTYPE='partition'):
            new_volume_list.append(device.parent.device_node)
        self.mounted_base = False
        return list(set(self.present_devices) - set(new_volume_list))

