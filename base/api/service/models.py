import os
from mongoengine import Document
from mongoengine.document import EmbeddedDocument
from mongoengine.fields import *
from dateutil import tz
import datetime
import json
from config import TestConfig as config
from api.service.helpers.logs import console_logger
import cryptocode

serial_number = None


class Server(Document):
    Ip = StringField()
    Port = StringField()
    Server_role = StringField()
    Ownership = StringField()
    Status = BooleanField()
    Url = URLField()


class DeviceInfo(Document):
    Serial_number = StringField(required=True, unique=True)
    Device_name = StringField()
    Access_key = StringField()
    GroupID = StringField(default=None)
    TypeID = StringField(default=None)
    Priorities = DictField(default=None)
    Installation_address = StringField()
    Map_address = ListField(FloatField())
    Branch_code = StringField()
    Hardware_type = StringField()
    Software_version = StringField()
    Warranty_validity = DateTimeField()
    Limitations = DictField()
    Status = StringField(default="Authenticated")
    Mfg_date = DateField(auto_now_add=True)
    Modified_ts = DateField()
    Consent = BooleanField(default=False)
    Test_status = DateField()

    def payload(self):
        return {
            "Serial_number": self.Serial_number,
            "Device_name": self.Device_name,
            "Access_key": self.Access_key,
            "Installation_address": self.Installation_address,
            "Map_address": self.Map_address,
            "Branch_code": self.Branch_code,
            "Hardware_type": self.Hardware_type,
            "Software_version": self.Software_version,
            "Warranty_validity": self.Warranty_validity.replace(microsecond=0).date() if self.Warranty_validity else "",
            "Limitations": self.Limitations,
            "Status": self.Status,
            "Consent": self.Consent
        }


class GeneralSettings(Document):
    Email = ListField(EmailField())
    Phone = ListField(StringField())
    Language = StringField(default="English")
    Static_server_size = IntField()
    Email_status = BooleanField()


class TicketQueue(Document):
    TicketName = StringField()
    NextNo = StringField()


