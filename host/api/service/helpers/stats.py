from calendar import c
import psutil
from subprocess import PIPE, Popen
import platform

from api.service.helpers.logs import console_logger


def get_cpu_percent():
    return psutil.cpu_percent()


def get_ram_percent():
    return psutil.virtual_memory().percent


def get_ram_size():
    return psutil.virtual_memory().total / 10**6


def get_memory_details():
    stats = psutil.disk_usage("/")
    return {
        "storage_total": stats.total >> 30,
        "storage_used": stats.used >> 30,
        "storage_percent": stats.percent,
    }


def get_gpu_percent():
    if platform.machine() == "x86_64" or platform.machine() == "i386":
        command = "nvidia-smi --query-gpu=memory.total,memory.used --format=csv"
        process = Popen(command, stdout=PIPE, stderr=None, shell=True)
        data = process.stdout.read().decode("utf-8").split("\n")
        process.kill()
        if len(" ".join(data).split()):
            usedMemory = int(data[1].split(",")[1].replace(" ", "").split("M")[0])
            totalMemory = int(data[1].split(",")[0].replace(" ", "").split("M")[0])
            return "{}".format(round(round(usedMemory / totalMemory, 2) * 100, 2))
        else:
            return "0.0"

    else:
        command = "tegrastats | head -n 1"
        process = Popen(command, stdout=PIPE, stderr=None, shell=True)
        data = process.stdout.readline().decode("utf-8").split(" ")
        process.kill()
        return (data[data.index("GR3D_FREQ") + 1].split("%")[0]).strip("%")
