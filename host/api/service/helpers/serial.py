import serial
import time
import serial.tools.list_ports as list_ports
from api.service.helpers.logs import console_logger

class SerialCommand:
    def __init__(self):
        device = "/dev/ttyACM0"
        self.ser = serial.Serial(device, baudrate=9600,timeout=3)
        time.sleep(3)
    
    def activate_red(self):
        self.ser.write(b'r')
        return True
    
    def activate_orange(self):
        self.ser.write(b'o')
        return True

    def activate_green(self):
        self.ser.write(b'g')
        return True

    def activate_hooter(self):
        self.ser.write(b'b')
        return True