class Alerts(Document):
    Camera_name = StringField()
    Camera_id = StringField()
    Service_id = StringField()
    Location = StringField()
    Ticket_number = StringField()
    Alert = StringField()
    Timestamp = DateTimeField()
    Video_path = ListField(StringField())
    Image_path = ListField(StringField())
    Sync_status = BooleanField()
    False_detection = BooleanField(default=False)
    CloudImageURL = ListField(StringField())

    meta = {'indexes': [
        {'fields': ['$Camera_name', "$Camera_id", "$Service_id", "$Location", "$Ticket_number", "$Alert"],
         'default_language': 'english',
         'weights': {'Camera_name': 3, 'Camera_id': 3, 'Service_id': 3, 'Location': 3, 'Ticket_number': 2, 'Alert': 3}
         }],
        'ordering': ['-Timestamp']
    }

    @staticmethod
    async def generate_ticket_number(TicketType):
        global serial_number
        if serial_number is None:
            serial_number = DeviceInfo.objects().first().Serial_number

        ticket_type = TicketQueue.objects(TicketName=TicketType)
        ticket_number = None

        if not any(ticket_type):
            ticket_number = "{}_1".format(serial_number)
            NextNumber = "{}_2".format(serial_number)
            TicketQueue(TicketName=TicketType, NextNo=NextNumber).save()
        else:
            ticket_number = "{}_{}".format(serial_number, str(
                int((ticket_type[0].NextNo).split("_")[1]) + 1))
            ticket_type[0].update(NextNo=ticket_number)

        return ticket_number

    @staticmethod
    async def get_ticket_number(tickettype):
        return await Alerts.generate_ticket_number(tickettype)

    def payload(self, local=False):
        # local_timestamp = self.Timestamp.astimezone(tz = tz.tzlocal())
        local_timestamp = self.Timestamp.replace(
            tzinfo=datetime.timezone.utc).astimezone(tz=None)
        image_path = self.generate_url_list(local_timestamp.replace(
            microsecond=0).strftime('%d-%m-%Y'), self.Camera_id, self.Image_path, local=local)
        return {
            "Camera_name": self.Camera_name,
            "Camera_id": self.Camera_id,
            "Location": self.Location,
            "Service_id": self.Service_id,
            "Ticket_number": self.Ticket_number.split("_")[1],
            "Alert": self.Alert,
            "Date": local_timestamp.replace(microsecond=0).date(),
            "Time": local_timestamp.replace(microsecond=0).time(),
            # "Video_path": self.generate_url(self.Video_path) if self.Video_path else None,
            "Image_path": image_path,
            "Sync_status": self.Sync_status,
            "False_detection": self.False_detection,
            "CloudImage": self.CloudImageURL,
        }

    @staticmethod
    def generate_url_list(date, camera_id, datalist, local=False):
        urllist = []
        for path in datalist:
            if not local:
                data = json.loads(open("./mounts/env.json", 'r').read())
                if len(path.split("/")) == 2:
                    # url = "http://{}:{}/{}/{}".format(
                    #     data["HOST"], data["PORT"], config.STATICFILE_DIR, path)
                    url = "/{}/{}".format(config.STATICFILE_DIR, path)
                else:
                    # url = "http://{}:{}/{}/{}/Alert/{}/{}".format(
                    #     data["HOST"], data["PORT"], config.STATICFILE_DIR, date, camera_id, path)
                    url = "/{}/{}/Alert/{}/{}".format(config.STATICFILE_DIR, date, camera_id, path)
                # url = "http://{}:{}/{}/{}/Alert/{}/{}".format(
                #     data["HOST"], data["PORT"], config.STATICFILE_DIR, date, camera_id, path)
            else:

                if len(path.split("/")) == 2:
                    url = "{}/{}/{}/{}".format(
                        os.getcwd(), 'static_server', 'static_image', 'image_not_available.png')
                else:
                    url = "{}/{}/{}/Alert/{}/{}".format(
                        os.getcwd(), 'static_server', date, camera_id, path)
            urllist.append(url)
        return urllist

    @staticmethod
    def generate_url(date, camera_id, path, local=False):
        if not local:
            data = json.loads(open("./mounts/env.json", 'r').read())
            url = "http://{}:{}/{}/{}/Alert/{}/{}".format(
                data["HOST"], data["PORT"], config.STATICFILE_DIR, date, camera_id, path)
        else:
            url = "{}/{}/{}/Alert/{}/{}".format(os.getcwd(),
                                                'static_server', date, camera_id, path)
        return url


class ReportMetrics(EmbeddedDocument):
    Metric = StringField()
    Metric_data = DictField()
    Total = IntField()

    def payload(self):
        return {
            "Metric": self.Metric,
            "Metric_data": self.Metric_data,
            "Total": self.Total
        }


