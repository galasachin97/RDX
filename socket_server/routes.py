import time
from flask import Blueprint, request, session
from flask_socketio import emit, close_room, rooms
import copy

from channels import socketio
from helpers.logs import console_logger
from helpers.api_handler import api_handler
from helpers.metadata_handler import metadata_handler
from helpers.acknowledge_handler import acknowledge

socket_routes = Blueprint('socket', __name__, url_prefix='/socket')


def update_matadata(data, activate_rooms=False):
    new_rooms, rooms_to_restart = metadata_handler.convertMetadata(data)

    console_logger.debug("rooms to restart: {}".format(rooms_to_restart))
    console_logger.debug("rooms to start: {}".format(new_rooms))
    for room in rooms_to_restart:
        socketio.emit('restart', room=room)

    for camera_id, rooms in new_rooms.items():
        console_logger.debug(metadata_handler.room_mapping)
        if camera_id not in metadata_handler.room_mapping:
            for room in rooms:
                if activate_rooms:
                    comm_id = acknowledge.generate_id()
                    dictionary = {
                        "room": room,
                        "camera_id": camera_id,
                        "camera_name": data["camera_name"],
                        "location": data["location"],
                        "id": comm_id
                    }

                    roomIndex = room.split("_").index(camera_id)
                    console_logger.debug(
                        "_".join(room.split("_")[roomIndex+1:]))
                    acknowledge.add(comm_id, {
                        "channel": "join_room",
                        "room": "_".join(room.split("_")[roomIndex+1:]),
                        "message": dictionary
                    })

                    socketio.emit('join_room', dictionary, room="_".join(
                        room.split("_")[roomIndex+1:]))

        else:
            room_to_be_closed = [
                item for item in metadata_handler.room_mapping[camera_id]["rooms"] if item not in rooms]
            console_logger.debug(
                "rooms to be closed: {}".format(room_to_be_closed))

            for room in room_to_be_closed:
                roomIndex = room.split("_").index(camera_id)
                if activate_rooms:
                    comm_id = acknowledge.generate_id()
                    acknowledge.add(comm_id, {
                        "channel": "leave_room",
                        "room": "_".join(room.split("_")[roomIndex+1:]),
                        "message": {"data": room, "id": comm_id}
                    })
                    socketio.emit('leave_room', {"data": room, "id": comm_id}, room="_".join(
                        room.split("_")[roomIndex+1:]))

            rooms_to_be_opened = [
                item for item in rooms if item not in metadata_handler.room_mapping[camera_id]["rooms"]]
            console_logger.debug(
                "rooms to be opened: {}".format(rooms_to_be_opened))

            for room in rooms_to_be_opened:
                roomIndex = room.split("_").index(camera_id)
                if activate_rooms:
                    comm_id = acknowledge.generate_id()
                    dictionary = {
                        "room": "_".join(room.split("_")[roomIndex+1:]),
                        "camera_id": camera_id,
                        "camera_name": data["camera_name"],
                        "location": data["location"],
                        "id": comm_id
                    }
                    acknowledge.add(comm_id, {
                        "channel": "join_room",
                        "room": "_".join(room.split("_")[roomIndex+1:]),
                        "message": dictionary
                    })
                    socketio.emit('join_room', dictionary, room="_".join(
                        room.split("_")[roomIndex+1:]))

        metadata_handler.room_mapping[camera_id] = {
            "rooms": rooms,
            "camera_name": data["camera_name"],
            "location": data["location"]
        }


@socket_routes.route("/camera", methods=["PUT"])
def updateCameraMetadata():
    """
    Whenever new camera will get added or usecase will get added, updated or removed
    this api will be called
    """
    console_logger.debug(request.json)
    update_matadata(request.json, activate_rooms=False)
    console_logger.debug(metadata_handler.room_mapping)
    return {"data": metadata_handler.metadata}


