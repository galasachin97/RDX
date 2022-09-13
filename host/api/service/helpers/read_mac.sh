#!/bin/bash
#
# This script reads the correct MAC address of a Jetson Nano from the onboard EEPROM over i2c.
# First install i2c-tools package. Then make this script executable, and run it with sudo:
#
#     $ sudo apt-get install i2c-tools
#     $ chmod +x nano-read-mac.sh
#     $ sudo ./nano-read-mac.sh
#          MAC address is xx:xx:xx:xx:xx:xx
#
# The ‘ip’ command can then change the MAC to above, but it does not persist after rebooting.
#    
#     $ ip link set dev eth0 address xx:xx:xx:xx:xx:xx 
#
# There’s also a “macchanger” package that can be installed, has a text UI, and enables a service to 
# change the MAC persistently (but not permanently).  A patch is being developed for the permanent fix.
#
# For more info, see this forum thread:  https://devtalk.nvidia.com/default/topic/1055188/#5348990
#

# if [ `whoami` != root ]; then
# 	echo "Error -- run this script with sudo:"
# 	echo "         \"sudo $0\""
# 	exit 1
# fi


if [ $1 = 'Nano' ] 
then
    ID="2"
elif [ $1 = 'Xavier' ] 
then
    ID="0"
fi

mapfile -t mac_lines < <( i2cdump -y -r 172-177 $ID 0x50 b )

len=${#mac_lines[@]}


mac_strA=(${mac_lines[1]})
mac_strB=(${mac_lines[2]})

echo "${mac_strB[2]}:${mac_strB[1]}:${mac_strA[4]}:${mac_strA[3]}:${mac_strA[2]}:${mac_strA[1]}"
