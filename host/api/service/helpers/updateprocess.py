import os, subprocess, shlex, sys, datetime, math, shutil
from api.service.helpers.logs import console_logger

def backup_old_file():
    old_file = os.path.join(os.getcwd(),"..","baseservice","docker-compose.yml")
    new_file = os.path.join(os.getcwd(),"..","baseservice","docker-compose-backup-{}.yml".format(math.ceil(datetime.datetime.timestamp(datetime.datetime.utcnow()))))
    os.rename(old_file, new_file)

def copy_file_to_base():
    current_path = os.path.join(os.getcwd(),"docker-compose-new.yml")
    new_path = os.path.join(os.getcwd(),"..","baseservice","docker-compose.yml")
    shutil.move(current_path, new_path)

def pull_containers():
    try:
        # base_dir = os.path.join(os.getcwd(),"..","baseservice","docker-compose.yml")
        command = "docker-compose -f /home/diycam/RDX/baseservice/docker-compose.yml pull"
        console_logger.debug(command)
        p = subprocess.Popen(command, stdout=subprocess.PIPE, shell=True)
        (output, err) = p.communicate()
        p_status = p.wait()
        console_logger.debug(err)
        console_logger.debug(output)
        return 1
    except Exception as e:
        return 0

def update_services():
    try:
        command = "docker stack deploy -c /home/diycam/RDX/baseservice/docker-compose.yml rdx"
        p = subprocess.Popen(command, stdout=subprocess.PIPE, shell=True)
        (output, err) = p.communicate()
        p_status = p.wait()
        console_logger.debug(err)
        console_logger.debug(output)
        return 1
    except Exception as e:
        return 0
