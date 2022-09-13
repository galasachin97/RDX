import os 
import json
import shutil

def create_config_file(ip, port):
    """
        Create and dump config file
    """
    network_config = {
        "HOST": str(ip),
        "PORT": str(port)
    }
    envFileLocation = os.path.join(os.getcwd(), "..", "env.json")

    with open("env.json", "w") as env_file:
        json.dump(network_config, env_file)
    shutil.copyfile("env.json", envFileLocation)
    return True