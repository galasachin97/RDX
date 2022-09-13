import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import Button from "../../../../components/Button/Button";
import { BoxCard } from "../../../../components/card/Card";
import Dropdown from "../../../../components/Dropdown/Dropdown";
import InputBox from "../../../../components/Inputbox/InputBox";
import SwitchBox from "../../../../components/SwitchBox/SwitchBox";
import { container, xMotion } from "../../../../helper/motions";
import sheild from "../../../../assets/images/shield.png";
import { axiosApiInstance } from "../../../../helper/request";
import Modal from "../../../../components/Modal/Modal";
import "./privacy.scss";
import { encryptStorage } from "../../../../helper/storage";
import Loading from "../../../../components/Loading/Loading";
let time = 180;
let otpVal = 0;
let _stop = false;
let timeout = null;
export default function PrivacySetting() {
  const [checked, setchecked] = useState(false);
  const [showModal, setshowModal] = useState(false);
  const [disableButton, setdisableButton] = useState(false);
  const [isLoading, setisLoading] = useState(false);

  const [showOTPContainer, setshowOTPContainer] = useState(false);
  const [otp1, setOtp1] = useState("");
  const [otp2, setOtp2] = useState("");
  const [otp3, setOtp3] = useState("");
  const [otp4, setOtp4] = useState("");
  const [otp5, setOtp5] = useState("");
  const [otp6, setOtp6] = useState("");
  const [showPassErrorModal, setshowPassErrorModal] = useState({
    showPop: false,
    msg: "",
    type: "alert",
    header: "",
  });
  const [attempts, setAttempts] = useState(2);
  const [counter, setCounter] = useState(0);
  const [isConfirm, setIsConfirm] = useState(false);
  const resetState = () => {
    setOtp1("");
    setOtp2("");
    setOtp3("");
    setOtp4("");
    setOtp5("");
    setOtp6("");
    setchecked(false);
    setdisableButton(false);
    setIsConfirm(false);
    setshowOTPContainer(false);
    encryptStorage.removeItem("VID");
    _stop = false;
  };

  const resetModal = () => {
    //console.log("CALLED");
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setshowPassErrorModal((prevState) => ({
        ...prevState,
        showPop: false,
        msg: "",
        type: "alert",
        header: "",
      }));
    }, 3000);
  };
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

  const getConsent = () => {
    axiosApiInstance
      .get("base/device")
      .then((res) => {
        //console.log(res);
        if (res.data?.Consent) {
          setchecked(res.data.Consent);
          setdisableButton(res.data.Consent);
        } else setchecked(false);
      })
      .catch((err) => {
        //console.log(err.response);
      });
  };

  const getCurrentUserDetails = () => {
    axiosApiInstance
      .get("user")
      .then((res) => {
        //console.log(res.data);
        otpVal = Math.floor(Math.random() * 899999 + 100000);

        // var otpVal = Math.floor(Math.random() * 899999 + 100000);
        postOTP(res.data.Username, res.data.Email, otpVal);
      })
      .catch((err) => {
        //console.log(err.response);
      });
  };

  const postOTP = (username, email, otpVal) => {
    setisLoading(true);
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
        setTimeout(() => {
          setshowOTPContainer(true);
        }, 500);
        //console.log(res.data);
      })
      .catch((err) => {
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "OTP limit exhausted, Please try again later!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
        resetState();
        setTimeout(() => {
          getConsent();
        }, 2000);
        //console.log(err.response);
      })
      .finally(() => {
        setisLoading(false);
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
      axiosApiInstance.get("base/consent").then((res) => {
        //console.log(res);
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Successfully Saved!",
          type: "success",
          header: "Success",
        }));
        resetState();
        resetModal();
        setTimeout(() => {
          getConsent();
        }, 3000);
      });
    } else {
      _stop = false;
      setshowPassErrorModal((prevState) => ({
        ...prevState,
        showPop: true,
        msg: "Invalid OTP, Please try again!",
        type: "alert",
        header: "Error",
      }));
      resetModal();
      // msg = "Invalid OTP, Please try again!";
      // open();
      // setTimeout(() => {
      //   close();
      // }, 5000);
    }
  };

  const otpHandler = () => {
    getCurrentUserDetails();
    setshowModal(false);
    setdisableButton(true);
  };

  const postResendOTP = () => {
    let _lData = encryptStorage.getItem("VID");
    if (attempts === 0) {
      encryptStorage.removeItem("VID");
      setshowPassErrorModal((prevState) => ({
        ...prevState,
        showPop: true,
        msg: "No More attempts left Please try later!",
        type: "alert",
        header: "Error",
      }));
      resetModal();
      resetState();
      //reset state

      // msg = "No More attempts left Please try later!";
      // open();
      // setTimeout(() => {
      //   close();
      //   history.replace("/auth/login");
      // }, 5000);
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
          setshowPassErrorModal((prevState) => ({
            ...prevState,
            showPop: true,
            msg: "OTP limit exhausted, Please try again later!",
            type: "alert",
            header: "Error",
          }));
          resetModal();
          resetState();
          setTimeout(() => {
            getConsent();
          }, 2000);
          // msg = "OTP limit exhausted, Please try again later!";
          // open();
          // setTimeout(() => {
          //   encryptStorage.removeItem("VID");
          //   history.replace("/auth/register");
          // }, 5000);
        }
        //console.log(err.response);
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
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "OTP limit exhausted, Please try again later!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
        setTimeout(() => {
          encryptStorage.removeItem("VID");
          resetState();
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
      //console.log(lData);
      if (lData) {
        //console.log("lData found!");
        //console.log(lData);
        otpVal = lData.otp;
        if (lData.counter > 1 && attempts >= 0) {
          //console.log("lData.counter > 1  && attempts >= 0");
          //console.log(lData);
          setCounter(lData.counter - 1);
          setAttempts(lData.attempts);
          otpVal = lData.otp;
        } else if (lData.attempts === 0 && lData.counter === 0) {
          //console.log("lData.attempts === 0");
          setshowPassErrorModal((prevState) => ({
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
            resetState();
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
        //console.log("SETTING ");
        encryptStorage.setItem("VID", lData);
      } else {
        //console.log("lData not found!");
      }
    }
  }, [showOTPContainer]);

  useEffect(() => {
    let _lData__2 = encryptStorage.getItem("VID");
    //console.log(_lData__2);
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

  useEffect(() => {
    getConsent();
  }, []);

  return (
    <motion.div
      variants={xMotion}
      exit="exit"
      initial="hidden"
      animate="visible"
      className="_privacy_setting_"
    >
      <BoxCard className="card_size">
        <img src={sheild} alt="sheild" className="sheild" />
        <h3 className="head">Consent Form</h3>
        <p className="p">
          In order to improve the performance of the product, RDX.ai will
          collect data in the form of images from the added cameras. The
          collected data will be encrypted and stored on our dedicated cloud
          based storage. Please note that the data collected will not be used in
          any third party environment, this data will be solely used to enhance
          the output for you. The collected data will be processed by our
          machine learning tool to process better results in the future. We at
          RDX.ai aim to provide the best possible services at an individual
          level keeping in mind user privacy norms, all required steps have been
          taken to ensure that the product meets the required standards. Thank
          you for helping us serve you better
        </p>
        <p className="p">- Team RDX.AI</p>
        <div className="checkk">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => {
              !checked && setchecked(true);
            }}
          />
          <div
            className="label_"
            onClick={() => {
              !checked && setchecked(true);
            }}
          >
            I Have Read And Understand The Policy Template
          </div>
        </div>

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
            className="user_auth_modal"
          >
            <div className="pass_container slideInRight" id="p_container">
              <h1>Verify OTP</h1>
              <i
                className="material-icons close_icon"
                onClick={() => {
                  setIsConfirm(true);
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

        {showModal && (
          <Modal
            onConfirm={otpHandler}
            handleClose={() => {
              setshowModal(false);
              resetState();
            }}
            type="confirm"
            errorHeader="Confirmation"
            errorText="This process is irreversible. Are you sure?"
          />
        )}

        {isLoading && <Loading type={"transparent"} text={"Loading"} />}

        {isConfirm && (
          <Modal
            onConfirm={() => {
              resetState();
              setIsConfirm(false);
            }}
            handleClose={() => {
              setIsConfirm(false);
            }}
            type="confirm"
            errorHeader="Warning"
            errorText="All unsaved data will be lost.Do you still want to continue?"
          />
        )}

        {showPassErrorModal.showPop && (
          <Modal
            className={"transparent_modal"}
            handleClose={() => {
              setshowPassErrorModal((prevState) => ({
                ...prevState,
                showPop: false,
              }));
            }}
            type={showPassErrorModal.type}
            // errorHeader={showPassErrorModal.header}
            errorHeader={
              showPassErrorModal.header === "Error" ? "Error" : "Success"
            }
            errorText={showPassErrorModal.msg}
          />
        )}

        <Button
          style={{ width: "8vw" }}
          type="gradient"
          name="Save"
          disabled={disableButton}
          onClick={() => checked && setshowModal(true)}
        />
      </BoxCard>
    </motion.div>
  );
}