@socket_routes.route("/camera", methods=["DELETE"])
def deleteCameraMetadata():
    camera_id = request.args.get('camera_id')
    console_logger.debug(camera_id)
    for service, cameras in metadata_handler.metadata.items():
        if camera_id in cameras.keys():
            for _ in cameras[camera_id]['services'].keys():
                if camera_id in metadata_handler.room_mapping:
                    for room in metadata_handler.room_mapping[camera_id]["rooms"]:
                        console_logger.debug(room)
                        comm_id = acknowledge.generate_id()
                        acknowledge.add(comm_id, {
                            "channel": "leave_room",
                            "room": room,
                            "message": {"data": room, "id": comm_id}
                        })
                        socketio.emit(
                            'leave_room', {"data": room, "id": comm_id}, room=room)
                        metadata_handler.room_mapping[camera_id]['rooms'].remove(
                            room)
                        close_room(room, namespace='/')

            if camera_id in cameras:
                del cameras[camera_id]
                socketio.emit('restart', room=service)

    if camera_id in metadata_handler.room_mapping and not any(metadata_handler.room_mapping[camera_id]['rooms']):
        del metadata_handler.room_mapping[camera_id]

    metadata_handler.dumpJson()
    return {"data": metadata_handler.metadata}


@socket_routes.route("/service", methods=["DELETE"])
def deleteServiceData():
    parent_ids = request.args.to_dict(flat=False).get('parent_ids')
    usecase_id = request.args.get('usecase_id')
    camera_id = request.args.get('camera_id')
  
    if usecase_id is not None:
        room_mapping_clone = metadata_handler.room_mapping[camera_id]
        temp_list = copy.deepcopy(room_mapping_clone["rooms"])

        for room in room_mapping_clone["rooms"]:
            roomIndex = room.split("_").index(camera_id)

            if "_".join(room.split("_")[roomIndex+1:]) == usecase_id:
                temp_list.remove(room)
                comm_id = acknowledge.generate_id()
                acknowledge.add(comm_id, {
                    "channel": "leave_room",
                    "room": room,
                    "message": {"data": room, "id": comm_id}
                })
                socketio.emit(
                    'leave_room', {"data": room, "id": comm_id}, room=room)

        metadata_handler.room_mapping[camera_id]["rooms"] = temp_list
        comm_id = acknowledge.generate_id()
        acknowledge.add(comm_id, {
            "channel": "stop",
            "room": usecase_id,
            "message": {"data": usecase_id, "id": comm_id}
        })
        socketio.emit('stop', {"data": usecase_id,
                      "id": comm_id}, room=usecase_id)
        close_room(usecase_id, namespace='/')
        console_logger.debug(usecase_id)
    metadata_handler.dumpJson()
    console_logger.debug(metadata_handler.metadata)
    console_logger.debug(metadata_handler.room_mapping)
    return "Success"


@socket_routes.route("/rooms")
def returnRoomNamesToBeJoined():
    parent_ids = request.json["parent_ids"]
    usecase_id = request.json["usecase_id"]
    rooms = metadata_handler.fetchRoomsForUsecase(parent_ids, usecase_id)
    console_logger.debug(rooms)
    return {"data": rooms}


@socket_routes.route('/start', methods=['POST'])
def start_demo_inference():
    service_id = request.json['service_id']
    comm_id = acknowledge.generate_id()
    acknowledge.add(comm_id, {
        "channel": "start",
        "room": service_id,
        "message": {"data": metadata_handler.metadata[service_id], "id": comm_id}
    })
    socketio.emit('start', {
                  "data": metadata_handler.metadata[service_id], "id": comm_id}, room=service_id)
    return "Success"


@socket_routes.route('/stop', methods=['POST'])
def disconnect_service():
    service_id = request.json['service_id']
    comm_id = acknowledge.generate_id()
    acknowledge.add(comm_id, {
        "channel": "stop",
        "room": service_id,
        "message": {"data": service_id, "id": comm_id}
    })
    socketio.emit('stop', {"data": service_id, "id": comm_id}, room=service_id)
    return "Success"


