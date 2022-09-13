# RDX_OS setup guide

## pre-requisites:
1. docker
2. docker-compose
3. python 3.6


## instructions to setup rdx software for developers
- clone the repo
- install dependencies

```
sudo apt update
sudo apt install -y nano netplan.io libhdf5-dev libffi-dev libssl-dev python-openssl python3-pip ntp ifmetric curl zip unzip network-manager traceroute qrencode
```

- setup the rdx software

```
export RDXHOME=$PWD
export $(xargs < .env)
source ./setup_for_developer.sh <ethernet adapter> <directory name>
```

* adapter name = the name of the network which should be used for mac binding
* directory name = the path of the directory where software should be installed


