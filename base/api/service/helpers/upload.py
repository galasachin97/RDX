import boto3
import requests
import json
import os
from ftplib import FTP
from mongoengine.errors import DoesNotExist
from botocore.exceptions import NoCredentialsError
from azure.storage.blob import BlobServiceClient
from api.service.helpers.logs import console_logger
from api.service.models import *
from api.service.helpers import check_internet


class Upload:
    """
        Upload helper
    """

    def __init__(self):
        self.settings = CloudSettings.objects.first()
        if self.settings:
            pass
        else:
            if check_internet.is_internet_present():
                device = DeviceInfo.objects.first()
                if not device:
                    pass
                else:
                    if device.Access_key is not None and device.Serial_number is not None:
                        response = requests.request(
                            method="GET",
                            url="http://marketplace.diycam.com/api/v1/devices/alert/upload/details",
                            headers={
                                "accessKey": device.Access_key,
                                "serialNumber": device.Serial_number
                            }
                        )
                        # console_logger.debug(json.loads(response.text))
                        self.settings = CloudSettings(
                            **json.loads(response.text)["detail"])
                        self.settings.save()
            else:
                pass

    def upload_file(self, filepath, target_name):
        if self.settings.Cloudtype == "Default":
            return self.__upload_to_default(filepath, target_name)

        if self.settings.Cloudtype == "AWS":
            return self.__upload_to_aws(filepath, target_name)

        if self.settings.Cloudtype == "Azure":
            return self.__upload_to_azure(filepath, target_name)

        if self.settings.Cloudtype == "FTP":
            return self.__upload_to_ftp(filepath, target_name)

    def __upload_to_default(self, filepath, target_name):
        """
            Uploads to AWS
        """
        # Defining values
        console_logger.debug(target_name)
        aws_access_key_id = self.settings.Def_params["Access_key"]
        aws_secret_access_key = self.settings.Def_params["Secret_key"]
        bucket = self.settings.Def_params["Bucket"]
        if self.settings.Def_params["Path"]:
            target_name = "{}/{}".format(
                self.settings.Def_params["Path"], target_name)

        # Creating s3 client
        s3 = boto3.client('s3', aws_access_key_id=aws_access_key_id,
                          aws_secret_access_key=aws_secret_access_key)

        # 3 Defining url
        location = s3.get_bucket_location(Bucket=bucket)['LocationConstraint']
        url = "https://{}.s3.{}.amazonaws.com/{}".format(
            bucket, location, target_name)

        try:
            s3.upload_file(filepath, bucket, target_name)
            console_logger.debug("Upload Successful")
            return True, url
        except FileNotFoundError:
            console_logger.debug("The file was not found")
            return False, None
        except NoCredentialsError:
            console_logger.debug("Credentials not available")
            return False, None

    def __upload_to_aws(self, filepath, target_name):
        """
            Uploads to AWS
        """
        # Defining values
        aws_access_key_id = self.settings.Aws_params["Access_key"]
        aws_secret_access_key = self.settings.Aws_params["Secret_key"]
        bucket = self.settings.Aws_params["Bucket"]
        if self.settings.Aws_params["Path"]:
            target_name = "{}/{}".format(
                self.settings.Aws_params["Path"], target_name)

        # Creating s3 client
        s3 = boto3.client('s3', aws_access_key_id=aws_access_key_id,
                          aws_secret_access_key=aws_secret_access_key)

        # 3 Defining url
        location = s3.get_bucket_location(Bucket=bucket)['LocationConstraint']
        url = "https://{}.s3.{}.amazonaws.com/{}".format(
            bucket, location, target_name)

        try:
            s3.upload_file(filepath, bucket, target_name)
            console_logger.debug("Upload Successful")
            return True, url
        except FileNotFoundError:
            console_logger.debug("The file was not found")
            return False, None
        except NoCredentialsError:
            console_logger.debug("Credentials not available")
            return False, None

    def __upload_to_azure(self, filepath, target_name):
        """
            Upload to Azure
        """
        # Defining values
        try:
            connection_string = self.settings.Azure_params["Connection_string"]
            container_name = self.settings.Azure_params["Container_name"]
            if self.settings.Azure_params["Path"]:
                target_name = "{}/{}".format(
                    self.settings.Azure_params["Path"], target_name)

            blob_service_client = BlobServiceClient.from_connection_string(
                connection_string)
            container_client = blob_service_client.get_container_client(
                container_name)

            blob_client = blob_service_client.get_blob_client(
                container=container_name, blob=target_name)

            # Upload the created file
            with open(filepath, "rb") as data:
                blob_client.upload_blob(data)

            url = blob_client.url
            return True, url
        except:
            return False, None

    def __upload_to_ftp(self, filepath, target_name):
        """
            Upload via FTP
        """

        # Defining values
        try:
            # Setting up ftp
            ftp = FTP(
            ) if self.settings.FTP_params["Secure"] == "0" else FTP_TLS()
            ftp.connect(
                self.settings.FTP_params["Server_ip"], self.settings.FTP_params["Port"])
            ftp.login(
                user=self.settings.FTP_params["Username"], passwd=self.settings.FTP_params["Password"])

            # Defining remote file path
            remote_file_path = "{}/{}".format(
                self.settings.FTP_params["Path"], target_name)

            # Uploading the file
            with open(filepath, 'rb') as f:
                ftp.storbinary('STOR {}'.format(target_name), f)
            ftp.quit()

            # Creating the url
            url = "ftp://{}:{}@{}:{}/{}".format(self.settings.FTP_params["Username"],
                                                self.settings.FTP_params["Password"],
                                                self.settings.FTP_params["Server_ip"],
                                                self.settings.FTP_params["Port"],
                                                target_name)
            return True, url
        except ftplib.all_errors as e:
            console_logger.debug(str(e).split(None, 1)[0])
            return False, None
