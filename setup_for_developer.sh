# !/usr/bin/bash

echo "checking internet connectivity"
if ping -q -c 1 -W 1 amazonaws.com > /dev/null; then
  echo "internet is connected"
else
  echo "please connect to internet using ethernet"
  read -n 1 -s -r -p "press any key to continue"
  exit
fi


if [ $(uname -m) == "x86_64" ]; then
  if [[ $(which docker) && $(docker --version) ]]; then
      echo "Docker present"
    else
      echo "Install docker"
      curl -fsSL https://get.docker.com -o get-docker.sh
      sudo sh get-docker.sh
      sleep 1
      sudo curl -SL https://github.com/docker/compose/releases/download/v2.6.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
      sudo chmod +x /usr/local/bin/docker-compose
      sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
      sleep 1
  fi

  if [[ $(which nvidia-smi) ]]; then
      echo "Drivers present"
    else
      echo "Drivers not present"
      read -n 1 -s -r -p "press any key to continue"
  fi
fi


echo "checking internet connectivity"
if ping -q -c 1 -W 1 amazonaws.com > /dev/null; then
  echo "internet is connected"
else
  echo "please connect to internet using ethernet"
  read -n 1 -s -r -p "press any key to continue"
  exit
fi

echo "performing pre-requisites"
gsettings set org.gnome.desktop.lockdown disable-lock-screen true
gsettings set org.gnome.desktop.screensaver lock-enabled false
gsettings set org.gnome.desktop.session idle-delay 0
sleep 1
echo "pre-requisites completed"


echo "performing system update"
sudo -S apt update 
sudo apt install -y nano netplan.io libhdf5-dev libffi-dev libssl-dev python-openssl python3-pip ntp ifmetric curl zip unzip network-manager traceroute
sleep 1
echo "system update completed"


echo "initializing system variables"
if [ -z "$1" ]
  then
    export NW_ADAPTER="$(sudo lshw -short -c network | awk '{ print $2 }' | grep -i "^[e]")"
else
    export NW_ADAPTER="$1"
fi
export IP="$(/sbin/ip -o -4 addr list ${NW_ADAPTER} | awk '{print $4}' | cut -d/ -f1)"
export IP4="$(/sbin/ip -o -4 addr list ${NW_ADAPTER} | awk '{print $4}')"
export GW4="$(/sbin/ip route | grep ${NW_ADAPTER} | grep -E 'dhcp|static' | awk '/^default/ { print $3 }')"
export NETMASK="$(/sbin/ifconfig ${NW_ADAPTER} | awk '/netmask/{ print $4;}')"
export RDXHOME=$2
export ENVFILE="${RDXHOME}/env.json"
export NETCONFIG=${RDXHOME}/interfaces
export NETWORKMANAGERCONFIG=${RDXHOME}/NetworkManager.conf
export SERVICEFILE=${RDXHOME}/host.service
sleep 1
echo "system variables initialized"


echo "starting application dirctory setup"
sudo chown -R ${USER} ${RDXHOME}/..
echo "checking ethernet connection"
if [ -z "$IP" ]; then
    echo "ethernet is not connected"
    echo "please connect to ethernet first"
    read -n 1 -s -r -p "press any key to continue"
    exit
else
    echo "ethernet connection successful"
fi


echo "checking internet connectivity"
if ping -q -c 1 -W 1 amazonaws.com > /dev/null; then
  echo "internet is connected"
else
  echo "please connect to internet using ethernet"
  read -n 1 -s -r -p "press any key to continue"
  exit
fi


echo "creating directory structure"
sudo mkdir -p ${RDXHOME}/config
sudo mkdir -p ${RDXHOME}/mounts
sudo mkdir -p ${RDXHOME}/static_server/static_image
sudo mkdir -p ${RDXHOME}/static_server/logs
sudo mkdir -p ${RDXHOME}/usecase_db/mongo/data
sudo wget https://infinityos.s3.ap-south-1.amazonaws.com/image_not_available.png -P ${RDXHOME}/static_server/static_image/
sudo wget https://infinityos.s3.ap-south-1.amazonaws.com/sampledocker.json -P ${RDXHOME}/
sudo wget https://infinityos.s3.ap-south-1.amazonaws.com/sampleswarm.toml -P ${RDXHOME}/
sudo mkdir -p ${RDXHOME}/static_server/theme
sudo wget https://infinityos.s3.ap-south-1.amazonaws.com/default.zip -P ${RDXHOME}/static_server/theme/
sudo unzip ${RDXHOME}/static_server/theme/default.zip -d ${RDXHOME}/static_server/theme/
sudo rm ${RDXHOME}/static_server/theme/default.zip
echo "directory structure created"


