import os
import sys
import time
import requests
import json
from urllib.parse import urlparse
from api.service.models import *
from api.service.serializers import *
from config import TestConfig as config
from api.service.helpers.upload import Upload
from api.service.helpers.general_helpers import retry


class SyncOperations:
    def __init__(self):
        self.services = self.get_services()
        device = DeviceInfo.objects.first()
        self.serial_number = device.Serial_number if device else None

    @staticmethod
    @retry(exceptions=(TimeoutError, ConnectionError, ConnectionRefusedError), delay=10, times=5)
    def get_services():
        console_logger.debug("calling get services")
        url = config.FETCH_SERVICES + "/"
        data = {
            "Type": "Usecase",
            "Status": [
                "Active"
            ]
        }
        r = requests.post(url, data=json.dumps(data))
        if r.status_code == 200:
            services = json.loads(r.text)
        else:
            services = []
        console_logger.debug(services)
        services["Services"].append(
            {'Service_id': 'CAMV1', 'Service_name': 'Camera Management'})
        console_logger.debug(services)
        return services

    @staticmethod
    def internet_present(hostname):
        try:
            response = os.system("ping -c 1 " + hostname)
            return True if(response == 0) else False
        except Exception as e:
            console_logger.debug(e)
            return False

    def sync_reports(self):
        try:
            if not Server.objects(Server_role__icontains="Ticketing"):
                return "Success"

            server = Server.objects.get(Server_role="Ticketing")
            # hostname = server.Url if(server.Url) else 'http://{}:{}'.format(server.Ip, server.Port)
            hostname = "www.google.com"
            while True:
                if self.internet_present(hostname):
                    console_logger.debug("Internet Present")
                    break
                time.sleep(300)
                console_logger.debug("Internet absent")

            for service in self.services:
                page_no = 1
                console_logger.debug(self.services)
                total_pages = self.get_total_pages(service["Service_name"])
                while page_no <= total_pages:
                    reports = self.fetch_reports(
                        service["Service_name"], page_no)
                    if not self.push_to_cloud(reports, service["Service_name"]):
                        return "Failed"
                    page_no += 1
            console_logger.debug("Syncing complete")
            return "Success"
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            raise "Failed"

    def get_total_pages(self, service):
        try:
            url = 'http://{}:8000/api/v1/{}/reports?unsync=true'.format(
                service, service)
            r = requests.get(url)
            data = json.loads(r.text)
            console_logger.debug(data)
            total_pages = data["total_data"] / data["per_page"]
            return total_pages
        except Exception as e:
            console_logger.debug(e)
            return 1

    @staticmethod
    def fetch_reports(service, page_no):
        try:
            url = 'http://{}:8000/api/v1/{}/reports?unsync=true&page_no={}'.format(
                service, service, page_no)
            r = requests.get(url)
            data = json.loads(r.text)["data"]
            return data
        except Exception as e:
            return []

    def push_to_cloud(self, reports, service):
        reports = self.push_files(reports, service)

        # Segregating reports whose files were pushed successfully
        synced_reports = list()
        for report in reports:
            if report["Upload_status"]:
                del report["Upload_status"]
                synced_reports.append(report)
            else:
                pass

        server = Server.objects(Server_role='Ticketing')

        if server.Url:
            hostname = server.Url + '/reports/sync'
        else:
            hostname = 'http://{}:{}/reports/sync'.format(
                server.Ip, server.Port)
        payload = {
            'Serial_number': self.serial_number,
            'Service_name': service,
            'Reports': synced_reports
        }
        headers = {'content-type': 'application/json'}
        r = requests.post(
            url=hostname,
            data=json.dumps(payload),
            headers=headers
        )
        if r.status_code == 200:
            if self.notify_usecase(service, sync_reports):
                return True
            else:
                return False
        else:
            return False

    def notify_usecase(self, service, sync_reports):
        url = "http://{}:8000/api/v1/{}/report/notify".format(service, service)
        payload = {"Reports": []}
        for report in sync_reports:
            payload["Reports"].append(report["id"])
        r = requests.post(url, json.dumps(payload))
        if r.status_code == 200:
            return True
        else:
            return False

    def push_files(self, reports, service_name):
        uploader = Upload()

        for service in self.services:
            if service["Service_name"] == service_name:
                service_id = service['Service_id']

        for report in reports:
            if report["Image_path"]:
                client_img = "report/images/{}_{}_{}.png".format(
                    self.serial_number, datetime.datetime.utcnow().strftime("%m-%d-%Y_%H-%M-%S"), service_id)
                localpath = config.STATICFILE_DIR + \
                    os.path.basename(urlparse(report["Image_path"]).path)
                img_status, img_url = uploader.upload_file(
                    localpath, client_img)

            if img_status:
                report["Image_path"] = img_url

            if report["Vidoe_path"]:
                client_vid = "report/videos/{}_{}_{}.mp4".format(
                    self.serial_number, datetime.datetime.utcnow().strftime("%m-%d-%Y_%H-%M-%S"), service_id)
                localpath = config.STATICFILE_DIR + \
                    os.path.basename(urlparse(report["Vidoe_path"]).path)
                vid_status, vid_url = uploader.upload_file(
                    localpath, client_vid)

            if vid_status:
                report["Video_path"] = vid_url

            if img_status and vid_status:
                report["Upload_status"] = True
            else:
                report["Upload_status"] = False
        return reports

    def sync_alerts(self):
        try:
            console_logger.debug("syncing alerts: -0")
            if not Server.objects(Server_role__icontains="Ticketing"):
                return "Success"

            server = Server.objects.get(Server_role="Ticketing")
            # hostname = server.Url if(server.Url) else 'http://{}:{}'.format(server.Ip, server.Port)
            hostname = "www.google.com"
            while True:
                if self.internet_present(hostname):
                    console_logger.debug("Internet Present")
                    break
                time.sleep(300)
                console_logger.debug("Internet absent")

            priority = ['High', 'Medium', 'Low']
            page_no = 1
            for i in priority:
                settings = AlertSettings.objects(Alert_priority=i)
                for setting in settings:
                    alerts = Alerts.objects(
                        Service_id=setting.Service_id, Sync_status=False)
                    per_page = 10
                    a = 0
                    a = len(alerts)/per_page
                    remaing = int(str(a-int(a))[1:].split('.')[1])
                    if remaing >= 1:
                        no_of_pages = int(a)+1
                    else:
                        no_of_pages = int(a)
                    console_logger.debug(no_of_pages)
                    while page_no <= no_of_pages:
                        alert_list = list()
                        start = page_no * per_page - per_page
                        end = page_no * per_page
                        alerts_to_be_sent = alerts[start:end]
                        for alert in alerts_to_be_sent:
                            alert_list.append(alert.payload(local=True))
                        # alerts_to_be_sent = json.loads(alerts_to_be_sent.to_json())
                        # # alerts_to_be_sent = json.loads(alerts_to_be_sent.payload(Local=True))
                        # console_logger.debug(alerts_to_be_sent)
                        # alerts = SyncAlerts(
                        #     Alerts = alerts_to_be_sent
                        # ).dict()
                        # console_logger.debug(alerts)
                        if not self.push_alerts_to_cloud(alert_list, setting.Service_id):
                            return "Failed"
                        page_no += 1
            return "Success"
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))

    def push_alerts_to_cloud(self, alerts, service):
        try:
            self.device = DeviceInfo.objects.first()
            alertsettings = AlertSettings.objects(Service_id=service).first()
            alert_priority = "Normal"
            # get priority names as per ticketing database
            if alertsettings:
                if alertsettings.Alert_priority == 'Low':
                    alert_priority = "Normal"
                elif alertsettings.Alert_priority == 'Medium':
                    alert_priority = "Urgent"
                elif alertsettings.Alert_priority == 'High':
                    alert_priority = "Critical"
            console_logger.debug("pushing alerts to cloud")
            alerts = self.push_alert_files(alerts, service)

            # Segregating reports whose files were pushed successfully
            synced_alerts = list()
            for alert in alerts:
                # console_logger.debug(alert)
                if alert["Upload_status"]:
                    del alert["Upload_status"]
                    synced_alerts.append(alert)
                else:
                    pass

            server = Server.objects(Server_role='Ticketing')
            alerturl = config.DIYCAMTICKETINGURL
            if server[0].Ownership == "Client":
                alerturl = server.Url

            headers = {"Content-Type": "application/json",
                       "accesstoken": self.device.Access_key}

            # payload = {
            #     'Service_id': service,
            #     'Serial_number': self.serial_number,
            #     'Alerts': synced_alerts
            # }
            console_logger.debug(alerturl)
            for alert in synced_alerts:
                console_logger.debug("syncing to ticketing")
                console_logger.debug(alert)
                payload = {"subject": "{} in camera_id:{}".format(alert.get('Alert'), alert.get('Camera_name')),
                           "group": self.device.GroupID,
                           "type": self.device.TypeID,
                           "issue": alert["Image_path"],
                           "priority": self.device.Priorities.get(alert_priority)}

                console_logger.debug(alert)
                try:
                    r = requests.post(
                        url=alerturl,
                        data=json.dumps(payload),
                        headers=headers,
                        timeout=20
                    )
                    console_logger.debug(r.status_code)
                except requests.exceptions:
                    console_logger.debug("request Exception occured")
                    return False
            if r.status_code == 200:
                console_logger.debug("alert sending to ticketing successfull")
                if self.update_alert_status(synced_alerts):
                    return True
            else:
                return False

        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
            return False

    def update_alert_status_individual(self, alert):
        alert.update(Sync_status=True,
                     CloudImageURL=synced_alert["cloud_paths"])

    def update_alert_status(self, synced_alerts):
        for synced_alert in synced_alerts:
            alert = Alerts.objects.get(Ticket_number=(
                self.device.Serial_number + "_"+synced_alert['Ticket_number']))
            console_logger.debug(synced_alert)
            alert.update(Sync_status=True,
                         CloudImageURL=synced_alert["cloud_paths"])

        return True

    def push_alert_files(self, alerts, service_name):
        try:
            self.uploader = Upload()
            # for service in self.services['Services']:
            #     if service["Service_id"] == service_name:
            #         service_id = service['Service_id']

            for alert in alerts:
                if any(alert['Image_path']):
                    image_body = ""
                    cloud_paths = list()
                    for image in alert['Image_path']:
                        client_img = image.split("/", 5)[-1]
                        localpath = image
                        # added local path to file

                        if alert["Alert"] == "camera - inactive":
                            localpath = os.path.join(
                                os.getcwd(), "static_server", config.STATIC_IMAGE)
                        console_logger.debug(localpath)
                        img_status, img_url = self.uploader.upload_file(
                            localpath, client_img)
                        if img_status:
                            image_body += "![image]({})".format(img_url)
                            cloud_paths.append(img_url)

                if img_status:
                    alert["Image_path"] = image_body
                    alert["cloud_paths"] = cloud_paths
                    alert["Upload_status"] = True
                # if alert["Video_path"]:
                #     client_vid = "alert/videos/{}_{}_{}.mp4".format(self.serial_number, datetime.datetime.utcnow().strftime("%m-%d-%Y_%H-%M-%S"), service_id)
                #     localpath = config.STATICFILE_DIR + os.path.basename(urlparse(alert["Vidoe_path"]).path)
                #     vid_status, vid_url = self.uploader.upload_file(localpath, client_vid)

                # if vid_status:
                #     alert["Video_path"] = vid_url

                # if img_status:
                #     alert["Upload_status"] = True
                else:
                    alert["Upload_status"] = False
            console_logger.debug(alerts)
            return alerts
        except Exception as e:
            console_logger.debug(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            console_logger.debug("Error on line {}".format(
                sys.exc_info()[-1].tb_lineno))
