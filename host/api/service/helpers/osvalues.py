import os
import psutil
import subprocess, shlex
import regex as re
import netifaces
import platform
from api.service.helpers.logs import console_logger

# from api.service.helpers.logs import console_logger
interfaces_file = "/etc/network/interfaces"

def fetch_values():
    values = {}
    if 'x' not in platform.machine():
        values["Mac_id"] = get_mac_id_using_shell()
        values["SD_card_id"] = get_sd_id()
    else:
        values["Mac_id"] = get_mac_id_using_cmd()
        values["SD_card_id"] = SD_card_id_using_shell().strip()
    return values


def get_sd_id():
    """ get sd card's unique id"""
    sd_card_value = None
    command = ["sudo", "udevadm", "info", "-a", "-n", "/dev/mmcblk0"]
    output = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=False)
    for line in output.stdout:
        l = line.decode("utf8")
        if l.find("ATTRS{cid}==") != -1:
            sd_card_value = l[l.find("ATTRS{cid}==") + 13:-2]
    print("SD ID: {}".format(sd_card_value))
    return sd_card_value


def get_mac_id_using_cmd():
    mac_id  = None
    try:
        with open(interfaces_file, "r") as f:
            for line in f.read().split("\n"):
                try:
                    line.index("allow-hotplug")
                    return netifaces.ifaddresses(line.split(" ")[-1])[netifaces.AF_LINK][0]['addr'].replace(":", "")
                except Exception:
                    pass
    except Exception:
        pass

    interfaces = netifaces.interfaces()
    for interface in interfaces:
        if interface[:2] in ['et', 'en']:
            mac_id = netifaces.ifaddresses(interface)[netifaces.AF_LINK][0]['addr'].replace(":", "")
            break

    return mac_id


def get_jetpack_version():
    cmd = ['sudo', 'apt', 'show', 'nvidia-jetpack']
    cmd2 = ['grep', 'Version']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    p2 = subprocess.Popen(cmd2, stdin=p.stdout, stdout=subprocess.PIPE)
    for line in p2.stdout:
        l = line.decode("utf8")
        return l.rstrip().replace(" ","").split(":")[1]


def get_board_version():
    shell_script_path = os.path.join(os.getcwd(), "api", "service", "helpers", "jetson_variables.sh")
    command = ['bash', '-c', 'source {} && env'.format(shell_script_path)]

    proc = subprocess.Popen(command, stdout = subprocess.PIPE)
    environment_vars = {}
    for line in proc.stdout:
        (key, _, value) = line.partition(b"=")
        environment_vars[key.decode()] = value.decode()

    proc.communicate() 
    return environment_vars["JETSON_TYPE"].strip().split(" ")[0]


def get_mac_id_using_shell():
    mac_id = None
    board_version = get_board_version()
    shell_script_path = os.path.join(os.getcwd(), "api", "service", "helpers", "read_mac.sh")
    command = ['bash', shell_script_path, board_version]

    proc = subprocess.Popen(command, stdout = subprocess.PIPE)
    environment_vars = {}
    for line in proc.stdout:
        mac_id = line.decode('utf8').split('\n')

    proc.communicate() 
    return mac_id[0].replace(":", "") 

def get_disk_type():
    cmd1 = ['df']
    cmd2 = ['grep','/$']
    p = subprocess.Popen(cmd1, stdout=subprocess.PIPE)
    p2 = subprocess.Popen(cmd2, stdin=p.stdout, stdout=subprocess.PIPE)
    l = None
    for line in p2.stdout:
        l = line.decode("utf8")  
    return l.split(" ")[0]



def SD_card_id_using_shell():
    console_logger.debug("getting sd card id")
    SD_card_id = None
    console_logger.debug(get_disk_type())
    cmd1 = shlex.split("udevadm info --query=all --name={}".format(get_disk_type()))
    cmd2 = shlex.split("grep ID_SERIAL_SHORT")
    p = subprocess.Popen(cmd1, stdout=subprocess.PIPE)
    p2 = subprocess.Popen(cmd2, stdin=p.stdout, stdout=subprocess.PIPE)
    l = None
    for line in p2.stdout:
        l = line.decode("utf8")
    console_logger.debug(l.split("=")[-1])
    return l.split("=")[-1]

