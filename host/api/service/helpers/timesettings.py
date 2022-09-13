from time import ctime
import subprocess
import shlex
import ntplib
import requests
import json
import datetime
from api.service.models import TimeSettings
from api.service.helpers.logs import console_logger
import time


def list_timezones():
    command = ["timedatectl", "list-timezones"]
    process = subprocess.Popen(
        command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    timezones = list()
    for line in process.stdout:
        l = line.decode("utf8")
        l = l.rstrip().split("\n")
        l = l[0].split(" ")
        timezones = timezones + l
    return timezones


def set_timezone(timezone):
    command = ["sudo", "timedatectl", "set-timezone", timezone]
    process = subprocess.Popen(
        command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    return False if(process.stderr) else True


def get_timezone():
    command = ["cat", "/etc/timezone"]
    process = subprocess.Popen(
        command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    # timezone = process.stdout.readline.rstrip().decode("utf8")
    timezone = process.stdout.readline().rstrip().decode("utf8")
    system_datetime = datetime.datetime.strftime(
        datetime.datetime.now(), "%Y-%m-%d{}%H:%M:%S".format("T"))
    return timezone, system_datetime


def set_datetime(datetimestr):
    console_logger.debug(datetimestr)
    subprocess.call(shlex.split("sudo timedatectl set-ntp true"))
    command = ["sudo", "timedatectl", "set-time", datetimestr]
    process = subprocess.Popen(
        command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    console_logger.debug(process.stderr)
    return False if(process.stderr) else True


def timedatectl_post_process():
    subprocess.call(shlex.split("sudo timedatectl set-ntp true"))
    subprocess.call(shlex.split("sudo timedatectl set-local-rtc false"))

# def set_rtc():
#     command = ["sudo", "timedatectl", "set-local-rtc", "1"]
#     process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
#     for line in process.stdout:
#         console_logger.debug(line.decode("utf-8"))
#     return False if(process.stderr or process.stdout) else True


def fetch_ntpvalues(ntpserver):
    try:
        c = ntplib.NTPClient()
        response = c.request(ntpserver, version=3)
        ntpDate = datetime.datetime.fromtimestamp(response.tx_time)
        datetimestr = datetime.datetime.strftime(ntpDate, "%y-%m-%d %H:%M:%S")
        return datetimestr
    except Exception:
        return 0


def fetch_timezone():
    try:
        url = "https://js.maxmind.com/geoip/v2.1/city/me?referrer=https%3A%2F%2Fwww.maxmind.com"
        response = requests.get(url, timeout=10)
        data = json.loads(response.content)
        console_logger.debug("Automatic timezone: {}".format(
            data['location']['time_zone']))
        return data['location']['time_zone']
        # to pretty print all returned data
        # print json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))
    except Exception as e:
        console_logger.debug(e)
        return False


def update_timezone():
    timesetting = TimeSettings.objects().first()
    if timesetting.AutoTimeZone:
        if fetch_timezone():
            set_timezone(fetch_timezone())
    return True

def unix_to_local(unix_timestamp):
    unix_to_local = time.localtime(int(unix_timestamp))
    unix_to_datetime = time.strftime("%Y-%m-%d %H:%M:%S", unix_to_local)
    return unix_to_datetime