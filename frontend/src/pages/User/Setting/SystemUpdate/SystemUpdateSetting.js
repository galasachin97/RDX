import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import Button from "../../../../components/Button/Button";
import { BoxCard } from "../../../../components/card/Card";
import InputBox from "../../../../components/Inputbox/InputBox";
import SwitchBox from "../../../../components/SwitchBox/SwitchBox";
import { xMotion } from "../../../../helper/motions";
import useModal from "../../../../helper/useModal";
import Modal from "../../../../components/Modal/Modal";
import { axiosApiInstance } from "../../../../helper/request";
import PasswordVerification from "../../../../components/PasswordVerification/PasswordVerification";
import { SOCKET_URL } from "../../../../helper/request";
import socketio from "socket.io-client";

import "./cameraupdate.scss";

let msg = "";
let type = "";
let socket = null;
let updateMsg = null;
export default function SystemUpdateSetting({ handleUpdate }) {
  const [time, setTime] = useState("");
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState("");
  const [availableVersion, setAvailableVersion] = useState("");
  const { modalOpen, close, open } = useModal();
  const [showPassContainer, setShowPassContainer] = useState(false);
  const [password, setPassword] = useState(null);
  const [disableUpdateButton, setDisableUpdateButton] = useState(false);

  const postPassword = () => {
    if (password === "") {
      return;
    }
    axiosApiInstance
      .post("user/verify-password", {
        Password: password,
      })
      .then((res) => {
        if (res.status === 200) {
          defaultDatahandler();
        }
      })
      .catch((err) => {
        // console.log(err.response);
      });
  };

  const defaultDatahandler = () => {
    setAutoUpdate(false);
    setTime("");
    setPassword(null);
    setShowPassContainer(false);
    getSystemUpdateInfo();
    getSystemVersionInfo();
  };

  const postSystemUpdateInfo = () => {
    axiosApiInstance
      .post("service/system/update/schedule", {
        time: time,
        auto_update: autoUpdate,
      })
      .then((res) => {
        msg = "Details successfully updated!";
        type = "success";
        open();
        setTimeout(() => {
          close();
          getSystemUpdateInfo();
          getSystemVersionInfo();
        }, 5000);
      })
      .catch((err) => {
        // console.log(err.response);
      });
  };

  const postSystemUpdate = () => {
    axiosApiInstance
      .post("service/system/update")
      .then((res) => {
        msg = "Device is being updated!";
        type = "success";
        systemUpdateStatusHandler();
        open();
        setTimeout(() => {
          close();
          getSystemUpdateInfo();
          getSystemVersionInfo();
        }, 5000);
      })
      .catch((err) => {
        // console.log(err.response);
      });
  };

  const getSystemUpdateInfo = () => {
    axiosApiInstance
      .get("service/system/update/schedule")
      .then((res) => {
        // console.log(res.data);
        setTime(res.data.detail.time);
        setAutoUpdate(res.data.detail.auto_update);
      })
      .catch((err) => {
        // console.log(err.response);
      });
  };

  const getSystemVersionInfo = () => {
    axiosApiInstance
      .get("service/system/version")
      .then((res) => {
        // console.log(res.data);
        setCurrentVersion(res.data.detail.current_version);
        setAvailableVersion(res.data.detail.available_version);
        res.data.detail.current_version ===  res.data.detail.available_version && setDisableUpdateButton(true);
      })
      .catch((err) => {
        // console.log(err.response);
      });
  };

  const toggleSwitchHandler = () => {
    !autoUpdate && setTime("");
    setAutoUpdate(!autoUpdate);
  };

  const systemUpdateStatusHandler = () => {
    updateMsg = "Your device is being updated!";
    setDisableUpdateButton(true);
    localStorage.setItem("updateButton", true);
    socket = socketio(SOCKET_URL);
    socket.on("system_update", (data) => {
      console.log(data);
      socket.close();
      setDisableUpdateButton(false);
      localStorage.setItem("updateButton", false);

      if (data["detail"]["status"] !== 'None') {
        msg = "System Update Failed!";
        type = "alert";
        close();
        handleUpdate({ open: true, msg, type });
        // open();
        // setTimeout(() => {
        //   close();
        // }, 5000);
      }
      else {
        msg = "System Updated Successfully!";
        type = "success";
        updateMsg = null;
        close();
        handleUpdate({ open: true, msg, type });
        getSystemUpdateInfo();
        getSystemVersionInfo();
        
      }
    });
  };

  useEffect(() => {
    getSystemUpdateInfo();
    getSystemVersionInfo();
    let buttonState = localStorage.getItem("updateButton");
    console.log(buttonState);
    !buttonState || buttonState === "false"
      ? setDisableUpdateButton(false)
      : setDisableUpdateButton(true);
  }, []);

  return (
    <motion.div
      variants={xMotion}
      exit="exit"
      initial="hidden"
      animate="visible"
      className="_system_update_setting_"
    >
      <BoxCard className="card_size">
        <InputBox
          id="Installed"
          header="Currently Installed Version"
          disabled
          value={currentVersion}
        />
        <InputBox
          id="Currently"
          header="Currently Available Version"
          disabled
          value={availableVersion}
        />
        <SwitchBox
          label="Automatic System Update"
          value={autoUpdate}
          onChange={toggleSwitchHandler}
        />
        {autoUpdate && (
          <div className="date_time">
            <p className="time-label">Start Date and Time</p>
            <input
              id="startDate"
              type="time"
              className="_time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        )}
        <Button
          style={{ width: "8vw" }}
          type="gradient"
          name="Update Now"
          disabled={disableUpdateButton}
          onClick={postSystemUpdate}
        />
        {disableUpdateButton && <p>{updateMsg && updateMsg}</p>}
        <div
          style={{
            position: "absolute",
            bottom: "1vw",
            left: 0,
            width: "100%",
            display: "flex",
            justifyContent: "space-evenly",
          }}
        >
          <Button
            style={{ width: "8vw" }}
            name="Default"
            onClick={() => setShowPassContainer(true)}
          />
          <Button
            style={{ width: "8vw" }}
            onClick={postSystemUpdateInfo}
            type="gradient"
            name="Save"
          />
        </div>
      </BoxCard>
      {showPassContainer && (
        <PasswordVerification
          close={() => setShowPassContainer(false)}
          postPassword={postPassword}
          password={password}
          setPassword={setPassword}
        />
      )}
      {modalOpen && (
        <Modal
          className="transparent_modal"
          handleClose={() => {
            close();
          }}
          type={type}
          errorHeader={type}
          errorText={msg}
        />
      )}
    </motion.div>
  );
}