echo "configuring network"
cat > "$NETWORKMANAGERCONFIG" << EOF
[main]
plugins=ifupdown,keyfile

[ifupdown]
managed=true

[device]
wifi.scan-rand-mac-address=no
EOF
sudo cp ${NETWORKMANAGERCONFIG} /etc/NetworkManager/NetworkManager.conf
sleep 1


cat > "$NETCONFIG" << EOF
allow-hotplug ${NW_ADAPTER}
iface ${NW_ADAPTER} inet static
  address ${IP4}
  netmask ${NETMASK}
  gateway ${GW4}
  dns-nameserver 8.8.8.8
EOF
sudo cp ${NETCONFIG} /etc/network/interfaces
sleep 1
echo '{"HOST": "'"${IP}"'", "PORT": "80"}' > ${ENVFILE}
sleep 1
echo "network configuration successful"


echo "updating user permissions"
cat > "sudoers" << EOF
Defaults        env_reset
Defaults        mail_badpass
Defaults        secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"
root ALL=(ALL:ALL) ALL
%admin ALL=(ALL) ALL
%sudo ALL=(ALL:ALL) ALL
$USER ALL=(ALL) NOPASSWD: ALL 
EOF
sudo cp sudoers /etc/sudoers
sleep 1
( crontab -l | grep -v -F "@reboot docker -v" ; echo "@reboot docker -v" ) | crontab -
( crontab -l | grep -v -F "@reboot sudo chmod 777 /var/run/docker.sock"; echo "@reboot sudo chmod 777 /var/run/docker.sock" ) | crontab -
sleep 1
echo "user permissions updated successfully"


echo "checking internet connectivity"
if ping -q -c 1 -W 10 amazonaws.com > /dev/null; then
  echo "internet is connected"
else
  echo "please connect to internet using ethernet"
  read -n 1 -s -r -p "press any key to continue"
  exit
fi


echo "setting up databases"
sudo usermod -a -G docker $USER
if [[ -d "$RDXHOME/kong_data" ]]; then 
    echo "gateway database already present"
else
    sudo docker network create kong-net
    sleep 1
    sudo docker run -d --name kong-database \
        --network=kong-net \
        -p 5432:5432 \
        -e "POSTGRES_USER=kong" \
        -e "POSTGRES_DB=kong" \
        -e "POSTGRES_PASSWORD=kong" \
        -v ${RDXHOME}/kong_data:/var/lib/postgresql/data \
        dev.diycam.com/diycam/rdx_postgres:9.6.20-alpine
    sleep 30
    sudo docker run --rm \
        --name bootstrapper \
        --network=kong-net \
        -e "KONG_DATABASE=postgres" \
        -e "KONG_PG_HOST=kong-database" \
        -e "KONG_PG_USER=kong" \
        -e "KONG_PG_PASSWORD=kong" \
        dev.diycam.com/diycam/rdx_kong:2.2.0-alpine kong migrations bootstrap -v
    sleep 1
    sudo docker rm -f kong-database
    sleep 1
    sudo docker network rm kong-net
fi
if [[ -d "$RDXHOME/data" ]]; then 
    echo "application database already present"
else
    sleep 5
    sudo docker run -v ${RDXHOME}/data:/data/db \
        -v ${RDXHOME}/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro \
        -d --name mongo_bootstrap \
        dev.diycam.com/diycam/rdx_mongo:4.4.3
    sleep 30
    sudo docker rm -f mongo_bootstrap
fi
echo "database setup completed"


echo "checking internet connectivity"
if ping -q -c 1 -W 1 amazonaws.com > /dev/null; then
  echo "internet is connected"
else
  echo "please connect to internet using ethernet"
  read -n 1 -s -r -p "press any key to continue"
  exit
fi


