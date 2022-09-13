import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import Button from "../../../../components/Button/Button";
import { BoxCard } from "../../../../components/card/Card";
import Dropdown from "../../../../components/Dropdown/Dropdown";
import SwitchBox from "../../../../components/SwitchBox/SwitchBox";
import { xMotion } from "../../../../helper/motions";
import { axiosApiInstance } from "../../../../helper/request";
import Modal from "../../../../components/Modal/Modal";
import MultiSelectDropdown from "../../../../components/MultiSelectDropdown/MultiSelectDropdown";
import PasswordVerification from "../../../../components/PasswordVerification/PasswordVerification";
import "./sound.scss";
import { encryptStorage } from "../../../../helper/storage";

let timeout = null;

export default function SoundSetting() {
  const [sound, setSound] = useState(false);
  const [isLoading, setisLoading] = useState(false);

  const [showErrorModal, setshowErrorModal] = useState({
    showPop: false,
    msg: "",
    type: "alert",
    header: "",
  });
  const resetModal = () => {
    timeout = setTimeout(() => {
      setshowErrorModal((prevState) => ({
        ...prevState,
        showPop: false,
        msg: "",
        type: "alert",
        header: "",
      }));
    }, 3000);
  };

  const getSound = () => {
    axiosApiInstance
      .get("host/notification/sound")
      .then((res) => {
        setSound(res.data.detail.notificationSound);
      })
      .catch((err) => {
        setSound(true);
      });
  };
  const postSound = () => {
    let lData = encryptStorage.getItem("UID");
    setisLoading(true);
    axiosApiInstance
      .post("host/notification/sound?status=" + sound)
      .then((res) => {
        lData.notificationSound = sound;
        encryptStorage.setItem("UID", lData);
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Details successfully updated!",
          type: "success",
          header: "Success",
        }));
        resetModal();
      })
      .catch((err) => {})
      .finally(() => {
        setisLoading(false);
      });
  };
  useEffect(() => {
    getSound();
  }, []);

  return (
    <motion.div
      variants={xMotion}
      exit="exit"
      initial="hidden"
      animate="visible"
      className="_camera_alert_setting_"
    >
      <BoxCard className="card_size">
        <SwitchBox
          label="Notification Sound"
          value={sound}
          onChange={() => {
            setSound(!sound);
          }}
        />

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
          {/* <Button
            style={{ width: "8vw" }}
            name="Default"
            // onClick={() => setShowPassContainer(true)}
            // disabled={!(!disableButton && dropdown)}
          /> */}
          <Button
            style={{ width: "8vw" }}
            onClick={postSound}
            disabled={isLoading}
            type="gradient"
            name="Save"
          />
        </div>
      </BoxCard>

      {showErrorModal.showPop && (
        <Modal
          className={"transparent_modal"}
          handleClose={() => {
            setshowErrorModal((prevState) => ({
              ...prevState,
              showPop: false,
            }));
          }}
          type={showErrorModal.type}
          errorHeader={showErrorModal.header ? showErrorModal.header : "Error"}
          errorText={showErrorModal.msg}
        />
      )}
    </motion.div>
  );
}
