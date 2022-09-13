import React, { useEffect, useState } from "react";
import Button from "../../../components/Button/Button";
import FormCard from "../../../components/FormCard/FormCard";
import "./otp.scss";
import { motion } from "framer-motion";
import { container, xMotion } from "../../../helper/motions";
import { useHistory, useLocation } from "react-router";
import success from "../../../assets/images/congrats.png";
import { API_URL } from "../../../helper/request";
import axios from "axios";
import useModal from "../../../helper/useModal";
import Modal from "../../../components/Modal/Modal";
import { encryptStorage } from "../../../helper/storage";
import Loading from "../../../components/Loading/Loading";
let _stop = false;
var otpVal;
let msg = "";
let time = 180;
let _lData__ = encryptStorage.getItem("VID");
export default function AuthOTP() {
  const location = useLocation();
  let history = useHistory();
  const { modalOpen, close, open } = useModal();
  const [isLoadingScreen, setIsLoadingScreen] = useState(false);

  const [otp1, setOtp1] = useState("");
  const [otp2, setOtp2] = useState("");
  const [otp3, setOtp3] = useState("");
  const [otp4, setOtp4] = useState("");
  const [otp5, setOtp5] = useState("");
  const [otp6, setOtp6] = useState("");
  const [isSuccess, setisSuccess] = useState(false);
  const [attempts, setAttempts] = useState(2);
  const [counter, setCounter] = useState(_lData__ ? _lData__.counter : time);

  const getCodeBoxElement = (index) => {
    return document.getElementById("otp" + index);
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
        }
      }
      if (eventCode === 8 && index !== 1) {
        getCodeBoxElement(index - 1).focus();
      }
    }
  };

  const postData = () => {
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
    if (_otp === otpVal.toString()) {
      let _lData = encryptStorage.getItem("VID");
      setIsLoadingScreen(true);
      axios
        .post(API_URL + "base/register_device", _lData.userData)
        .then((res) => {
          _stop = true;
          setIsLoadingScreen(false);
          setisSuccess(true);
          setCounter(-1);
          setTimeout(() => {
            encryptStorage.removeItem("UDATA");
            encryptStorage.removeItem("VID");
            history.push("/auth/login");
          }, 5000);
        })
        .catch((err) => {
          msg = "Something went wrong!";
          open();
          setTimeout(() => {
            close();
          }, 3000);
        });
    } else {
      _stop = false;
      msg = "Invalid OTP, Please try again!";
      open();
      setTimeout(() => {
        close();
      }, 3000);
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

  const postResendOTP = () => {
    let _lData = encryptStorage.getItem("VID");
    if (attempts === 0) {
      encryptStorage.removeItem("VID");
      msg = "No More attempts left Please try later!";
      open();
      setTimeout(() => {
        close();
        history.replace("/auth/login");
      }, 5000);
      return;
    }
    otpVal = Math.floor(Math.random() * 899999 + 100000);
    setIsLoadingScreen(true);
    axios
      .post(API_URL + "user/otp?userVerify=true", {
        destination: _lData?.destination,
        accessKey: _lData?.accessKey,
        username: _lData?.username,
        otp: otpVal.toString(),
        interval: "3",
      })
      .then((res) => {
        setAttempts(attempts - 1);
        setCounter(time);
        _lData.otp = otpVal;
        _lData.attempts = attempts - 1;
        encryptStorage.setItem("VID", _lData);
      })
      .catch((err) => {
        if (err.response.status === 406) {
          // setShowPop(true);
        } else {
          msg = "OTP limit exhausted, Please try again later!";
          open();
          setTimeout(() => {
            encryptStorage.removeItem("VID");
            history.replace("/auth/register");
          }, 5000);
        }
      })
      .finally(() => {
        setIsLoadingScreen(false);
      });
  };

  useEffect(() => {
    if (!_stop) {
      counter > 0 &&
        setTimeout(() => {
          let _lData = encryptStorage.getItem("VID");
          if (!_lData) {
            history.push("/auth/type");
          }
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
        msg = "OTP limit exhausted, Please try again later!";
        open();
        setTimeout(() => {
          encryptStorage.removeItem("VID");
          history.replace("/auth/register");
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
    let lData = encryptStorage.getItem("VID");
    if (lData) {
      otpVal = lData.otp;
      if (lData.counter > 1 && attempts >= 0) {
        setCounter(lData.counter - 1);
        setAttempts(lData.attempts);
        otpVal = lData.otp;
      } else if (lData.attempts === 0 && lData.counter === 0) {
        msg = "OTP limit exhausted, Please try again later!";
        open();
        setTimeout(() => {
          close();
          encryptStorage.removeItem("VID");
          history.replace("/auth/register");
        }, 5000);
        // alert("All Attempts done");

        setCounter(0);
        return;
      } else if (lData.counter === 0 && attempts !== 0) {
        setCounter(0);
        lData.counter = 0;
        otpVal = lData.otp;
      }

      encryptStorage.setItem("VID", lData);
    }
  }, []);

  return (
    <div className="__auth_otp__">
      <FormCard name={isSuccess ? null : "Verify OTP"}>
        {!isSuccess && (
          <React.Fragment>
            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="auth_form"
            >
              <p className="text">
                Enter The OTP Received On Your Registered Email ID
              </p>
              <form style={{ width: "100%" }}>
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
              </form>
              {counter !== 0 && <p className="_counter">{counter} seconds</p>}
              <p>
                <span
                  className={counter !== 0 && "disabled"}
                  onClick={counter === 0 && postResendOTP}
                >
                  Resend OTP
                </span>
              </p>
            </motion.div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button
                disabled={counter === 0}
                type="gradient"
                onClick={postData}
                name="Verify"
              />
            </div>
          </React.Fragment>
        )}
        {isSuccess && (
          <div className="_success_">
            <img src={success} />
            <h1>CONGRATULATIONS!</h1>
            <p className="text">
              Your account has been successfully registered
            </p>
          </div>
        )}
      </FormCard>
      {modalOpen && (
        <Modal
          modalOpen={modalOpen}
          handleClose={close}
          type="alert"
          errorHeader="Error"
          errorText="Invalid OTP, Please try again!"
        />
      )}
      {modalOpen && (
        <Modal
          className="transparent_modal"
          handleClose={() => {
            close();
          }}
          type="alert"
          errorHeader="Error"
          errorText={msg}
        />
      )}
      {isLoadingScreen && (
        <Loading
          text={"Breath"}
          // type={"transparent"} text={"Loading"}
        />
      )}
    </div>
  );
}
