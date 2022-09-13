import json
from json.decoder import JSONDecodeError
import os

from helpers.logs import console_logger

class MetadataHandler:
    def __init__(self) -> None:
        self.metadata_file = os.path.join(os.getcwd(), "config", "metadata.json")
        self.metadata = {}
        self.room_mapping = {}

    def loadJson(self):
        try:
            with open(self.metadata_file, 'r') as f:
                self.metadata = json.loads(f.read())
        except JSONDecodeError:
            pass

    def dumpJson(self):
        with open(self.metadata_file, 'w') as f:
            f.write(json.dumps(self.metadata, indent=4))

    def convertMetadata(self, payload):
        subDictionary = {}
        new_rooms = {}
        rooms_to_restart = []

        for usecase in payload['usecases']:
            if usecase != {}:
                if payload['camera_id'] not in new_rooms:
                    new_rooms[payload['camera_id']] = []
                console_logger.debug(usecase['service_id'])
                console_logger.debug(subDictionary)
                if usecase['service_id'] not in subDictionary:
                    subDictionary.update({
                        usecase['service_id']: {
                            "scheduled": usecase['scheduled'],
                            "runtime": usecase['runtime']
                            }
                        }
                    )
                    

                for parent_id in usecase['parent_ids']:
                    if parent_id in self.metadata:
                        if payload['camera_id'] in self.metadata[parent_id]:
                            self.metadata[parent_id][payload['camera_id']]["services"] = subDictionary
                        else:
                            self.metadata[parent_id][payload['camera_id']] = {
                                "link": payload["link"],
                                "services": subDictionary
                            }
                            if parent_id not in rooms_to_restart:  
                                rooms_to_restart.append(parent_id) 
                    else:
                        self.metadata[parent_id] = {
                            payload['camera_id']: {
                                "link": payload["link"],
                                "services": subDictionary
                            }
                        } 

                    room_name = "{}_{}_{}".format(parent_id, payload['camera_id'], usecase['service_id'])
                    if room_name not in new_rooms[payload['camera_id']]:
                        new_rooms[payload['camera_id']].append(room_name)

            console_logger.debug(self.metadata)

            self.dumpJson()
        return new_rooms, rooms_to_restart

    def fetchRoomsForUsecase(self, parent_ids, usecase_id):
        data = []
        for id in parent_ids:
            if id in self.metadata:
                for camera, info in self.metadata[id].items():
                    meta = self.room_mapping[camera]
                    meta.update({"camera_id": camera})
                    data.append(meta)

        return data


metadata_handler = MetadataHandler()