@socket_routes.route('/scheduler', methods=['POST'])
def updateSchedulerForUsecase():
    data = request.json['current_hours']
    api_handler.current_hours = True if data == 'ScheduledHours' else False
    console_logger.debug("Hours changed to : {}".format(data))
    return "Success"


@socket_routes.route('/metadata', methods=['POST'])
def send_metadata():
    json = request.json
    for camera, classes_with_detections in json["data"].items():
        if json['room'] in metadata_handler.metadata:
            if camera in metadata_handler.metadata[json['room']]:
                for service, schedule in metadata_handler.metadata[json['room']][camera]["services"].items():
                    if not schedule["runtime"] and schedule["scheduled"] != api_handler.current_hours:
                        break
                    room = "{}_{}_{}".format(json['room'], camera, service)
                    data = {
                        'data': {camera: classes_with_detections},
                        'parent_id': json['room'],
                        'scheduled': api_handler.current_hours
                    }
                    emit('message', data, room=room)


@socket_routes.route('/save_image', methods=['POST'])
def save_image():
    console_logger.debug(request.json)
    camera_id = request.json['camera_id']
    image_name = request.json['image_name']
    buffer_index = request.json['buffer_index']
    type = request.json['type']
    room = request.json['room']
    dictionary = {
        "camera_id": camera_id,
        "image_name": image_name,
        "buffer_index": buffer_index,
        "type": type,
        "ROIs": request.json['ROIs']
    }

    if "bbox" in request.json:
        dictionary.update({"ROIs": request.json["bbox"]})
    comm_id = acknowledge.generate_id()
    acknowledge.add(comm_id, {
        "channel": "image",
        "room": room,
        "message": {"data": dictionary, "id": comm_id}
    })
    socketio.emit('image', {"data": dictionary, "id": comm_id}, room=room)
    # camera_id = request.json['camera_id']
    # image_name = request.json['image_name']
    # buffer_index = request.json['buffer_index']
    # room = request.json['room']
    # dictionary = {
    #     "camera_id": camera_id,
    #     "image_name": image_name,
    #     "buffer_index": buffer_index
    # }

    # if "bbox" in request.json:
    #     dictionary.update({"bbox": request.json["bbox"]})
    # comm_id = acknowledge.generate_id()
    # acknowledge.add(comm_id, {
    #     "channel": "stop",
    #     "room": room,
    #     "message": {"data": dictionary, "id": comm_id}
    # })
    # socketio.emit('image', {"data": dictionary, "id": comm_id}, room=room)
    return "Success"


@socket_routes.route('/parameters', methods=['POST'])
def pass_parameters():
    camera_id = request.json['CameraID']
    service_id = request.json['ServiceID']
    settings = request.json['UseCaseSettings']
    console_logger.debug(settings)

    params = copy.deepcopy(settings)
    params.update({"camera_id": camera_id, "service_id": service_id})

    if camera_id in metadata_handler.room_mapping:
        for room in metadata_handler.room_mapping[camera_id]["rooms"]:
            roomIndex = room.split("_").index(camera_id)
            if "_".join(room.split("_")[roomIndex+1:]) == service_id:
                comm_id = acknowledge.generate_id()
                acknowledge.add(comm_id, {
                    "channel": "params",
                    "room": room,
                    "message": {"data": params, "id": comm_id}
                })
                socketio.emit(
                    'params', {"data": params, "id": comm_id}, room=room)

    return "Success"


@socket_routes.route('/acknowledgement')
def get_pending_acknowledgement():
    return acknowledge.cache


@socket_routes.route('/acknowledgement', methods=['DELETE'])
def clear_acknowledgement():
    acknowledge.cache = {}
    return acknowledge.cache


@socket_routes.route('/stats', methods=['POST'])
def device_stats():
    socketio.emit('device_stats', request.json)
    return "success"


@socket_routes.route('/download/event', methods=['POST'])
def download_event():
    console_logger.debug(request.json)
    socketio.emit('download_complete', request.json)
    return "success"


