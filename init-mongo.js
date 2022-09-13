db = db.getSiblingDB('admin');
db.createUser({
    user: "diycam",
    pwd: "diycam123",
    roles: [
        'readWriteAnyDatabase'
    ]
});
