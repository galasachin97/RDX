import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import Button from "../../../components/Button/Button";
import { BoxCard } from "../../../components/card/Card";
import InputBox from "../../../components/Inputbox/InputBox";
import Navbar from "../../../components/Navbar/Navbar";
import { container, item, xMotion } from "../../../helper/motions";
import { axiosApiInstance, SOCKET_URL } from "../../../helper/request";
import { CSVLink } from "react-csv";
import "./deviceinfo.scss";
import { encryptStorage } from "../../../helper/storage";
import socketio from "socket.io-client";
import Modal from "../../../components/Modal/Modal";
import Loading from "../../../components/Loading/Loading";
import CopyToClipboard from "react-copy-to-clipboard";
import { CircularProgressBar2 } from "../../ServerDown/Restart";
import { useHistory } from "react-router-dom";
let timeout = null;
let time = 180;
let otpVal = 0;
let _stop = false;
let maxDate = null;
let minDate = null;
let socket = null;
export default function DeviceInfo() {
  let history = useHistory();

  const [deviceList, setDeviceList] = useState(["Diycam"]);
  const [activeDevice, setActiveDevice] = useState("Diycam");
  const [DeviceData, setDeviceData] = useState([]);
  const [csvData, setcsvData] = useState([]);
  const [role, setRole] = useState([]);
  const [isLoadingScreen, setIsLoadingScreen] = useState(false);
  const [showOTPContainer, setshowOTPContainer] = useState(false);
  const [otp1, setOtp1] = useState("");
  const [otp2, setOtp2] = useState("");
  const [otp3, setOtp3] = useState("");
  const [otp4, setOtp4] = useState("");
  const [otp5, setOtp5] = useState("");
  const [otp6, setOtp6] = useState("");
  const [attempts, setAttempts] = useState(2);
  const [counter, setCounter] = useState(0);
  const [isConfirm, setIsConfirm] = useState(false);
  const [isOTPConfirm, setIsOTPConfirm] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [startDate, setstartDate] = useState("");
  const [endtDate, setendtDate] = useState("");
  const [Limit, setLimit] = useState(10);
  const [isRestarting, setisRestarting] = useState(false);

  const [showErrorModal, setshowErrorModal] = useState({
    showPop: false,
    msg: "",
    type: "alert",
    header: "Error",
  });
  const minmax = (value, min, max) => {
    if (parseInt(value) > max) return max;
    else if (!value) return "0";
    else return parseInt(value);
  };
  const setIntialTime = () => {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yy = today.getFullYear();
    var hrs = today.getHours();
    var mnt = today.getMinutes();
    if (today.getMinutes() < 10) {
      mnt = "0" + today.getMinutes();
    }
    if (hrs === 0) {
      hrs = "00";
    }

    setstartDate(yy + "-" + mm + "-" + dd + "T" + "00:00");
    setendtDate(yy + "-" + mm + "-" + dd + "T" + hrs + ":" + mnt);
    maxDate = yy + "-" + mm + "-" + dd + "T" + "00:00";

    let last30days = new Date(today.setDate(today.getDate() - 30));
    var dd = String(last30days.getDate()).padStart(2, "0");
    var mm = String(last30days.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yy = last30days.getFullYear();
    var hrs = last30days.getHours();
    var mnt = last30days.getMinutes();
    if (last30days.getMinutes() < 10) {
      mnt = "0" + last30days.getMinutes();
    }
    minDate = yy + "-" + mm + "-" + dd + "T" + "00:00";
  };

  useEffect(() => {
    let eData = encryptStorage.getItem("UID");
    setRole(eData.role);
    setIsLoadingScreen(true);
    axiosApiInstance
      .get("base/device")
      .then((data) => {
        setDeviceData(data.data);
      })
      .finally(() => setIsLoadingScreen(false));
  }, []);

  const getCodeBoxElement = (index) => {
    return document.getElementById("otp" + index);
  };

  const handleCounter = (type, value) => {
    if (type === "add") {
      setLimit(Number(Limit) + 1);
    } else if (type === "sub") {
      if (Limit != 0) {
        setLimit(Number(Limit) - 1);
      }
    } else {
      if (isNaN(value)) {
        return;
      }
      const onlyNums = value.replace(/[^0-9]/g, "");
      let res = minmax(onlyNums, "0", "9999");
      setLimit(res);
    }
  };

  const onFocusEvent = (index) => {
    for (let item = 1; item < index; item++) {
      const currentElement = getCodeBoxElement(item);
      if (!currentElement.value) {
        currentElement.focus();
        break;
      }
    }
  };
  const inputfocus = (index, event) => {
    if (event.ctrlKey && event.keyCode === 86) {
      getCodeBoxElement(6).focus();
    } else {
      const eventCode = event.which || event.keyCode;
      if (getCodeBoxElement(index).value.length === 1) {
        if (index !== 6) {
          getCodeBoxElement(index + 1).focus();
        } else {
          // getCodeBoxElement(index).blur();
          // Submit code
          //console.log("submit code ");
        }
      }
      if (eventCode === 8 && index !== 1) {
        getCodeBoxElement(index - 1).focus();
      }
    }
  };

  const isNumeric = (n) => {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };

  const handlePaste = (e) => {
    let pastedData = e.clipboardData.getData("text/plain").trim();
    if (isNumeric(pastedData)) {
      pastedData = pastedData.split("");
      if (pastedData.length === 6) {
        setOtp1(pastedData[0]);
        setOtp2(pastedData[1]);
        setOtp3(pastedData[2]);
        setOtp4(pastedData[3]);
        setOtp5(pastedData[4]);
        setOtp6(pastedData[5]);
        getCodeBoxElement(6).focus();
      } else {
        setOtp1("");
      }
    } else {
      setOtp1("");
    }
  };
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

  const getCurrentUserDetails = () => {
    setIsLoadingScreen(true);
    axiosApiInstance
      .get("user")
      .then((res) => {
        if (res.data.Email) {
          otpVal = Math.floor(Math.random() * 899999 + 100000);
          encryptStorage.removeItem("VID");
          postOTP(res.data.Username, res.data.Email, otpVal);
        } else {
          setIsLoadingScreen(false);
          setIsConfirm(true);
        }
      })
      .catch((err) => {
        setIsLoadingScreen(false);
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Failed to fetch Current user detail!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
        //console.log(err.response);
      });
  };

  const postOTP = (username, email, otpVal) => {
    axiosApiInstance
      .post("user/otp", {
        username: username,
        destination: email,
        otp: otpVal.toString(),
        interval: "3",
      })
      .then((res) => {
        encryptStorage.setItem("VID", {
          attempts: 2,
          otp: otpVal,
          counter: time,
          destination: email,
          username: username,
        });
        setshowOTPContainer(true);
        //console.log(res.data);
        _stop = false;
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "OTP limit exhausted, Please try again later!",
          type: "alert",
          header: "Error",
        }));
        resetModal();

        //console.log(err.response);
      })
      .finally(() => {
        setIsLoadingScreen(false);
      });
  };

  const postResendOTP = () => {
    let _lData = encryptStorage.getItem("VID");
    if (attempts === 0) {
      encryptStorage.removeItem("VID");
      setshowErrorModal((prevState) => ({
        ...prevState,
        showPop: true,
        msg: "No More attempts left Please try later!",
        type: "alert",
        header: "Error",
      }));
      resetModal();

      return;
    }
    otpVal = Math.floor(Math.random() * 899999 + 100000);
    //console.log(_lData);
    axiosApiInstance
      .post("user/otp", {
        destination: _lData?.destination,
        username: _lData?.username,
        otp: otpVal.toString(),
        interval: "3",
      })
      .then((res) => {
        setAttempts(attempts - 1);
        setCounter(time);
        //console.log(otpVal);
        _lData.otp = otpVal;
        _lData.attempts = attempts - 1;
        encryptStorage.setItem("VID", _lData);
      })
      .catch((err) => {
        if (err.response.status === 406) {
          // setShowPop(true);
        } else {
          setshowErrorModal((prevState) => ({
            ...prevState,
            showPop: true,
            msg: "OTP limit exhausted, Please try again later!",
            type: "alert",
            header: "Error",
          }));
          resetModal();
        }
        //console.log(err.response);
      });
  };

  const postInputOTP = () => {
    let _otp = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;
    if (
      otp1 === "" ||
      otp2 === "" ||
      otp3 === "" ||
      otp4 === "" ||
      otp5 === "" ||
      otp6 === ""
    ) {
      return;
    }
    //console.log(_otp, otpVal);
    if (_otp === otpVal.toString()) {
      _stop = true;
      clearTimeout(timeout);
      setOtp1("");
      setOtp2("");
      setOtp3("");
      setOtp4("");
      setOtp5("");
      setOtp6("");
      setIsConfirm(true);
      setshowOTPContainer(false);
      // encryptStorage.removeItem("VID");
      // postReset();
    } else {
      _stop = false;
      setshowErrorModal((prevState) => ({
        ...prevState,
        showPop: true,
        msg: "Invalid OTP, Please try again!",
        type: "alert",
        header: "Error",
      }));
      resetModal();
    }
  };
  const getcsvData = () => {
    axiosApiInstance.get("host/devicelogs").then((data) => {
      setcsvData(data.data);
    });
  };

  const postReset = () => {
    setIsLoadingScreen(true);
    axiosApiInstance
      .post("base/reset/settings", {})
      .then((res) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Your device has been reset. Rebooting now!",
          type: "success",
          header: "Success",
        }));
        resetModal();
        setTimeout(() => {
          setisRestarting(true);
          setTimeout(() => {
            encryptStorage.removeItem("UID");
            history.push("/");
          }, 90000);
        }, 5000);
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Failed to reset your device!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      })
      .finally(() => {
        setshowOTPContainer(false);
        setIsLoadingScreen(false);
      });
  };

  const headers = [
    { label: "Event", key: "Event" },
    { label: "Type", key: "Type" },
    { label: "Description", key: "Description" },
    { label: "Date", key: "Date" },
    { label: "Time", key: "Time" },
  ];
  const postFilter = () => {
    let since_utc = Date.parse(new Date(startDate).toUTCString());
    let until_utc = Date.parse(new Date(endtDate).toUTCString());
    setIsLoadingScreen(true);
    axiosApiInstance
      .get(
        "service/logs?since=" +
          since_utc / 1000 +
          "&until=" +
          until_utc / 1000 +
          "&tail=" +
          Limit
      )
      .then((res) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Your file will be downloaded automatically!",
          type: "success",
          header: "Success",
        }));
        resetModal();
        socket = socketio(SOCKET_URL);
        socket.on("device_logs", (data) => {
          clearTimeout(timeout);
          setshowErrorModal((prevState) => ({
            ...prevState,
            showPop: false,
          }));
          setIsFilterOpen(false);
          const link = document.createElement("a");
          link.href = SOCKET_URL + data;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setshowErrorModal((prevState) => ({
            ...prevState,
            showPop: true,
            msg: "Device Logs downloaded successfully!",
            type: "success",
            header: "Success",
          }));
          resetModal();
          socket.close();
        });
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Something went wrong!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      })
      .finally(() => {
        setIsLoadingScreen(false);
        setIsFilterOpen(false);
      });
  };
  useEffect(() => {
    if (!_stop) {
      counter > 0 &&
        setTimeout(() => {
          let _lData = encryptStorage.getItem("VID");
          if (!_lData) {
            // history.push("/auth/type");
          }
          //console.log(_lData);
          if (_lData) {
            _lData.counter = counter - 1;
          }
          if (_lData) {
            encryptStorage.setItem("VID", _lData);
          }
          setCounter(counter - 1);
        }, 1000);

      if (attempts === 0 && counter === 0) {
        _stop = true;
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "OTP limit exhausted, Please try again later!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
        setTimeout(() => {
          encryptStorage.removeItem("VID");
          //reset the state
        }, 5000);
      }
    }
    if (counter === 0) {
      setOtp1("");
      setOtp2("");
      setOtp3("");
      setOtp4("");
      setOtp5("");
      setOtp6("");
    }
  }, [counter]);

  useEffect(() => {
    if (showOTPContainer) {
      let lData = encryptStorage.getItem("VID");
      if (lData) {
        otpVal = lData.otp;
        if (lData.counter > 1 && attempts >= 0) {
          setCounter(lData.counter - 1);
          setAttempts(lData.attempts);
          otpVal = lData.otp;
        } else if (lData.attempts === 0 && lData.counter === 0) {
          setshowErrorModal((prevState) => ({
            ...prevState,
            showPop: true,
            msg: "OTP limit exhausted, Please try again later!",
            type: "alert",
            header: "Error",
          }));
          resetModal();
          // open();
          setTimeout(() => {
            // close();
            encryptStorage.removeItem("VID");
            // history.replace("/auth/register");
          }, 3000);
          // alert("All Attempts done");

          setCounter(0);
          return;
        } else if (lData.counter === 0 && attempts !== 0) {
          //console.log("lData.counter === 0 && attempts !== 0");
          setCounter(0);
          lData.counter = 0;
          otpVal = lData.otp;
        }
        encryptStorage.setItem("VID", lData);
      }
    }
  }, [showOTPContainer]);

  useEffect(() => {
    let _lData__2 = encryptStorage.getItem("VID");
    if (_lData__2) {
      if (_lData__2.attempts >= 0) {
        if (_lData__2.counter === 0) {
          setCounter(0);
        } else {
          setCounter(_lData__2.counter);
        }
        setshowOTPContainer(true);
        setAttempts(_lData__2.attempts);
      }
    }
  }, []);

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
    <div className="__device_info_wrapper__">
      <Navbar navName="Device Info">
        <div style={{ display: "flex" }}>
          <div className="_setting_list_">
            <div className="fixed_activity">
              <motion.ul
                variants={container}
                exit="exit"
                initial="hidden"
                animate="visible"
              >
                {deviceList.map((items) => (
                  <motion.li
                    className={items === activeDevice && "active_stage"}
                    variants={item}
                    key={items}
                    onClick={() => setActiveDevice(items)}
                  >
                    {items}
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </div>

          <div className="_grid_">
            <motion.div
              variants={xMotion}
              exit="exit"
              initial="hidden"
              animate="visible"
              className="_time_setting_"
            >
              <BoxCard className="card_size">
                <InputBox
                  id="DeviceName"
                  header="Device Name"
                  disabled
                  value={DeviceData?.Device_name}
                />
                <label className="lbl">Serial Number</label>
                <div className="rtsp_ta">
                  <p>{DeviceData?.Serial_number}</p>
                  <CopyToClipboard text={DeviceData?.Serial_number}>
                    <i className="material-icons adjust_copy">content_copy</i>
                  </CopyToClipboard>
                </div>

                {/* <InputBox
                  id="SerialNumber"
                  header="Serial Number"
                  disabled
                  //   onChange={(e) => setUsername(e.target.value)}
                  //   error={errors["isUsernameEmpty"]}
                  value={DeviceData?.Serial_number}
                  //   onFocus={() => clearError("isUsernameEmpty")}
                /> */}

                <InputBox
                  id="MacID"
                  header="Mac ID"
                  disabled
                  value={DeviceData?.Mac_id}
                />
                <InputBox
                  id="SoftwareVersion"
                  header="Software Version"
                  disabled
                  value={DeviceData?.Software_version}
                />
                <InputBox
                  id="HardwareType"
                  header="Hardware Type"
                  disabled
                  value={DeviceData?.Hardware_type?.toLowerCase()}
                />
                <InputBox
                  id="WarrantyExpiry"
                  header="Warranty Expiry"
                  disabled
                  value={DeviceData?.Warranty_validity}
                />
              </BoxCard>
              <BoxCard className="card_size">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    marginBottom: "2vw",
                  }}
                >
                  <label className="a_label">Device Logs</label>
                  <CSVLink
                    data={csvData}
                    headers={headers}
                    asyncOnClick={true}
                    onClick={() => getcsvData()}
                    filename={DeviceData?.Device_name + "_device_logs.csv"}
                  >
                    <Button
                      style={{ width: "8vw" }}
                      type="gradient"
                      name="Download"
                    />
                  </CSVLink>
                </div>
                {role != "Admin" && (
                  <React.Fragment>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        marginBottom: "2vw",
                      }}
                    >
                      <label className="a_label" style={{ width: "8vw" }}>
                        Reset Settings To Factory Default
                      </label>
                      <Button
                        style={{ width: "8vw" }}
                        onClick={getCurrentUserDetails}
                        type="gradient"
                        name="Reset Settings"
                      />
                    </div>
                    {role === "Manufacturer" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          marginBottom: "1vw",
                          width: "8vw",
                        }}
                      >
                        <label className="a_label">Download Service Logs</label>
                        <Button
                          style={{ width: "8vw" }}
                          type="gradient"
                          name="Download"
                          onClick={() => {
                            setLimit(10);
                            setIsFilterOpen(true);
                            setIntialTime();
                          }}
                        />
                      </div>
                    )}
                  </React.Fragment>
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
                ></div>
              </BoxCard>
            </motion.div>
          </div>
        </div>
      </Navbar>
      {showOTPContainer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.4,
          }}
          className="device_auth_modal"
        >
          <div className="pass_container slideInRight" id="p_container">
            <h1>Verify OTP</h1>
            <i
              className="material-icons close_icon"
              onClick={() => {
                setIsOTPConfirm(true);
              }}
            >
              close
            </i>
            <motion.form
              variants={container}
              initial="hidden"
              animate="visible"
              className="auth_form"
              style={{ width: "100%" }}
            >
              <div className="otpContainer">
                <motion.input
                  variants={xMotion}
                  id="otp1"
                  type="text"
                  autoComplete="off"
                  className="otpInput"
                  disabled={counter === 0}
                  value={otp1}
                  onChange={(e) =>
                    setOtp1(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  tabIndex="1"
                  maxLength="1"
                  onKeyUp={(e) => inputfocus(1, e)}
                  onFocus={() => onFocusEvent(1)}
                  onPaste={handlePaste}
                  autoFocus
                />
                <motion.input
                  id="otp2"
                  variants={xMotion}
                  type="text"
                  autoComplete="off"
                  className="otpInput"
                  value={otp2}
                  onChange={(e) =>
                    setOtp2(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  disabled={counter === 0}
                  tabIndex="2"
                  maxLength="1"
                  onKeyUp={(e) => inputfocus(2, e)}
                  onFocus={() => onFocusEvent(2)}
                  onPaste={(e) => e.preventDefault()}
                />
                <motion.input
                  id="otp3"
                  type="text"
                  variants={xMotion}
                  autoComplete="off"
                  className="otpInput"
                  value={otp3}
                  onChange={(e) =>
                    setOtp3(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  tabIndex="3"
                  disabled={counter === 0}
                  maxLength="1"
                  onKeyUp={(e) => inputfocus(3, e)}
                  onFocus={() => onFocusEvent(3)}
                  onPaste={(e) => e.preventDefault()}
                />
                <motion.input
                  id="otp4"
                  variants={xMotion}
                  type="text"
                  autoComplete="off"
                  className="otpInput"
                  value={otp4}
                  disabled={counter === 0}
                  onChange={(e) =>
                    setOtp4(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  tabIndex="4"
                  maxLength="1"
                  onKeyUp={(e) => inputfocus(4, e)}
                  onFocus={() => onFocusEvent(4)}
                  onPaste={(e) => e.preventDefault()}
                />

                <motion.input
                  variants={xMotion}
                  id="otp5"
                  type="text"
                  autoComplete="off"
                  disabled={counter === 0}
                  className="otpInput"
                  value={otp5}
                  onChange={(e) =>
                    setOtp5(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  tabIndex="5"
                  maxLength="1"
                  onKeyUp={(e) => inputfocus(5, e)}
                  onFocus={() => onFocusEvent(5)}
                  onPaste={(e) => e.preventDefault()}
                />
                <motion.input
                  id="otp6"
                  variants={xMotion}
                  type="text"
                  disabled={counter === 0}
                  autoComplete="off"
                  className="otpInput"
                  value={otp6}
                  onChange={(e) =>
                    setOtp6(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  tabIndex="6"
                  maxLength="1"
                  onKeyUp={(e) => inputfocus(6, e)}
                  onFocus={() => onFocusEvent(6)}
                  onPaste={(e) => e.preventDefault()}
                />
              </div>
              {counter !== 0 && <p className="_counter">{counter} seconds</p>}
              <p className="resend__">
                <span
                  className={counter !== 0 && attempts !== 0 && "disabled"}
                  onClick={counter === 0 && attempts !== 0 && postResendOTP}
                >
                  Resend OTP
                </span>
              </p>
            </motion.form>

            <Button
              style={{ width: "5vw" }}
              type={"gradient"}
              onClick={postInputOTP}
              name="Submit"
            />
          </div>
        </motion.div>
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

      {isLoadingScreen && <Loading type={"transparent"} text={"Loading"} />}

      {isConfirm && (
        <Modal
          onConfirm={() => {
            encryptStorage.removeItem("VID");
            setIsConfirm(false);
            postReset();
          }}
          handleClose={() => {
            encryptStorage.removeItem("VID");
            setIsConfirm(false);
          }}
          type="confirm"
          errorHeader="Warning"
          errorText="All unsaved data will be lost. Do you still want to continue?"
        />
      )}

      {isOTPConfirm && (
        <Modal
          onConfirm={() => {
            setIsOTPConfirm(false);
            setshowOTPContainer(false);
            encryptStorage.removeItem("VID");
            clearTimeout(timeout);
          }}
          handleClose={() => {
            setIsOTPConfirm(false);
          }}
          type="confirm"
          errorHeader="Warning"
          errorText="Are you sure?"
        />
      )}

      {isFilterOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.4,
          }}
          className="download_service_logs"
        >
          <div id="add_user" className="detail_container fadeIn">
            <h1>Download Logs</h1>
            <div
              className="close"
              onClick={() => {
                setIsFilterOpen(false);
              }}
            >
              <i className="material-icons" style={{ color: "#fff" }}>
                close
              </i>
            </div>
            <div className="date_time">
              <p className="time-label">Start Date</p>
              <input
                id="startDate"
                type="datetime-local"
                className=""
                value={startDate}
                onChange={(e) => {
                  let tsMAX = new Date(e.target.value).getTime();
                  let tsMIN = new Date(endtDate).getTime();
                  if (tsMAX > tsMIN) {
                    alert("GREATER THAN START");
                  } else {
                    setstartDate(e.target.value);
                  }
                }}
                max={maxDate}
                min={minDate}
              />
            </div>
            <div className="date_time">
              <p className="time-label">End Date </p>
              <input
                id="endDate"
                type="datetime-local"
                className=""
                onChange={(e) => {
                  console.log(e);
                  let tsMAX = new Date(startDate).getTime();
                  let tsMIN = new Date(e.target.value).getTime();
                  if (tsMAX > tsMIN) {
                    alert("GREATER THAN START");
                  } else {
                    setendtDate(e.target.value);
                  }
                }}
                value={endtDate}
                max={maxDate}
                min={startDate}
              />
            </div>
            <div style={{ marginTop: " 1.0416666667vw" }} />
            <p className="time-label">Limit </p>
            <div className="limit_counter">
              <button className="subtract" onClick={() => handleCounter("sub")}>
                <i className="material-icons">remove</i>
              </button>
              <button className="add" onClick={() => handleCounter("add")}>
                <i className="material-icons">add</i>
              </button>
              <div className="count_value">
                <input
                  type={"text"}
                  className="counter_text"
                  maxLength={4}
                  onChange={(e) => handleCounter("input", e.target.value)}
                  value={Limit}
                />
              </div>
            </div>
            <Button name="Submit" type={"gradient"} onClick={postFilter} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
