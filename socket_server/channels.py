from flask_socketio import SocketIO, emit, join_room, leave_room, send

from helpers.logs import console_logger
from helpers.api_handler import api_handler
from helpers.metadata_handler import metadata_handler
from helpers.acknowledge_handler import acknowledge

socketio = SocketIO()


@socketio.on('acknowledgement')
def acknowledgement(data):
    acknowledge.remove(data['id'])


@socketio.on('join')
def join(data):
    console_logger.debug(data)
    room = data['room'] if 'room' in data else None
    if room:
        join_room(room)


@socketio.on('leave')
def leave(data):
    room = data['room'] if 'room' in data else None
    if room:
        leave_room(room)


@socketio.on('rooms')
def fetchRooms(data):
    parent_ids = data["parent_ids"]
    usecase_id = data["usecase_id"]
    usecaseRooms = metadata_handler.fetchRoomsForUsecase(
        parent_ids, usecase_id)
    for camera in usecaseRooms:
        for room in camera['rooms']:
            roomIndex = room.split("_").index(camera["camera_id"])
            if "_".join(room.split("_")[roomIndex+1:]) == usecase_id:
                comm_id = acknowledge.generate_id()

                dictionary = {
                    "room": room,
                    "camera_id": camera["camera_id"],
                    "camera_name": camera["camera_name"],
                    "location": camera["location"],
                    "id": comm_id
                }

                acknowledge.add(comm_id, {
                    "channel": "join_room",
                    "room": "_".join(room.split("_")[roomIndex+1:]),
                    "message": dictionary
                })
                emit('join_room', dictionary, room=usecase_id)


@socketio.on('info')
def fetchServiceMetadata(service_id):
    console_logger.debug("info called")
    console_logger.debug(metadata_handler.metadata)
    if service_id in metadata_handler.metadata:
        comm_id = acknowledge.generate_id()
        acknowledge.add(comm_id, {
            "channel": "start",
            "room": service_id,
            "message": {"data": metadata_handler.metadata[service_id], "id": comm_id}
        })
        console_logger.debug(metadata_handler.metadata[service_id])
        socketio.emit('start', {
                      "data": metadata_handler.metadata[service_id], "id": comm_id}, room=service_id)


@socketio.on('metadata')
def handle_metadata(json):
    # console_logger.debug(json)
    # console_logger.debug(metadata_handler.metadata)
    for camera, classes_with_detections in json["data"].items():
        if json['room'] in metadata_handler.metadata:
            if camera in metadata_handler.metadata[json['room']]:
                for service, schedule in metadata_handler.metadata[json['room']][camera]["services"].items():
                    if schedule["runtime"] or schedule["scheduled"] == api_handler.current_hours:
                        # console_logger.debug("sending")
                        room = "{}_{}_{}".format(json['room'], camera, service)
                        data = {
                            'data': {camera: classes_with_detections},
                            'parent_id': json['room'],
                            'scheduled': api_handler.current_hours
                        }
                        # console_logger.debug(data)
                        # console_logger.debug(room)
                        emit('message', data, room=room)


@socketio.on('save_image')
def saveImageEvent(data):
    print(data)
    console_logger.debug(data)
    camera_id = data['camera_id']
    image_name = data['image_name']
    buffer_index = data['buffer_index']
    type = data['type']
    room = data['room']
    try:
        dictionary = {
            "camera_id": camera_id,
            "image_name": image_name,
            "buffer_index": buffer_index,
            "type": type,
            "ROIs": data['ROIs']
        }
    except KeyError:
        dictionary = {
            "camera_id": camera_id,
            "image_name": image_name,
            "buffer_index": buffer_index,
            "type": type,
            "bbox": data["bbox"]
        }
    # if 'ROIs' in data and data['ROIs'] is not None:
    #     dictionary.update({"ROIs": data['ROIs']})
    comm_id = acknowledge.generate_id()
    acknowledge.add(comm_id, {
        "channel": "image",
        "room": room,
        "message": {"data": dictionary, "id": comm_id}
    })
    socketio.emit('image', {"data": dictionary, "id": comm_id}, room=room)


@socketio.on('delete_image')
def deleteImageEvent(data):
    camera_id = data['camera_id']
    image_name = data['image_name']
    room = data['room']
    dictionary = {
        "camera_id": camera_id,
        "image_name": image_name
    }
    comm_id = acknowledge.generate_id()
    acknowledge.add(comm_id, {
        "channel": "delete",
        "room": room,
        "message": {"data": dictionary, "id": comm_id}
    })
    socketio.emit('delete', {"data": dictionary, "id": comm_id}, room=room)


@socketio.on('alert')
def saveAlertData(data):
    # data["Camera_name"] = "eee3"
    # data["Location"] = "office"
    console_logger.debug(data)
    api_handler.logAlert(data)


@socketio.on('report')
def saveReportData(data):
    dictionary = {
        "Camera_id": data.pop("camera_id"),
        "Service_id": data.pop("service_id"),
        "Data": data
    }
    api_handler.logReport(dictionary)


@socketio.on('status')
def modelStatus(data):
    status_code, response = api_handler.updateStatusService(data)
    if status_code == 200:
        socketio.emit("service_status", response["detail"])


@socketio.on('get_all_status')
def getusecasestatus():
    code, data = api_handler.getStatusService()
    socketio.emit("service_status", data)

