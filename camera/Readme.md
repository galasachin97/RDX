# Service Management Service

### Initial setup
##### Uncomment the migration container service in docker-compose.yml

- Run
```
docker-compose up 
```

##### Add the service to the gateway 
- Adding the service to the gateway
```
curl --location --request POST 'http://localhost:8001/services' \
--form 'port="8000"' \
--form 'name="camera"' \
--form 'host="camera"'
```
- Adding the routes for the service to the gateway
```
curl --location --request POST 'http://localhost:8001/services/camera/routes' \
--form 'paths[]="/api/v1/camera"' \
--form 'strip_path="false"'
```

##### For swagger documentation : http://localhost:8000/api/v1/camera/docs