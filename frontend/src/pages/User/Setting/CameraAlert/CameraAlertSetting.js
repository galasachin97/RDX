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
import "./camera_alert.scss";

let timeout = null;
const NVRSchemeOption = ["Hourly", "Weekly", "Monthly"];

export default function CameraAlertSetting() {
  const priorityOptions = ["High", "Medium", "Low"];
  const [options, setOptions] = useState([]);
  const [dropdown, setDropdown] = useState(false);
  const [minute, setMinute] = useState("");
  const [disableButton, setDisableButton] = useState(false);
  const [onLoad, setOnLoad] = useState(true);
  const [serviceMapping, setServiceMapping] = useState({});
  const [globalServiceMapping, setGlobalServiceMapping] = useState({});
  const [showPassContainer, setShowPassContainer] = useState(false);
  const [password, setPassword] = useState(null);
  const [showErrorModal, setshowErrorModal] = useState({
    showPop: false,
    msg: "",
    type: "alert",
    header: "",
  });

  // nvr settings
  const [NVRHealthCheck, setNVRHealthCheck] = useState(false);
  const [NVRAutoReport, setNVRAutoReport] = useState(false);
  const [Scheme, setScheme] = useState("");
  const [AlertType, setAlertType] = useState("");

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

  const minutesOptions = [];

  for (let i = 5; i <= 60; i++) {
    minutesOptions.push(i.toString());
  }

  const onDefaultHandler = () => {
    setDropdown(false);
    setMinute("0");
    setOnLoad(false);

    let tempDict = {
      CAMV1: {
        Service_id: "CAMV1",
        Alert_priority: "",
        Alert_action: [],
        Alert_frequency: "",
      },
    };
    setServiceMapping({ ...tempDict });
  };

  const getHealthCheck = () => {
    axiosApiInstance
      .get("camera/health")
      .then((res) => {
        res.data.detail?.HealthCheck &&
          setDropdown(res.data.detail.HealthCheck);
        res.data.detail?.HealthCheckInterval &&
          setMinute(res.data.detail.HealthCheckInterval.toString());

        res.data.detail.HealthCheck && getAlertActions();
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Failed to fetch camera health settings!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

  const postHealthcheck = () => {
    let body = {
      CheckHealth: dropdown,
      CheckInterval: minute,
      GetAlert: dropdown,
    };

    axiosApiInstance
      .post("camera/health", body)
      .then((res) => {
        postAlertSettings();
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Failed to update camera health settings!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

  const postAlertSettings = () => {
    let requestList = Object.keys(serviceMapping).map((key) => {
      return serviceMapping[key];
    });

    axiosApiInstance
      .post("base/alertsettings", { Settings: requestList })
      .then((res) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Details successfully updated!",
          type: "success",
          header: "Success",
        }));
        resetModal();
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Failed to update alert settings!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

  const selectedPriority = (selectedPriorityValue) => {
    setServiceMapping((prevState) => {
      prevState["CAMV1"]["Alert_priority"] = selectedPriorityValue;
      return { ...prevState };
    });
  };

  const selectedAction = (selectedActionValues) => {
    setServiceMapping((prevState) => {
      prevState["CAMV1"]["Alert_action"] = [...selectedActionValues];
      return { ...prevState };
    });
  };

  const getAlertSettings = () => {
    axiosApiInstance
      .get("base/alertsettings")
      .then((res) => {
        let tempDict = {};
        res.data.map((setting) => {
          if (setting["Service_id"] === "CAMV1") {
            tempDict["CAMV1"] = { ...setting };
          }
        });

        if (Object.keys(tempDict).indexOf("CAMV1") === -1) {
          tempDict["CAMV1"] = {
            Service_id: "CAMV1",
            Alert_priority: "",
            Alert_action: [],
            Alert_frequency: "",
          };
        }
        setServiceMapping({ ...tempDict });
        setGlobalServiceMapping({ ...tempDict });
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Failed to fetch alert settings!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

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
          onDefaultHandler();
          setShowPassContainer(false);
        }
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Password did not matched. Try again!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

  const getAlertActions = () => {
    axiosApiInstance
      .get("base/alert/actions")
      .then((res) => {
        setOptions(res.data.detail.actions);
        getAlertSettings();
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Failed to fetch Alert actions!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

  useEffect(() => {
    getHealthCheck();
  }, []);

  return (
    <motion.div
      variants={xMotion}
      exit="exit"
      initial="hidden"
      animate="visible"
      className="_camera_alert_setting_"
    >
      <div>
        <h1 className="setting_header">Camera Alert Settings</h1>
        <BoxCard className="card_size">
          <SwitchBox
            label="Alert On Camera Health Check"
            value={dropdown}
            onChange={() => {
              setOnLoad(false);
              setDropdown(!dropdown);
              getAlertActions();
            }}
          />

          {dropdown && (
            <div className="camera_alert_wrapper">
              <Dropdown
                optionsList={minutesOptions}
                handleOption={(data) => {
                  setOnLoad(false);
                  setDisableButton(true);
                  setMinute(data);
                }}
                label="Health Check Interval (in minutes)"
                defaultText={minute}
              />
              <div className="_uc_card_">
                <p className="header">Alert Settings</p>
                <div className="_flex">
                  <Dropdown
                    optionsList={priorityOptions}
                    handleOption={(data) => {
                      selectedPriority(data);
                      setOnLoad(false);
                      setDisableButton(true);
                    }}
                    defaultText={
                      Object.keys(globalServiceMapping).length === 0
                        ? ""
                        : globalServiceMapping["CAMV1"]["Alert_priority"]
                    }
                    label="Priority"
                  />
                  <MultiSelectDropdown
                    optionsList={options}
                    label="Action"
                    id="Action"
                    defaultText={
                      Object.keys(globalServiceMapping).length === 0
                        ? []
                        : [...globalServiceMapping["CAMV1"]["Alert_action"]]
                    }
                    handleOption={(data) => {
                      selectedAction([...data]);
                      setOnLoad(false);
                      setDisableButton(true);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

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
              disabled={!(!disableButton && dropdown)}
            />
            <Button
              style={{ width: "8vw" }}
              onClick={() => postHealthcheck()}
              disabled={onLoad || !(disableButton || !dropdown)}
              type="gradient"
              name="Save"
            />
          </div>
        </BoxCard>
      </div>
      {/* <div style={{ marginLeft: "2.8645833333vw" }}>
        <h1 className="setting_header">NVR Alert Settings</h1>
        <BoxCard className="card_size">
          <SwitchBox
            label="Alert On NVR Health Check"
            value={NVRHealthCheck}
            onChange={() => {
              setNVRHealthCheck(!NVRHealthCheck);
            }}
          />

          {NVRHealthCheck && (
            <div className="camera_alert_wrapper fadeIn">
              <div className="_uc_card_">
                <SwitchBox
                  label="Generate Auto Report"
                  value={NVRAutoReport}
                  onChange={() => {
                    setNVRAutoReport(!NVRAutoReport);
                  }}
                />
                <Dropdown
                  className="adjust_dd"
                  optionsList={NVRSchemeOption}
                  handleOption={(data) => {
                    setScheme(data);
                  }}
                  defaultText={Scheme}
                  label="Select Scheme & Time"
                />
              </div>
            </div>
          )}

          {NVRHealthCheck && (
            <div className="camera_alert_wrapper fadeIn">
              <div className="_uc_card_">
                <Dropdown
                  className="adjust_dd"
                  optionsList={NVRSchemeOption}
                  handleOption={(data) => {
                    setAlertType(data);
                  }}
                  defaultText={Scheme}
                  label="Select Alert Type"
                />
                <p className="header">
                  Set Priority & platform To Receive Alert
                </p>

                <div className="_flex">
                  <Dropdown
                    optionsList={priorityOptions}
                    handleOption={(data) => {
                      selectedPriority(data);
                      setOnLoad(false);
                      setDisableButton(true);
                    }}
                    defaultText={
                      Object.keys(globalServiceMapping).length === 0
                        ? ""
                        : globalServiceMapping["CAMV1"]["Alert_priority"]
                    }
                    label="Priority"
                  />
                  <MultiSelectDropdown
                    optionsList={options}
                    label="Action"
                    id="Action"
                    defaultText={
                      Object.keys(globalServiceMapping).length === 0
                        ? []
                        : [...globalServiceMapping["CAMV1"]["Alert_action"]]
                    }
                    handleOption={(data) => {
                      selectedAction([...data]);
                      setOnLoad(false);
                      setDisableButton(true);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

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
              disabled={!(!disableButton && dropdown)}
            />
            <Button
              style={{ width: "8vw" }}
              onClick={() => postHealthcheck()}
              disabled={onLoad || !(disableButton || !dropdown)}
              type="gradient"
              name="Save"
            />
          </div>
        </BoxCard>
      </div> */}
      {showPassContainer && (
        <PasswordVerification
          close={() => setShowPassContainer(false)}
          postPassword={postPassword}
          password={password}
          setPassword={setPassword}
        />
      )}
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
