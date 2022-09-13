import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import Button from "../../../../components/Button/Button";
import Navbar from "../../../../components/Navbar/Navbar";
import { container, item } from "../../../../helper/motions";
import { axiosApiInstance } from "../../../../helper/request";
import AppScheduler from "../AppScheduler/AppScheduler";
import CameraDetail from "../CameraDetail/CameraDetail";
import "./addcamera.scss";
let currentScreen = "Camera Details";
export default function AddCamera() {
  const [settingList, setSettingList] = useState([
    "Camera Details",
    "App Scheduler",
    "App Configuration",
  ]);
  const [updateAppLoading, setUpdateAppLoading] = useState(false);
  const [activeSetting, setactiveSetting] = useState("Camera Details");
  window.onbeforeunload = function (e) {
    if (activeSetting === "App Scheduler") {
      e.preventDefault();
      e.returnValue = "";
      return "Data will be lost if you leave the page, are you sure?";
    }
  };
  useEffect(() => {
    //to disable back button
    // window.history.pushState(null, "", window.location.href);
    // window.onpopstate = function () {
    //   window.history.pushState(null, "", window.location.href);
    // };

    //to disable refresh events (F5, ctrl + shift + R, ctrl + R)

    document.onkeydown = function (event) {
      if (event.keyCode == 116) {
        event.preventDefault();
        return false;
      }
    };
  }, []);
  let _addAppHandleSubmit = null;

  let _configAppHandleBack;
  let _configAppHandleSubmit;

  const updateAppHandleBack = () => {
    console.log(
      _addAppHandleSubmit,
      _configAppHandleBack,
      _configAppHandleSubmit
    );
    if (!_addAppHandleSubmit && !_configAppHandleBack) {
      axiosApiInstance.get("camera/finish_configure").then((res) => {
        window.location.href = "/camera";
      });
      return;
    }
    _configAppHandleBack();
  };
  const updateAppHandleSubmit = () => {
    if (currentScreen === "Configuration") {
      _configAppHandleSubmit();
    } else {
      _addAppHandleSubmit();
    }
  };

  const renderSetting = (param) => {
    switch (param) {
      case "Camera Details":
        return <CameraDetail handleHistory={setactiveSetting} />;
      case "App Scheduler":
        return (
          <AppScheduler
            handleHistory={setactiveSetting}
            handleLoading={(res) => {
              setUpdateAppLoading(res);
            }}
            ActiveTab={(res) => (currentScreen = res)}
            handleSubmit={(res) => (_addAppHandleSubmit = res)}
            handleConfigBack={(res) => (_configAppHandleBack = res)}
            handleConfigSubmit={(res) => (_configAppHandleSubmit = res)}
            handleConfigLoading={(res) => {
              setUpdateAppLoading(res);
            }}
          />
        );
      // case "App Configuration":
      //   return <AppConfiguration handleHistory={setactiveSetting} />;
      default:
        return <CameraDetail />;
    }
  };
  return (
    <div className="__add_camera_wrapper__">
      <Navbar
        disableNav={activeSetting === "App Scheduler"}
        navName="Add camera Manually"
      >
        <div style={{ display: "flex" }}>
          <div className="_setting_list_">
            <div className="fixed_activity">
              <motion.ul
                variants={container}
                exit="exit"
                initial="hidden"
                animate="visible"
              >
                {settingList.map((items) => (
                  <motion.li
                    className={items === activeSetting && "active_stage"}
                    variants={item}
                    key={items}
                    // onClick={() => setactiveSetting(items)}
                    id={items.replace(/ /g, "_")}
                  >
                    {items}
                  </motion.li>
                ))}
              </motion.ul>
              {activeSetting !== "Camera Details" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-evenly",
                    marginTop: "3vw",
                  }}
                >
                  {activeSetting !== "App Scheduler" && (
                    <Button
                      style={{ width: "6vw" }}
                      onClick={updateAppHandleBack}
                      disabled={updateAppLoading}
                      name="Back"
                    />
                  )}
                  <Button
                    style={{ width: "6vw" }}
                    onClick={updateAppHandleSubmit}
                    disabled={updateAppLoading}
                    type="gradient"
                    name="Submit"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="_grid_">{renderSetting(activeSetting)}</div>
        </div>
      </Navbar>
    </div>
  );
}
