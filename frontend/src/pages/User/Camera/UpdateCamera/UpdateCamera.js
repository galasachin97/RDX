import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import Button from "../../../../components/Button/Button";
import Navbar from "../../../../components/Navbar/Navbar";
import { container, item } from "../../../../helper/motions";
import { axiosApiInstance } from "../../../../helper/request";
import AppConfiguration from "../AppConfiguration/AppConfiguration";
import UpdateAppScheduler from "./UpdateAppScheduler";
import "./updatecamera.scss";
let currentScreen = "scheduler";
export default function AddCamera() {
  const [settingList, setSettingList] = useState([
    "App Scheduler",
    "App Configuration",
  ]);
  const [activeSetting, setactiveSetting] = useState("App Scheduler");
  const [updateAppLoading, setUpdateAppLoading] = useState(false);
  let history = useHistory();
  useEffect(() => {
    //to disable back button
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = function () {
      window.history.pushState(null, "", window.location.href);
    };

    //to disable refresh events (F5, ctrl + shift + R, ctrl + R)

    document.onkeydown = function (event) {
      if (event.keyCode == 116) {
        event.preventDefault();

        return false;
      }
    };
  }, []);
  let _updateAppHandleBack = null;
  let _updateAppHandleSubmit = null;

  let _configAppHandleBack;
  let _configAppHandleSubmit;

  const updateAppHandleBack = () => {
    if (!_updateAppHandleBack && !_configAppHandleBack) {
      axiosApiInstance.get("camera/finish_configure").then((res) => {
        window.location.href = "/camera";
      });
      return;
    }
    if (currentScreen === "Configuration") {
      _configAppHandleBack();
    } else {
      _updateAppHandleBack();
    }
  };
  const updateAppHandleSubmit = () => {
    if (currentScreen === "Configuration") {
      _configAppHandleSubmit();
    } else {
      _updateAppHandleSubmit();
    }
  };

  const renderSetting = (param) => {
    switch (param) {
      case "App Scheduler":
        return (
          <UpdateAppScheduler
            history={history}
            handleHistory={setactiveSetting}
            handleBack={(res) => (_updateAppHandleBack = res)}
            handleSubmit={(res) => (_updateAppHandleSubmit = res)}
            handleLoading={(res) => {
              setUpdateAppLoading(res);
            }}
            //
            handleConfigBack={(res) => (_configAppHandleBack = res)}
            handleConfigSubmit={(res) => (_configAppHandleSubmit = res)}
            handleConfigLoading={(res) => {
              setUpdateAppLoading(res);
            }}
            ActiveTab={(res) => (currentScreen = res)}
          />
        );
      case "App Configuration":
        return <AppConfiguration handleHistory={setactiveSetting} />;
      default:
        return <UpdateAppScheduler handleHistory={setactiveSetting} />;
    }
  };
  return (
    <div className="__update_camera_wrapper__">
      <Navbar disableNav navName="Update Camera">
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
                    id={items.replace(/ /g, "_")}
                    // onClick={() => setactiveSetting(items)}
                  >
                    {items}
                  </motion.li>
                ))}
              </motion.ul>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-evenly",
                  marginTop: "3vw",
                }}
              >
                <Button
                  style={{ width: "6vw" }}
                  onClick={updateAppHandleBack}
                  disabled={updateAppLoading}
                  name="Back"
                />
                <Button
                  style={{ width: "6vw" }}
                  onClick={updateAppHandleSubmit}
                  disabled={updateAppLoading}
                  type="gradient"
                  name="Submit"
                />
              </div>
            </div>
          </div>

          <div className="_grid_">{renderSetting(activeSetting)}</div>
        </div>
      </Navbar>
    </div>
  );
}