@socket_routes.route('/system/update', methods=['POST'])
def system_update_event():
    socketio.emit('system_update', request.json)
    return "success"

@socket_routes.route('/service/download', methods=['POST'])
def service_download_event():
    time.sleep(2)
    console_logger.debug(request.json)
    socketio.emit('service_download', request.json)
    return "success"

@socket_routes.route('/service/uninstall', methods=['POST'])
def service_uninstall_event():
    console_logger.debug(request.json)
    time.sleep(1)
    socketio.emit('service_uninstall', request.json)
    return "success"
    
@socket_routes.route('/service/update', methods=['POST'])
def service_update_event():
    socketio.emit('service_update', request.json)
    return "success"


@socket_routes.route('/notification', methods=['POST'])
def notify_event():
    socketio.emit('notification', request.json)
    return "success"

@socket_routes.route('/service/status', methods=['POST'])
def service_status_event():
    socketio.emit('service_status', request.json["detail"])
    return "success"

@socket_routes.route('/metadata/details')
def fetch_metadata_details():
    console_logger.debug(metadata_handler.metadata)
    console_logger.debug(metadata_handler.room_mapping)
    return "success"

@socket_routes.route('/downloadlogs', methods=['POST'])
def fetch_device_logs():
    console_logger.debug(request.json["detail"])
    socketio.emit('device_logs', request.json["detail"])
    return "success"

@socket_routes.route('/addzip', methods=['POST'])
def create_zip_inside_serviceidfolder():
    console_logger.debug(request.json["detail"])
    socketio.emit('unzip_process', request.json["detail"])
    return "success"

@socket_routes.route('/defaultzip', methods=['POST'])
def unzip_inside_serviceidfolder():
    console_logger.debug(request.json["detail"])
    socketio.emit('unzip_process', request.json["detail"])
    return "success"

@socket_routes.route('/networkspeed', methods=['POST'])
def networkspeed():
    console_logger.debug(request.json["detail"])
    socketio.emit('speed_test', request.json["detail"])
    return "success"

@socket_routes.route('/networkstats', methods=['POST'])
def networkstats():
    console_logger.debug(request.json["detail"])
    socketio.emit('network_statistics', request.json["detail"])
    return "success"

@socket_routes.route('/downloadall', methods=['POST'])
def downloadall():
    console_logger.debug(request.json["detail"])
    socketio.emit('downloadall', request.json["detail"])
    return "success"

@socket_routes.route('/updateall', methods=['POST'])
def updateall():
    console_logger.debug(request.json["detail"])
    socketio.emit('updateall', request.json["detail"])
    return "success"

@socket_routes.route('/restart', methods=['POST'])
def restartService():
    console_logger.debug(request.json["detail"])
    comm_id = acknowledge.generate_id()
    acknowledge.add(comm_id, {
        "channel": "restart",
        "room": request.json["detail"]["data"],
        "message": {"data": request.json["detail"], "id": comm_id}
    })
    socketio.emit('restart', {"data": request.json["detail"], "id": comm_id}, room=request.json["detail"]["data"])
    return "success"

@socket_routes.route('/fifo', methods=['POST'])
def fifo():
    console_logger.debug(request.json["detail"])
    socketio.emit('fifo', request.json["detail"])
    return "success"



##### sachin

@socket_routes.route('/getcountavg', methods=['POST'])
def get_count_avg():
    console_logger.debug(request.json["detail"])
    socketio.emit('get_count_avg', request.json["detail"])
    return "success"

@socket_routes.route('/alertscount', methods=['POST'])
def alerts_count():
    console_logger.debug(request.json["detail"])
    socketio.emit('alerts_count', request.json["detail"])
    return "success"

@socket_routes.route('/reportsdownload', methods=['POST'])
def reports_download():
    console_logger.debug(request.json["detail"])
    socketio.emit('reports_download', request.json["detail"])
    return "success"
