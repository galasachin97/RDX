#!/bin/bash
set -e

IP="$1"

curl --location --request POST 'http://localhost:8001/services' \
--form 'port="8000"' \
--form 'name="base"' \
--form 'host="base"'

curl --location --request POST 'http://localhost:8001/services' \
--form 'port="8000"' \
--form 'name="service"' \
--form 'host="service"'

curl --location --request POST 'http://localhost:8001/services' \
--form 'port="8000"' \
--form 'name="camera"' \
--form 'host="camera"'

curl --location --request POST 'http://localhost:8001/services' \
--form 'port="8000"' \
--form 'name="user_info"' \
--form 'host="user_info"'

curl --location --request POST 'http://localhost:8001/services' \
--form 'port="80"' \
--form 'name="frontend"' \
--form 'host="frontend"'

curl --location --request POST 'http://localhost:8001/services' \
--form 'port="80"' \
--form 'name="static_server"' \
--form 'host="static_server"'

curl --location --request POST 'http://localhost:8001/services' \
--form 'port="8000"' \
--form 'name="socketserver"' \
--form 'host="socketserver"'

curl --location --request POST 'http://localhost:8001/services/frontend/routes' \
--form 'paths[]="/"' \
--form 'strip_path="false"'

curl --location --request POST 'http://localhost:8001/services/base/routes' \
--form 'paths[]="/api/v1/base"' \
--form 'strip_path="false"'

curl --location --request POST 'http://localhost:8001/services/service/routes' \
--form 'paths[]="/api/v1/service"' \
--form 'strip_path="false"'

curl --location --request POST 'http://localhost:8001/services/user_info/routes' \
--form 'paths[]="/api/v1/user"' \
--form 'strip_path="false"'

curl --location --request POST 'http://localhost:8001/services/camera/routes' \
--form 'paths[]="/api/v1/camera"' \
--form 'strip_path="false"'

curl --location --request POST 'http://localhost:8001/services/static_server/routes' \
--form 'paths[]="/static_server"' \
--form 'strip_path="true"'

curl --location --request POST 'http://localhost:8001/services/socketserver/routes' \
--form 'paths[]="/socket"' \
--form 'strip_path="false"'

curl --location --request POST 'http://localhost:8001/services' \
--form 'port="8750"' \
--form 'name="host"' \
--form "host=${IP}"

curl --location --request POST 'http://localhost:8001/services/host/routes' \
--form 'paths[]="/api/v1/host"' \
--form 'strip_path="false"'

curl --location --request POST 'http://localhost:8001/services/static_server/plugins' \
--data "name=cors"  \
--data "config.origins=*" \
--data "config.methods=GET" \
--data "config.methods=POST" \
--data "config.headers=*" \
--data "config.max_age=3600" \
--data "config.preflight_continue=false"
