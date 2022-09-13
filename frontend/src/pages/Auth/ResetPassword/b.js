import React, { useEffect, useState } from "react";
import Button from "../../../components/Button/Button";
import FormCard from "../../../components/FormCard/FormCard";
import "./reset.scss";
import { motion } from "framer-motion";
import { container, xMotion } from "../../../helper/motions";
import { useHistory, useLocation } from "react-router";
import success from "../../../assets/images/congrats.png";
import { API_URL } from "../../../helper/request";
import axios from "axios";
import useModal from "../../../helper/useModal";
import Modal from "../../../components/Modal/Modal";
import { encryptStorage } from "../../../helper/storage";
var otpVal;
let count = 0;
let msg = "";
let _stop = false;
let _lData__ = encryptStorage.getItem("VID");
export default function AuthResetOTP() {
  const location = useLocation();
  let history = useHistory();
  const { modalOpen, close, open } = useModal();
  const [counter, setCounter] = useState(_lData__ ? _lData__.counter : 180);
  const [otp1, setOtp1] = useState("");
  const [otp2, setOtp2] = useState("");
  const [otp3, setOtp3] = useState("");
  const [otp4, setOtp4] = useState("");
  const [otp5, setOtp5] = useState("");
  const [otp6, setOtp6] = useState("");
  const [isResend, setisResend] = useState(false);
  const [isSuccess, setisSuccess] = useState(false);
  const [attempts, setAttempts] = useState(2);
  const [showPop, setShowPop] = useState(false);

  const inputfocus = (elmnt) => {
    // if (elmnt.target.value === "") {
    //   return;
    // }
    if (elmnt.key === "Delete" || elmnt.key === "Backspace") {
      const next = elmnt.target.tabIndex - 2;
      if (elmnt.target.value === "") {
        count += 1;
      }
      if (count === 2) {
        count = 0;
        if (next > -1) {
          elmnt.target.form.elements[next].focus();
          elmnt.target.form.elements[next].select();
        }
      }
    } else {
      const next = elmnt.target.tabIndex;
      if (next < 6) {
        elmnt.target.form.elements[next].focus();
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
      setisSuccess(true);
      _stop = true;
      history.push("/auth/reset/password");
    } else {
      msg = "Invalid OTP, Please try again!";
      open();
      setTimeout(() => {
        close();
      }, 5000);
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
    setisResend(true);
    axios
      .post(API_URL + "user/otp?forgotPassword=true", {
        destination: location.state?.destination,
        otp: otpVal.toString(),
        interval: "3",
      })
      .then((res) => {
        setAttempts(attempts - 1);
        setCounter(180);

        _lData.otp = otpVal;
        _lData.attempts = attempts - 1;
        // encryptStorage.setItem(_lData);
      })
      .catch((err) => {
        if (err.response.status === 406) {
          setShowPop(true);
        }
      });
  };

  useEffect(() => {
    if (!_stop) {
      counter > 0 &&
        setTimeout(() => {
          let _lData = encryptStorage.getItem("VID");
          if (_lData) {
            _lData.counter = counter - 1;
          }
          encryptStorage.setItem("VID", _lData);
          setCounter(counter - 1);
        }, 1000);

      if (attempts === 0 && counter === 0) {
        msg = "OTP limit exhausted, Please try again later!";
        open();
        setTimeout(() => {
          encryptStorage.removeItem("VID");
          history.replace("/auth/login");
        }, 5000);
      }
    }
  }, [counter]);

  useEffect(() => {
    if (!location.state) {
      history.replace("/auth/login");
    } else {
      let lData = encryptStorage.getItem("VID");
      if (lData) {
        otpVal = location.state?.otpVal;
        if (lData.counter > 1 && attempts !== 0) {
          setisResend(true);
          setCounter(lData.counter);
          setAttempts(lData.attempts);
          otpVal = lData.otp;
        } else if (lData.attempts === 0) {
          alert("All Attempts done");
          return;
        } else if (lData.counter === 0 && attempts !== 0) {
          setCounter(0);
          lData.counter = 0;
          setisResend(true);
          // setAttempts(lData.attempts - 1);
          otpVal = lData.otp;
        }

        encryptStorage.setItem("VID", lData);
      } else {
        setCounter(180);
        otpVal = location.state?.otpVal;
        encryptStorage.setItem("VID", {
          attempts,
          otp: location.state?.otpVal,
          counter: 180,
        });
      }
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
                    name="otp1"
                    type="text"
                    autoComplete="off"
                    className="otpInput"
                    value={otp1}
                    disabled={counter === 0}
                    onChange={(e) =>
                      setOtp1(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    tabIndex="1"
                    maxLength="1"
                    onKeyUp={(e) => inputfocus(e)}
                  />
                  <motion.input
                    name="otp2"
                    variants={xMotion}
                    type="text"
                    autoComplete="off"
                    disabled={counter === 0}
                    className="otpInput"
                    value={otp2}
                    onChange={(e) =>
                      setOtp2(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    tabIndex="2"
                    maxLength="1"
                    onKeyUp={(e) => inputfocus(e)}
                  />
                  <motion.input
                    name="otp3"
                    type="text"
                    variants={xMotion}
                    autoComplete="off"
                    disabled={counter === 0}
                    className="otpInput"
                    value={otp3}
                    onChange={(e) =>
                      setOtp3(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    tabIndex="3"
                    maxLength="1"
                    onKeyUp={(e) => inputfocus(e)}
                  />
                  <motion.input
                    name="otp4"
                    variants={xMotion}
                    type="text"
                    autoComplete="off"
                    disabled={counter === 0}
                    className="otpInput"
                    value={otp4}
                    onChange={(e) =>
                      setOtp4(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    tabIndex="4"
                    maxLength="1"
                    onKeyUp={(e) => inputfocus(e)}
                  />

                  <motion.input
                    variants={xMotion}
                    name="otp5"
                    type="text"
                    autoComplete="off"
                    className="otpInput"
                    disabled={counter === 0}
                    value={otp5}
                    onChange={(e) =>
                      setOtp5(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    tabIndex="5"
                    maxLength="1"
                    onKeyUp={(e) => inputfocus(e)}
                  />
                  <motion.input
                    name="otp6"
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
                    onKeyUp={(e) => inputfocus(e)}
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
                type="gradient"
                disabled={counter === 0}
                onClick={postData}
                name="Verify"
              />
            </div>
          </React.Fragment>
        )}
      </FormCard>
      {modalOpen && (
        <Modal
          modalOpen={modalOpen}
          handleClose={close}
          type="alert"
          errorHeader="Error"
          errorText={msg}
        />
      )}

      {showPop && (
        <Modal
          modalOpen={showPop}
          handleClose={() => {
            setShowPop(false);
            history.push("/auth/otp");
          }}
          type="alert"
          errorHeader="Error"
          errorText="Internet connection not present!"
        />
      )}
    </div>
  );
}