class Reports(Document):
    Camera_name = StringField()
    Camera_id = StringField()
    Service_id = StringField()
    Location = StringField()
    Report_number = StringField()
    # Report_data = EmbeddedDocumentListField(ReportMetrics)
    Report_data = DictField()
    Timestamp = DateTimeField()
    Sync_status = BooleanField(default=False)
    meta = {'indexes': [
        {'fields': ['$Camera_name', "$Camera_id", "$Service_id", "$Location", "$Report_number", "$Report_data.Metric"],
         'default_language': 'english'
         }],
        'ordering': ['-Timestamp']
    }

    def payload(self, local=False):
        local_timestamp = self.Timestamp.replace(
            tzinfo=datetime.timezone.utc).astimezone(tz=None)
        report_data = self.Report_data if not self.check_image_field(
        ) else self.generate_report_data(local_timestamp, local=local)
        return {
            "Camera_name": self.Camera_name,
            "Camera_id": self.Camera_id,
            "Location": self.Location,
            "Service_id": self.Service_id,
            "Report_number": self.Report_number.split("_")[1],
            "Report_data": self.Report_data,
            # "Metrics": metric,
            "Date": local_timestamp.replace(microsecond=0).date(),
            "Time": local_timestamp.replace(microsecond=0).time(),
            "Sync_status": self.Sync_status
        }

    @staticmethod
    def generate_url(date, camera_id, path, local=False):
        if not local:
            data = json.loads(open("./mounts/env.json", 'r').read())
            url = "http://{}:{}/{}/{}/Report/{}/{}".format(
                data["HOST"], data["PORT"], config.STATICFILE_DIR, date, camera_id, path)
        else:
            url = "{}/{}/{}/Report/{}/{}".format(
                os.getcwd(), 'static_server', date, camera_id, path)
        return url

    def metric_payload(self):
        report_list = []
        metric = []
        for report in self.Report_data:
            if report.Metric not in metric:
                metric.append(report.Metric)
            report_list.append(report.payload())
        return metric, report_list

    def check_image_field(self):
        for k, v in self.Report_data.items():
            if str(v).split(".")[-1] in ["jpg", "png"]:
                return True
        else:
            return False

    def generate_report_data(self, local_timestamp, local=False):
        for k, v in self.Report_data.items():
            if str(v).split(".")[-1] in ["jpg", "png"]:
                self.Report_data[k] = self.generate_url(local_timestamp.replace(
                    microsecond=0).strftime('%d-%m-%Y'), self.Camera_id, v, local=local)
                return True
        else:
            return False

    @staticmethod
    async def generate_report_number(TicketType):
        serial_number = DeviceInfo.objects().first().Serial_number
        if not any(TicketQueue.objects(TicketName=TicketType)):
            ticket_number = "{}_1".format(serial_number)
            NextNumber = "{}_2".format(serial_number)
            TicketQueue(TicketName=TicketType, NextNo=NextNumber).save()
            return ticket_number
        else:
            objects = TicketQueue.objects(TicketName=TicketType).first().NextNo
            ticket_number = "{}_{}".format(
                serial_number, str(int(objects.split("_")[1]) + 1))
            console_logger.debug(ticket_number)
            TicketQueue.objects(TicketName=TicketType).first().update(
                NextNo=ticket_number)
        return objects

    @staticmethod
    async def get_report_number(tickettype):
        return await Reports.generate_report_number(tickettype)


class CloudSettings(Document):
    Cloudtype = StringField()
    Def_params = DictField(default=None)
    Aws_params = DictField(default=None)
    Azure_params = DictField(default=None)
    FTP_params = DictField(default=None)

    def payload(self):
        if self.Cloudtype == "Default":
            return {
                "Cloudtype": self.Cloudtype,
            }
        else:
            return {
                "Cloudtype": self.Cloudtype,
                "Aws_params": self.Aws_params,
                "Azure_params": self.Azure_params,
                "FTP_params": self.FTP_params
            }


class Taskmeta(Document):
    Task_name = StringField()
    Task_time = DateTimeField()
    Status = StringField()
    Traceback = StringField()


class SmtpSettings(Document):
    Smtp_ssl = BooleanField()
    Smtp_port = IntField()
    Smtp_host = StringField()
    Smtp_user = StringField()
    Smtp_password = StringField()
    Emails_from_email = EmailField()
    Emails_from_name = StringField()


class AlertSettings(Document):
    Service_id = StringField()
    Alert_priority = StringField()
    Alert_action = ListField(StringField())
    Alert_frequency = StringField()
    Double_check = BooleanField()


class AlertActions(Document):
    actions = ListField(StringField())

    def payload(self):
        return {
            "actions": self.actions
        }


class TelegramDetails(Document):
    Token = StringField()
    ChannelLink = StringField()
    ServiceStatus = BooleanField()

    def payload(self):
        return {
            "token": cryptocode.decrypt(self.Token, os.environ.get("SECRET_KEY_ENCRYPT")) if self.Token != None else None,
            "channel": self.ChannelLink,
            "state": self.ServiceStatus,
        }

    def secure_token(self, token):
        self.Token = cryptocode.encrypt(
            token, os.environ.get("SECRET_KEY_ENCRYPT"))