echo "installing setup dependencies"
sudo pip3 install --upgrade pip
if [ $(uname -m) != "x86_64" ]; then
  sudo pip3 install docker-compose==1.24.0 &>> ${DEBUGPATH}/dependencies.debug
fi
if [ $(uname -m) == "x86_64" ]; then
  curl -s -L https://nvidia.github.io/nvidia-container-runtime/gpgkey | sudo apt-key add -
  distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
  curl -s -L https://nvidia.github.io/nvidia-container-runtime/$distribution/nvidia-container-runtime.list | sudo tee /etc/apt/sources.list.d/nvidia-container-runtime.list
  sudo apt-get update
  sudo apt-get install nvidia-container-runtime -y
  sudo docker pull multiarch/qemu-user-static:latest
  ( crontab -l | grep -v -F "@reboot docker run --rm --privileged multiarch/qemu-user-static --reset -p yes"; echo "@reboot docker run --rm --privileged multiarch/qemu-user-static --reset -p yes" ) | crontab -
fi
echo "setup dependencies installed successfully"


echo "copying files"
sudo bash -c 'cat sampledocker.json > /etc/docker/daemon.json'
sudo bash -c 'cat sampleswarm.toml > /etc/nvidia-container-runtime/config.toml'
echo "files copied successfully"


echo "checking internet connectivity"
if ping -q -c 1 -W 1 amazonaws.com > /dev/null; then
  echo "internet is connected"
else
  echo "please connect to internet using ethernet"
  read -n 1 -s -r -p "press any key to continue"
  exit
fi


echo "setting up service"
echo "this may take a while"
sudo docker swarm init --advertise-addr ${IP}
sleep 1
sudo docker compose -f ${RDXHOME}/docker-compose.yml pull
sleep 1


echo "checking internet connectivity"
if ping -q -c 1 -W 1 amazonaws.com > /dev/null; then
  echo "internet is connected"
else
  echo "please connect to internet using ethernet"
  read -n 1 -s -r -p "press any key to continue"
  exit
fi


sudo -E docker stack deploy -c ${RDXHOME}/docker-compose.yml rdx
echo "please wait for completion of system setup"
sleep 300
echo "setting up gateway"
sudo chmod +x ${RDXHOME}/setup_apigateway.sh
sleep 1
sudo sh ${RDXHOME}/setup_apigateway.sh ${IP} sleep 1
echo "gateway setup successful"
echo "service setup successful"


echo "setting up host service"
cat > "$SERVICEFILE" << EOF
[Unit]
Description=Host Service
Wants=docker.service
After=docker.service

[Service] 
User=${USER}
WorkingDirectory=${RDXHOME}/host
ExecStart=/usr/bin/python3 ${RDXHOME}/host/run.py
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF


echo "checking internet connectivity"
if ping -q -c 1 -W 1 amazonaws.com > /dev/null; then
  echo "internet is connected"
else
  echo "please connect to internet using ethernet"
  read -n 1 -s -r -p "press any key to continue"
  exit
fi


pip3 install -r ${RDXHOME}/host/requirements.txt
if [ $(uname -m) == "x86_64" ]; then
  pip3 install opencv-python==4.5.5.62
fi
sudo ln -s ${RDXHOME}/host.service /etc/systemd/system/host.service
sudo chown -R ${USER} ${RDXHOME}/../.. 
sudo systemctl enable host.service
sleep 2
sudo systemctl start host.service
echo "host service setup successful"


echo "writing assigned ip to file"
cat > "ip.txt" << EOF
${IP}
EOF
echo "ip write successful"
echo "assigned ip is ${IP}"


read -n 1 -s -r -p "press any key to continue"


echo "clearing setup"
if [ -f "host.service" ]; then
  rm "host.service"
fi
if [ -f "interfaces" ]; then 
  rm "interfaces"
fi
if [ -f "NetworkManager.conf" ]; then 
  rm "NetworkManager.conf"
fi
if [ -f "sudoers" ]; then 
  rm "sudoers"
fi
if [ -f "get-docker.sh" ]; then 
  rm "get-docker.sh"
fi
if [ -f "sampledocker.json" ]; then 
  rm "sampledocker.json"
fi
if [ -f "sampleswarm.toml" ]; then 
  rm "sampleswarm.toml"
fi