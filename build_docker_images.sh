#!/bin/bash

args=$1

release=$(echo "$args" | tail -1)

cat > ".env" << EOF
release=${release}
EOF

docker run --rm --privileged multiarch/qemu-user-static --reset -p yes

env release=${release} docker buildx bake --push --set *.platform=linux/amd64,linux/arm64 --builder armbuilder -f docker-compose.yml