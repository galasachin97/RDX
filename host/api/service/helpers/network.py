import ipaddress
from ipaddress import IPv4Network, IPv4Interface
from sqlite3 import adapters
import subprocess
import shutil
import time
import os
import yaml
from api.service.helpers.logs import console_logger
from config import Config
import socket
import speedtest
import netifaces
from pythonping import ping
import collections
import re
import datetime
network_directory = "/etc/NetworkManager/system-connections"
working_directory = os.getcwd()

# glob_bytes_sent_data = 0
# glob_bytes_received_data = 0

netplan_config = {
    "network": {
        "wifis": {
            "wlan0": {
                "addresses": ["192.168.0.150/24"],
                "dhcp4": False,
                "gateway4": "192.168.0.1",
                "nameservers": {"addresses": ["192.168.0.1", "8.8.8.8"]},
                "access-points": {},
            }
        },
        "renderer": "NetworkManager",
        "version": 2,
    }
}

interfaces_file = "/etc/network/interfaces"


class _NetworkManager:
    # def __init__(self):
    # self._networkDetailsDictionary = self._getUUIDSOfNetwork()
    # for _networkName, _ in self._networkDetailsDictionary.items():
    #     self._networkDetailsDictionary[_networkName].update(self._fetchNetworkDetails(_networkName))

    def _getEthernetAdapterName(self):
        try:
            with open(interfaces_file, "r") as f:
                for line in f.read().split("\n"):
                    try:
                        line.index("allow-hotplug")
                        return line.split(" ")[-1]
                    except Exception:
                        pass
        except Exception:
            interfaceNames = socket.if_nameindex()
            for name in interfaceNames:
                if name[1][:2] == "en" or name[1][:2] == "et":
                    return name[1]
        return None

    def _getWifiList(self, wifiAdapterName):
        firstCommand = ["sudo", "iwlist", wifiAdapterName, "scan"]
        secondCommand = ["grep", "ESSID"]
        firstProcess = subprocess.Popen(firstCommand, stdout=subprocess.PIPE)
        secondProcess = subprocess.Popen(
            secondCommand,
            stdin=firstProcess.stdout,
            stdout=subprocess.PIPE,
            universal_newlines=False,
        )
        ssidList = []
        for line in secondProcess.stdout:
            l = line.decode("utf8")
            ssidList.append(str(l.split("\n")[0].split(":")[1].replace('"', "")))
        # console_logger.debug(ssidList)
        return ssidList

    def _connectToWifi(self, ssid, password):
        if ssid in self._networkDetailsDictionary:
            self._disconnectFromNetwork(ssid)

        command = [
            "sudo",
            "nmcli",
            "device",
            "wifi",
            "connect",
            ssid,
            "password",
            password,
        ]
        output = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=False,
        )
        for line in output.stdout:
            l = line.decode("utf8").rstrip()
            if l.find("successfully") != -1:
                self.__init__()
                return True
            else:
                return False

    def _disconnectFromNetwork(self, connectionName):
        if connectionName in self._networkDetailsDictionary:
            command = [
                "sudo",
                "nmcli",
                "connection",
                "delete",
                self._networkDetailsDictionary[connectionName]["UUID"],
            ]
            output = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=False,
            )
            for line in output.stdout:
                l = line.decode("utf8")
                if l.find("successfully") != -1:
                    return True
                else:
                    return False
        else:
            return False

    def _getUUIDSOfNetwork(self):
        tempDictionary = {}
        command = ["sudo", "nmcli", "-t", "-f", "NAME,UUID", "con"]
        output = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=False,
        )
        for line in output.stdout:
            l = line.decode("utf8").rstrip()
            tempDictionary.update({l.split(":")[0]: {"UUID": l.split(":")[1]}})
        return tempDictionary

    def _check_for_ip(
        self, ip, subnet: str = None, gateway: str = None, dns: list = []
    ):
        adapterName = self._getEthernetAdapterName()
        dictionary = self._fetchEthernetDetails(adapterName)
        if dictionary["Ethernets"]["Ip"] != ip:
            command = ["sudo", "traceroute", ip]
            output = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=False,
            )

            hopsCounter = 0
            for i, line in enumerate(output.stdout):
                if "!H" in line.decode("utf8").rstrip().split(" "):
                    return False

                if (line.decode("utf8").rstrip().split(" ")).count("*") > 2:
                    hopsCounter += 1

            if hopsCounter > 10:
                return False
            else:
                return True
        else:
            if subnet and dictionary["Ethernets"]["Subnet_mask"] != subnet:
                return False
            if gateway and dictionary["Ethernets"]["Gateway"] != gateway:
                return False
            if len(dns) and collections.Counter(
                dictionary["Ethernets"]["Dns"]
            ) != collections.Counter(dns):
                return False

        return True
        # if i == 1:
        #     console_logger.debug(line.decode("utf8").rstrip().split(" "))
        #     if '!H' not in line.decode("utf8").rstrip().split(" "):
        #         return True
        #     else:
        #         return False
        # ipInfo = list(filter(None, line.decode("utf8").rstrip().split(" ")))
        # console_logger.debug(ipInfo)
        # if ipInfo[1] != "(incomplete)":
        #     return True
        # else:
        #     return False
        # return True

    # def _configureStaticIP(self, connectionName, ip, subnet, gateway):
    #     if connectionName in self._networkDetailsDictionary:
    #         self._disconnectFromNetwork(connectionName)

    #     ipv4Address = ipaddress.ip_interface(ip+"/"+subnet)
    #     command = ["sudo", "nmcli", "connection", "add", "con-name", connectionName,
    #                "ifname", "eth0", "type", "ethernet",
    #                "ip4", str(ipv4Address), "gw4", gateway]

    #     _tempDictionary = {
    #         "UUID": None,
    #         "ip": ip,
    #         "subnet": subnet,
    #         "gateway": gateway,
    #         "dns1": None,
    #         "dns2": None
    #     }
    #     output = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=False)
    #     for line in output.stdout:
    #         console_logger.debug(line)
    #         l = line.decode("utf8").rstrip()
    #         if l.find("successfully") != -1 or l.find("uuid") != -1:
    #             _tempDictionary["UUID"] = l.split("(")[1][:36]
    #             self._networkDetailsDictionary.update({connectionName:_tempDictionary})
    #             console_logger.debug(self._networkDetailsDictionary)
    #             return True
    #         else:
    #             return False

    def _fetchNetworkDetails(self, connectionName):
        _detailsDictionary = {
            "ip": None,
            "subnet": None,
            "gateway": None,
            "dns1": None,
            "dns2": None,
        }

        command = [
            "sudo",
            "nmcli",
            "-g",
            "ip4.address,ip4.gateway,ip4.dns",
            "connection",
            "show",
            connectionName,
        ]
        output = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=False,
        )
        for i, line in enumerate(output.stdout):
            l = line.decode("utf8").rstrip()
            if i == 0:
                _detailsDictionary["ip"] = str(ipaddress.ip_interface(l).ip)
                _detailsDictionary["subnet"] = str(ipaddress.ip_interface(l).netmask)
            elif i == 1:
                _detailsDictionary["gateway"] = l
            elif i == 2:
                _dnsList = l.split(" | ")
                _detailsDictionary["dns1"] = _dnsList[0] if _dnsList[0] != "" else None
                _detailsDictionary["dns2"] = _dnsList[1] if len(_dnsList) == 2 else None

        return _detailsDictionary

    def _set_network_priority(self, network):
        command = ["sudo", "ifmetric", network, "10"]
        process = subprocess.Popen(command, stderr=subprocess.STDOUT)
        return False if (process.stderr) else True

    def _configureWifi(self, networkAdapter, adapterType, ssid, password):
        netplanConfig = None
        configFilename = "{}-netcfg.yaml".format(adapterType)

        # open the sample config file for the specified adapter
        configFile = os.path.join(
            os.getcwd(),
            "api",
            "service",
            "helpers",
            "network_configs",
            "{}.yml".format(adapterType),
        )
        # configFile = os.path.join(os.getcwd(), "network_configs", "{}.yml".format(adapterType))

        with open(configFile) as f:
            netplanConfig = yaml.load(f)

        netplanConfig["network"][adapterType][networkAdapter] = {}

        # if wifi is selected, update the ssid and password
        netplanConfig["network"][adapterType][networkAdapter]["access-points"] = {
            ssid: {"password": password}
        }

        netplanConfig["network"][adapterType][networkAdapter]["dhcp4"] = True

        # create the yaml file for network configuration
        with open(configFilename, "w") as file:
            yaml.dump(netplanConfig, file, default_flow_style=False, default_style=None)

        # copy config file to netplan directory
        shutil.os.system(
            'sudo cp "{}" "{}"'.format(
                configFilename,
                os.path.join(Config.NETPLAN_CONFIG_FOLDER, configFilename),
            )
        )

        # delete the file from working directory
        os.remove(configFilename)

        # update the network configuration
        shutil.os.system("sudo netplan apply")

        return "Success"

    def _configureStaticIP(
        self,
        networkAdapter,
        adapterType,
        ip,
        subnet,
        gateway,
        dns=None,
        ssid=None,
        password=None,
    ):
        if self._check_for_ip(ip, subnet, gateway, dns):
            return "Fail"

        netplanConfig = None
        # configFilename = "{}-netcfg.yaml".format(adapterType)

        # open the sample config file for the specified adapter
        configFile = os.path.join(os.getcwd(), "..", "interfaces")
        # ipv4Address = ipaddress.ip_interface(ip+"/"+subnet)

        # configFile = os.path.join(os.getcwd(), "network_configs", "{}.yml".format(adapterType))

        file_content = "allow-hotplug {}\n".format(networkAdapter)
        file_content += "iface {} inet static\n".format(networkAdapter)
        file_content += "   address {}\n".format(ip)
        file_content += "   netmask {}\n".format(subnet)
        file_content += "   gateway {}\n".format(gateway)

        if isinstance(dns, list):
            for dnsEntry in dns:
                file_content += "   dns-nameserver {}\n".format(dnsEntry)

        with open(configFile, "w") as f:
            # netplanConfig = yaml.load(f)
            f.write(file_content)

        # console_logger.debug(netplanConfig)

        # convert subnet mask to cidr address
        # ipv4Address = ipaddress.ip_interface(ip+"/"+subnet)

        # # update ip address and gateway
        # netplanConfig['network'][adapterType][networkAdapter]['addresses'][0] = str(ipv4Address)
        # netplanConfig['network'][adapterType][networkAdapter]['gateway4'] = gateway

        # # if dns is present, then update the list of nameservers
        # if isinstance(dns, list):
        #     netplanConfig['network'][adapterType][networkAdapter]['nameservers']['addresses'] = dns

        # # if wifi is selected, update the ssid and password
        # if adapterType == 'wifis':
        #     netplanConfig['network'][adapterType][networkAdapter]['access-points'] = {ssid: {"password": password}}

        # # create the yaml file for network configuration
        # with open(configFilename, 'w') as file:
        #     yaml.dump(netplanConfig, file, default_flow_style=False, default_style=None)

        # # copy config file to netplan directory
        # shutil.os.system('sudo cp "{}" "{}"'.format(configFilename, os.path.join(Config.NETPLAN_CONFIG_FOLDER, configFilename)))
        shutil.os.system(
            'sudo cp "{}" "{}"'.format(configFile, Config.NETWORKMANAGER_PATH)
        )

        # # delete the file from working directory
        os.remove(configFile)
        # os.remove(configFilename)

        # # update the network configuration
        # shutil.os.system('sudo netplan apply')

        return "Success"

    def _fetchEthernetDetails(self, interfaceName, configFilename=None):
        # netplanConfig = {}
        ip = None
        subnet = None
        gateway = None
        dns = []
        config = {}

        # if configFilename:
        #     ethernetConfig = os.path.join(Config.NETPLAN_CONFIG_FOLDER, configFilename)
        # else:
        ethernetConfig = "interfaces"

        # if os.path.exists(ethernetConfig):
        # shutil.os.system('sudo cp "{}" "{}"'.format(os.path.join(Config.NETPLAN_CONFIG_FOLDER, configFilename), configFilename))
        shutil.os.system(
            'sudo cp "{}" "{}"'.format(Config.NETWORKMANAGER_PATH, ethernetConfig)
        )

        with open(ethernetConfig) as f:
            # netplanConfig = yaml.load(f)
            for line in f:
                # console_logger.debug(line)
                if "address" in line:
                    ipWithMask = str(line.split(" ")[-1])
                    # console_logger.debug(ipWithMask.split("/"))
                    ip = ipWithMask.split("/")[0].strip()
                elif "netmask" in line:
                    subnet = line.split(" ")[-1].strip()
                elif "gateway" in line:
                    gateway = line.split(" ")[-1].strip()
                elif "dns-nameserver" in line:
                    dns.append(line.split(" ")[-1].strip())

        # os.remove(ethernetConfig)

        # if netplanConfig:

        # cidrAddrs = IPv4Interface(netplanConfig["network"]["ethernets"][interfaceName]["addresses"][0]).with_netmask

        # config = {
        #     "Network_priority": "Ethernets",
        #     "Wifis": {},
        #     "Ethernets": {
        #         "Ip": str(cidrAddrs).split("/")[0],
        #         "Subnet_mask": str(cidrAddrs).split("/")[1],
        #         "Gateway": netplanConfig["network"]["ethernets"][interfaceName]["gateway4"],
        #         "Dns": netplanConfig["network"]["ethernets"][interfaceName]["nameservers"]["addresses"]
        #     }
        # }

        config = {
            "Network_priority": "Ethernets",
            "Wifis": {},
            "Ethernets": {
                "Ip": ip,
                "Subnet_mask": subnet,
                "Gateway": gateway,
                "Dns": dns,
            },
        }
        # console_logger.debug(config)
        return config
        # else:
        #     return netplanConfig

    def _fetchDownloadUploadSpeed(self):
        added_date = datetime.datetime.now(datetime.timezone.utc)
        local_timestamp = added_date.replace(tzinfo=datetime.timezone.utc).astimezone(tz=None)
        local_timestamp.replace(microsecond=0).strftime('%d/%m/%Y %I:%M:%S %p')
        details = {
            "datetime":local_timestamp.replace(microsecond=0).strftime('%d %b %Y %I:%M %p'),
            "download": "0",
            "upload": "0"
        }

        try:
            network_speed = speedtest.Speedtest()
            network_speed.download()
            network_speed.upload()
            network_speed_dic = network_speed.results.dict()
            details["download"] = f"{int(network_speed_dic['download']/(1024*1024))}"
            details["upload"] = f"{int(network_speed_dic['upload']/(1024*1024))}"

        except Exception as e:
            console_logger.debug(e)

        return details

    def _collectNetDetails(self):

        adapterName = self._getEthernetAdapterName()
        console_logger.debug(adapterName)
        ip = self._fetchEthernetDetails(adapterName)["Ethernets"]["Ip"]
        console_logger.debug(ip)
        network_details = {}

        latency_details = self._fetchLatency(ip)
        network_details["avg_latency"] = latency_details["avg_latency"]
        network_details["min_latency"] = latency_details["min_latency"]
        network_details["max_latency"] = latency_details["max_latency"]
        network_details["jitter"] = latency_details["jitter"]

        bytes_sent_rec_pack = self._fetchBytesSentRecev(adapterName)
        network_details["bytes_sent"] = bytes_sent_rec_pack["bytes_sent"]
        network_details["bytes_received"] = bytes_sent_rec_pack["bytes_received"]
        network_details["packet_loss"] = bytes_sent_rec_pack["packet_loss"]
        console_logger.debug(network_details)
        return network_details

    def _fetchLatency(self, ip):
        # result = subprocess.check_output(
        #     "ping -w 10 {}".format(ip), shell=True, stderr=subprocess.STDOUT
        # )
        output = subprocess.Popen(
            ["ping", "-w", "10", "{}".format(ip)],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=False,
        )
        for i, line in enumerate(output.stdout):
            # latency_detail_str = result.decode("utf-8").strip().split("\n")
            latency_detail_str = line.decode("utf8").rstrip()

            if "rtt" in latency_detail_str:
                console_logger.debug(latency_detail_str)
                latency_detail_list = (
                    latency_detail_str.partition(" = ")[2].strip().split("/")
                )
                avg_latency = f"{latency_detail_list[0]} ms"
                min_latency = f"{latency_detail_list[1]} ms"
                max_latency = f"{latency_detail_list[2]} ms"
                jitter = f"{latency_detail_list[3]}"
                return {
                    "avg_latency": avg_latency,
                    "min_latency": min_latency,
                    "max_latency": max_latency,
                    "jitter": jitter,
                }
        console_logger.debug("not found")
        return {
            "avg_latency": 0,
            "min_latency": 0,
            "max_latency": 0,
            "jitter": 0,
        }

    def _fetchBytesSentRecev(self, hostname):
        # global glob_bytes_sent_data, glob_bytes_received_data
        result = subprocess.check_output(
            f"ip -s -c link show {hostname} | tail -n3 -f",
            shell=True,
            stderr=subprocess.STDOUT,
        )

        data = result.decode("utf-8").strip().split("\n")
        data.pop(1)

        rx_packets_list = re.sub(" +", " ", data[0]).strip().split(" ")[:4]
        rx_bytes = int(rx_packets_list[0])
        rx_packets = int(rx_packets_list[1])
        rx_errors = int(rx_packets_list[2])
        rx_dropped = int(rx_packets_list[3])

        tx_packets_list = re.sub(" +", " ", data[1]).strip().split(" ")[:4]
        tx_bytes = int(tx_packets_list[0])
        bytes_sent = f"{int(tx_bytes / (1024*1024))} mb"
        bytes_received = f"{int(rx_bytes / (1024*1024))} mb"
        # console_logger.debug(f"{rx_dropped} -- {rx_errors} -- {rx_packets}")
        packet_loss = f"{round((rx_dropped + rx_errors) / rx_packets, 2)} %"

        # glob_bytes_sent_data = int(tx_bytes / (1024 * 1024))
        # glob_bytes_received_data = int(rx_bytes / (1024 * 1024))

        return {
            "bytes_sent": bytes_sent,
            "bytes_received": bytes_received,
            "packet_loss": packet_loss,
        }

    # def _fetchPacketloss(self,):
    #     result = subprocess.check_output(
    #         "netstat -s | grep -i drop", shell=True, stderr=subprocess.STDOUT
    #     )

    #     packdrop_list = result.decode("utf-8").strip().split("\n")
    #     total_packet_drop = packdrop_list[0].split(" ")[0].strip()

    #     return {"packet_loss": total_packet_drop}


network_manager = _NetworkManager()
