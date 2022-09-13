from flask import Flask
import time
import os
import sys
import threading
import eventlet

eventlet.monkey_patch()


from routes import update_matadata
from channels import socketio
from helpers.api_handler import api_handler
from helpers.metadata_handler import metadata_handler
from helpers.acknowledge_handler import acknowledge

debug = os.environ.get("DEBUG", True)
port = os.environ.get("PORT", 8000)


def init_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "secret"

    from routes import socket_routes

    app.register_blueprint(socket_routes)

    socketio.init_app(app, cors_allowed_origins="*")

    return app


if __name__ == "__main__":
    while api_handler.cameraInfoFetch()[1] == None:
        time.sleep(30)

    app = init_app()

    status_code, response = api_handler.cameraInfoFetch()

    try:
        if isinstance(response["data"], list):
            if not any(response["data"]):
                metadata_handler.dumpJson()
            for camera in response["data"]:
                metadata_handler.convertMetadata(camera)
                update_matadata(camera)

    except KeyError:
        sys.exit()

    api_handler.fetchHours()

    # socketio.start_background_task(
    #     acknowledge.run,
    #     socketio,
    # )
    threading.Thread(target=acknowledge.run, args=(socketio,)).start()

    socketio.run(app, host="0.0.0.0", port=port, debug=True)
