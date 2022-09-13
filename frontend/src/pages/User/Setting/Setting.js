import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar/Navbar";
import { container, item } from "../../../helper/motions";
import { AlertSetting } from "./Alert/AlertSetting";
import CameraAlertSetting from "./CameraAlert/CameraAlertSetting";
import NetworkSetting from "./Network/NetworkSetting";
import NotificationSetting from "./Notification/NotificationSetting";
import PrivacySetting from "./Privacy/PrivacySetting";
import "./setting.scss";
import "../../ServerDown/server_down.scss";
import SMTPSetting from "./SMTP/SMTPSetting";
import SystemUpdateSetting from "./SystemUpdate/SystemUpdateSetting";
import TimeSetting from "./TimeSetting/TimeSetting";
import cameraAlert from "../../../assets/images/camera_setting.png";
import alert from "../../../assets/images/alert.png";
import email from "../../../assets/images/email.png";
import storage from "../../../assets/images/storage.png";
import notification from "../../../assets/images/notification2.png";
import time_setting from "../../../assets/images/time_setting.png";
import privacy from "../../../assets/images/privacy.png";
import update from "../../../assets/images/update.png";
import network from "../../../assets/images/network2.png";
import sound from "../../../assets/images/sound.png";
import color_lens from "../../../assets/images/color_lens.png";
import SoundSetting from "./Sound/SoundSetting";
import { CircularProgressBar2 } from "../../ServerDown/Restart";
import { API_URL, axiosApiInstance, SOCKET_URL } from "../../../helper/request";
import axios from "axios";
import Modal from "../../../components/Modal/Modal";
import { encryptStorage } from "../../../helper/storage";
import Loading from "../../../components/Loading/Loading";
import AppearanceSetting, { notify } from "./Appearance/AppearanceSetting";
import Storage from "./Storage/Storage";
let msg = "";
let manu = [
  "Time Settings",
  "Network Settings",
  "Appearance Settings",
  "System Update Settings",
];
export default function Setting() {
  const [settingList, setSettingList] = useState([
    {
      name: "Time Settings",
      image: time_setting,
    },
    {
      name: "Camera Alert Settings",
      image: cameraAlert,
    },
    {
      name: "S.M.T.P Settings",
      image: email,
    },
    {
      name: "Notification Settings",
      image: notification,
    },
    {
      name: "System Update Settings",
      image: update,
    },
    {
      name: "Privacy Settings",
      image: privacy,
    },
    {
      name: "Alert Settings",
      image: alert,
    },
    {
      name: "Network Settings",
      image: network,
    },
    {
      name: "Sound Settings",
      image: sound,
    },
    {
      name: "Appearance Settings",
      image: color_lens,
    },
    {
      name: "Backup Settings",
      image: storage,
    },
  ]);
  const [activeSetting, setactiveSetting] = useState("Time Settings");
  const [UpdateData, setUpdateData] = useState({});
  const [showMsg, setshowMsg] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestarting, setisRestarting] = useState(false);
  const [UserType, setUserType] = useState(false);
  const rebootDevice = async (data) => {
    //console.log(data);
    setIsLoading(true);
    try {
      let response = await axios({
        method: "post",
        url: API_URL + "host/network/configure",
        timeout: 10000,
        data,
      });
      if (response.status === 200) {
        setIsLoading(false);
        setisRestarting(true);

        setTimeout(() => {
          encryptStorage.removeItem("UID");
          window.open("http://" + data?.Ethernets?.Ip, "_self");
        }, 90000);
      }
    } catch (error) {
      setIsLoading(false);
      if (error.code === "ECONNABORTED") {
        setisRestarting(true);
        setTimeout(() => {
          encryptStorage.removeItem("UID");

          window.open("http://" + data?.Ethernets?.Ip, "_self");
        }, 90000);
      } else {
        setisRestarting(false);
        msg = "IP address already assigned to other device!";
        setshowMsg(true);
        setTimeout(() => {
          setshowMsg(false);
          // getNetwork();
        }, 3000);
      }
    }
  };

  const rebootDevice2 = () => {
    setisRestarting(true);
    setTimeout(() => {
      window.location.reload();
    }, 90000);
  };
  const renderSetting = (param) => {
    switch (param) {
      case "Time Settings":
        return (
          <TimeSetting
            rebootDevice={() => {
              rebootDevice2();
            }}
          />
        );
      case "Camera Alert Settings":
        return <CameraAlertSetting />;
      case "S.M.T.P Settings":
        return <SMTPSetting />;
      case "Notification Settings":
        return (
          <NotificationSetting
            setactiveSetting={setactiveSetting}
            setIsLoading={setIsLoading}
            isLoading={isLoading}
          />
        );
      case "System Update Settings":
        return (
          <SystemUpdateSetting
            handleUpdate={(data) => {
              setUpdateData(data);
            }}
          />
        );
      case "Privacy Settings":
        return <PrivacySetting />;
      case "Network Settings":
        return (
          <NetworkSetting
            networkData={(data) => {
              rebootDevice(data);
            }}
            handleLoading={(data) => {
              setIsLoading(data);
            }}
          />
        );
      case "Alert Settings":
        return <AlertSetting />;
      case "Sound Settings":
        return <SoundSetting />;
      case "Appearance Settings":
        return <AppearanceSetting />;
      case "Backup Settings":
        return <Storage />;
      default:
        return "foo";
    }
  };

  useEffect(() => {
    document.title = activeSetting;
  }, [activeSetting]);

  useEffect(() => {
    let ldata = encryptStorage.getItem("UID");
    setUserType(ldata.role);
  }, []);

  const downloadTheme = () => {
    setIsLoading(true);
    axiosApiInstance
      .get("host/downloadtheme")
      .then((res) => {
        console.log(res.data);
        const link = document.createElement("a");
        link.href = SOCKET_URL + res.data.path;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notify({
          type: "success",
          msg: "ZIP file will be downloaded soon!",
        });
      })
      .catch((err) => {
        notify({
          type: "alert",
          msg: "Failed to download!",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  if (isRestarting) {
    return (
      <div className="restart">
        <p className="company">RDX</p>
        <CircularProgressBar2 style={{ position: "absolute" }} />
        <p className="shutdown">Restarting</p>
      </div>
    );
  }

  return (
    <div className="__setting_wrapper__">
      <Navbar
        isDownloadTheme={activeSetting === "Appearance Settings"}
        downloadTheme={downloadTheme}
        navName={activeSetting}
        systemUpdateData={UpdateData}
      >
        <div style={{ display: "flex" }}>
          <div className="_setting_list_">
            <div className="fixed_activity">
              {UserType && (
                <motion.ul
                  variants={container}
                  exit="exit"
                  initial="hidden"
                  animate="visible"
                >
                  {settingList.map((items) => {
                    if (UserType === "Manufacturer") {
                      if (manu.includes(items.name)) {
                        return (
                          <motion.li
                            className={
                              items.name === activeSetting && "active_stage"
                            }
                            variants={item}
                            key={items.name}
                            onClick={() => setactiveSetting(items.name)}
                          >
                            {items.image && (
                              <img src={items.image} className="_icon" />
                            )}
                            {items.name}
                          </motion.li>
                        );
                      }
                    } else {
                      if (items.name !== "Appearance Settings") {
                        return (
                          <motion.li
                            className={
                              items.name === activeSetting && "active_stage"
                            }
                            variants={item}
                            key={items.name}
                            onClick={() => setactiveSetting(items.name)}
                          >
                            {items.icon && (
                              <i className="material-icons material-icons--outlined">
                                {items.icon}
                              </i>
                            )}
                            {items.image && (
                              <img src={items.image} className="_icon" />
                            )}
                            {items.name}
                          </motion.li>
                        );
                      }
                    }
                  })}
                </motion.ul>
              )}
            </div>
          </div>

          <div className="_grid_">{renderSetting(activeSetting)}</div>
        </div>
      </Navbar>
      {isLoading && <Loading type={"transparent"} text={"Loading"} />}
      {showMsg && (
        <Modal
          handleClose={() => {
            setshowMsg(false);
          }}
          type="alert"
          errorHeader="Error"
          errorText={msg}
          className="transparent_modal"
        />
      )}
    </div>
  );
}
