# Base Service

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
--form 'name="base"' \
--form 'host="base"'
```
- Adding the routes for the service to the gateway
```
curl --location --request POST 'http://localhost:8001/services/base/routes' \
--form 'paths[]="/api/v1/base"' \
--form 'strip_path="false"'
```

##### For swagger documentation : http://localhost:8000/api/v1/base/docs