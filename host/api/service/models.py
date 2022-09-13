from mongoengine import Document
from mongoengine.fields import *
import datetime

from api.service.helpers.logs import console_logger

class TimeSettings(Document):
    Ntp_url = StringField()
    UseNtp = BooleanField(default=False)
    AutoTimeZone = BooleanField(default=False)
    Region = StringField()


class DeviceLogs(Document):
    Event = StringField()
    Type = StringField()
    Description = StringField()
    TSCreated = DateTimeField(default=datetime.datetime.utcnow())

    def payload(self):
        local_timestamp = self.TSCreated.replace(tzinfo=datetime.timezone.utc).astimezone(tz=None)
        return {
            "Event":self.Event,
            "Type":self.Type,
            "Description":self.Description,
            "Date": local_timestamp.replace(microsecond=0).date(),
            "Time": local_timestamp.replace(microsecond=0).time(),
        }

    meta = {'indexes': [
        {'fields': ['$Event', "$Type", "$Description", "$TSCreated"],
         'default_language': 'english',
         'weights': {'Event': 3, 'Type': 2, 'Description':3}
        },        
    ],'ordering': ['-TSCreated']}

class DeviceHealth(Document):
    Activity = StringField()
    TSCreated = DateTimeField(default=datetime.datetime.utcnow())

class ExternalDevices(Document):
    Device_type = StringField()
    Device_name = StringField()
    Source = StringField()
    Destination = StringField()
    Mount_type = StringField()
    Enable = BooleanField()

    def payload(self):
        return {
            "Device_type": self.Device_type,
            "Device_name": self.Device_name,
            "Source": self.Source,
            "Destination": self.Destination,
            "Type": self.Mount_type,
            "Enable": self.Enable
        }

class SoundSettings(Document):
    notificationSound = BooleanField()

    def payload(self):
        return {
            "notificationSound": self.notificationSound
        }


class Themes(Document):
    label = StringField()
    logo_white_theme = StringField()
    logo_black_theme = StringField()
    startup_video = StringField()
    favicon = StringField()
    primary_colour = StringField()
    secondary_colour = StringField()
    button_colour1 = StringField()
    button_colour2_primary = StringField()
    button_colour2_secondary = StringField()
    status = BooleanField()

    def payload(self):
        return {
            "label":self.label,
            "logo_white_theme":self.logo_white_theme,
            "logo_black_theme":self.logo_black_theme,
            "startup_video":self.startup_video,
            "favicon":self.favicon,
            "primary_colour":self.primary_colour,
            "secondary_colour":self.secondary_colour,
            "button_colour1":self.button_colour1,
            "button_colour2_primary":self.button_colour2_primary,
            "button_colour2_secondary":self.button_colour2_secondary,
            "status":self.status
        }