class AlertActionsSettings(Document):
    action = StringField(required=True)
    fieldsRequired = DictField()

    def payload(self):
        return {
            "action": self.action,
            "fieldsRequired": self.fieldsRequired
        }


class Notifications(Document):
    ticket_no = StringField()
    title = StringField()
    unread = BooleanField(default=True)
    camera_id = StringField()
    message = StringField()
    image = ListField(StringField(default=None))
    created = DateTimeField(default=datetime.datetime.utcnow())
    expireOn = DateTimeField(
        default=datetime.datetime.utcnow()+datetime.timedelta(minutes=7*24*60))
    meta = {
        'indexes': [
            {
                'fields': ['expireOn'],
                'expireAfterSeconds': 0
            }
        ]
    }

    @staticmethod
    def generate_url_list(date, camera_id, datalist, local=False):
        urllist = []
        for path in datalist:
            if not local:
                data = json.loads(open("./mounts/env.json", 'r').read())
                if len(path.split("/")) == 2:
                    # url = "http://{}:{}/{}/{}".format(
                    #     data["HOST"], data["PORT"], config.STATICFILE_DIR, path)
                    url = "/{}/{}".format(config.STATICFILE_DIR, path)
                else:
                    # url = "http://{}:{}/{}/{}/Alert/{}/{}".format(
                    #     data["HOST"], data["PORT"], config.STATICFILE_DIR, date, camera_id, path)
                    url = "/{}/{}/Alert/{}/{}".format(config.STATICFILE_DIR, date, camera_id, path)
            else:
                url = "{}/{}/{}/Alert/{}/{}".format(
                    os.getcwd(), 'static_server', date, camera_id, path)
            urllist.append(url)
        return urllist

    def payload(self):
        local_timestamp = self.created.replace(tzinfo=datetime.timezone.utc).astimezone(tz=None)
        # console_logger.debug(local_timestamp)
        image_path = self.generate_url_list(local_timestamp.replace(microsecond=0).strftime('%d-%m-%Y'), self.camera_id, self.image)
        return {
            "ticket_no": self.ticket_no,
            "title": self.title,
            "unread": self.unread,
            "message": self.message,
            "image": image_path,
            "created": local_timestamp.replace(microsecond=0).strftime('%d/%m/%Y %I:%M:%S %p')
        }


class WhatsappSettings(Document):
    url = StringField()
    username = StringField()
    password = StringField()
    namespace = StringField()
    template = StringField()
    language = StringField()
    token = StringField()
    contacts = DictField()
    created = DateTimeField(default=datetime.datetime.utcnow())
    expiredOn = DateTimeField()
    serviceStatus = BooleanField()

    def payload(self):
        return {
            "url": self.url,
            "username": self.username,
            "namespace": self.namespace,
            "template": self.template,
            "language": self.language,
            "contacts": self.contacts,
            "password": self.password,
            "serviceStatus": self.serviceStatus
        }

    def set_password(self, password):
        return cryptocode.encrypt(password, os.environ.get("SECRET_KEY_ENCRYPT"))

    def get_password(self, password):
        return cryptocode.decrypt(password, os.environ.get("SECRET_KEY_ENCRYPT"))


#### sachin

class AnprDetails(Document):
    record_id = StringField()
    vehicle_number = StringField()
    company_id = StringField()
    site_name = StringField()
    location = StringField()
    group_id = StringField()
    type = StringField()
    device_name = StringField()
    direction = StringField()
    visited_datetime = DateTimeField()
    vehicle_image = StringField()
    number_plate = StringField()
    
    def payload(self,local=False):
        return {
            "record_id": self.record_id,
            "vehicle_number": self.vehicle_number,
            "company_id": self.company_id,
            "site_name": self.site_name,
            "location": self.location,
            "group_id": self.group_id,
            "type": self.type,
            "device_name": self.device_name,
            "direction": self.direction,
            "visited_datetime": self.visited_datetime,
            "vehicle_image": self.vehicle_image,
            "number_plate": self.number_plate
        }


