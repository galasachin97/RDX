import React, { useEffect, useState } from "react";
import Button from "../../../components/Button/Button";
import FormCard from "../../../components/FormCard/FormCard";
import InputBox from "../../../components/Inputbox/InputBox";
import "./a_r.scss";
import { motion } from "framer-motion";
import { container, item } from "../../../helper/motions";
import { useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import success from "../../../assets/images/congrats.png";
import { API_URL } from "../../../helper/request";
import Modal from "../../../components/Modal/Modal";
import { encryptStorage } from "../../../helper/storage";
import useModal from "../../../helper/useModal";
import PhoneInputBox from "../../../components/PhoneInputBox/PhoneInputBox";
import Loading from "../../../components/Loading/Loading";
import { useDebouncedEffect } from "../../../helper/useDebounce";
var otpVal = null;
var msg = null;
let inputNumber = "";

export default function AuthRegister() {
  let history = useHistory();
  const location = useLocation();
  const [verifyEmail, setverifyEmail] = useState(true);
  const [disableAll, setDisableAll] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [SerialNumber, setSerialNumber] = useState("");
  const [Fname, setFname] = useState("");
  const [Devicename, setDevicename] = useState("");
  const [Email, setEmail] = useState("");
  const { modalOpen, close, open } = useModal();
  const [Username, setUsername] = useState("");
  const [Mobile, setMobile] = useState("");
  const [Password, setPassword] = useState("");
  const [ConfirmPassword, setConfirmPassword] = useState("");
  const [MobileNoLength, setMobileNoLength] = useState(12);
  const [isLoadingScreen, setIsLoadingScreen] = useState(false);

  const [errors, setErrors] = useState({
    isFNameEmpty: false,
    isDNameEmpty: false,
    isDNameUnique: false,
    isEmailEmpty: false,
    isUsernameEmpty: false,
    isMobileEmpty: false,
    isPasswordEmpty: false,
    isCPasswordEmpty: false,
  });

  useDebouncedEffect(
    () => (Devicename ? uniqueCheck() : undefined),
    [Devicename],
    1000
  );

  const uniqueCheck = () => {
    if (location.state?.deviceName) {
      return;
    }
    axios
      .get(
        API_URL + "base/unique/device_name?deviceName=" + Devicename,

        {
          headers: {
            // accessKey: "890462d0da172544f359c800e11ba3a903e94a6e",
            accessKey,
            serialNumber: SerialNumber,
            // serialNumber:
            //   "01222191851001c54db77f241e0cd8cd67abc720a6bdb8acb5dc0001",
          },
        }
      )
      .then((res) => {
        if (res.data.detail === "not found") {
          setErrors((prev) => ({
            ...prev,
            isDNameUnique: false,
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            isDNameUnique: true,
          }));
        }
      });
  };

  //Password Validation
  const [isLowerCase, setisLowerCase] = useState(false);
  const [isUpperCase, setisUpperCase] = useState(false);
  const [isNumber, setisNumber] = useState(false);
  const [areMinEightChar, setareMinEightChar] = useState(false);
  const [areSpecialCharacters, setareSpecialCharacters] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [PassError, setPassError] = useState(false);
  const [isSuccess, setisSuccess] = useState(false);
  const [showPop, setShowPop] = useState(false);

  const [oldType, setOldType] = useState("password");
  const [oldType2, setOldType2] = useState("password");
  const handlePassword = (type) => {
    if (!type) {
      setOldType("password");
    } else {
      setOldType("text");
    }
  };
  const handleConfirmPassword = (type) => {
    if (!type) {
      setOldType2("password");
    } else {
      setOldType2("text");
    }
  };
  const emailValidation = () => {
    let _error = { ...errors };
    if (
      Email.match(
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
    ) {
      _error["isEmailEmpty"] = false;
    } else {
      _error["isEmailEmpty"] = true;
    }
    setErrors({ ..._error });
  };

  const clearError = (name) => {
    let _errors = { ...errors };
    _errors[name] = false;
    setErrors({ ..._errors });
  };
  const checkPassword = (password) => {
    if (password.match(/[a-z]/g)) {
      setisLowerCase(true);
    } else {
      setisLowerCase(false);
    }

    if (password.match(/[A-Z]/g)) {
      setisUpperCase(true);
    } else {
      setisUpperCase(false);
    }

    if (password.match(/[0-9]/g)) {
      setisNumber(true);
    } else {
      setisNumber(false);
    }

    if (password.length >= 8) {
      setareMinEightChar(true);
    } else {
      setareMinEightChar(false);
    }

    if (password.match(/[!@#$%&()+]/g)) {
      setareSpecialCharacters(true);
    } else {
      setareSpecialCharacters(false);
    }
    if (
      !password.match(/[a-z]/g) ||
      !password.match(/[A-Z]/g) ||
      !password.match(/[0-9]/g) ||
      password.length < 8 ||
      !password.match(/[!@#$%&()+]/g)
    ) {
      setPassError(true);
    } else {
      setPassError(false);
    }

    // if (password !== ConfirmPassword) {
    //   setdoesPasswordMatch(true);
    // } else {
    //   setdoesPasswordMatch(false);
    // }
    if (
      password.match(/[a-z]/g) &&
      password.match(/[A-Z]/g) &&
      password.match(/[0-9]/g) &&
      password.length >= 8 &&
      password.match(/[!@#$%&()+]/g)
    ) {
      setDropdown(false);
    } else {
      setDropdown(true);
    }
  };

  const postData = () => {
    let _errors = { ...errors };
    if (Fname === "") _errors["isFNameEmpty"] = true;
    if (Devicename === "") _errors["isDNameEmpty"] = true;
    if (Email === "") _errors["isEmailEmpty"] = true;
    if (Username === "") _errors["isUsernameEmpty"] = true;
    // if (Mobile === "" || Mobile.length !== MobileNoLength)
    if (inputNumber === "") _errors["isMobileEmpty"] = true;
    if (Password === "" || PassError) _errors["isPasswordEmpty"] = true;
    if (ConfirmPassword === "") _errors["isCPasswordEmpty"] = true;
    if (Password !== ConfirmPassword) {
      _errors["isPasswordEmpty"] = true;
      _errors["isCPasswordEmpty"] = true;
    }
    if (Password && ConfirmPassword && Password === ConfirmPassword) {
      _errors["isPasswordEmpty"] = false;
      _errors["isCPasswordEmpty"] = false;
    }
    if (PassError) {
      _errors["isPasswordEmpty"] = true;
      setDropdown(true);
    }

    setErrors({ ..._errors });
    if (Object.values(_errors).includes(true) || PassError) {
      return;
    }
    let obj = {
      accessKey: accessKey,
      deviceName: Devicename,
      fullName: Fname,
      username: Username,
      password: Password,
      emailId: Email,
      phone: Mobile,
      serialNumber: SerialNumber,
    };

    if (verifyEmail) {
      otpVal = Math.floor(Math.random() * 899999 + 100000);
      postOTP(otpVal, obj);
    } else {
      setIsLoadingScreen(true);
      close();
      axios
        .post(API_URL + "base/register_device", obj)
        .then((res) => {
          setIsLoadingScreen(false);
          setisSuccess(true);
          setTimeout(() => {
            history.replace("/auth/login");
          }, 3000);
        })
        .catch((err) => {
          if (err.response.status === 406) {
            msg = "Internet connection not present!";
            setShowPop(true);
            setTimeout(() => {
              setShowPop(false);
            }, 3000);
          }

          if (err.response.status === 403) {
            msg = "OTP limit exhausted, Please try again tomorrow!";
            setShowPop(true);
            setTimeout(() => {
              setShowPop(false);
            }, 3000);
          }
          // if (
          //   err.response.status === 403 &&
          //   err.response.data.detail === "Already configured"
          // ) {
          //   var otpVal = Math.floor(Math.random() * 899999 + 100000);
          //   postOTP(otpVal);
          // }
        });
    }
  };

  const postOTP = (otpVal, userData) => {
    setIsLoadingScreen(true);
    axios
      .post(API_URL + "user/otp?userVerify=true", {
        accessKey: accessKey,
        username: Username,
        destination: Email,
        otp: otpVal.toString(),
        interval: "3",
      })
      .then((res) => {
        encryptStorage.setItem("VID", {
          attempts: 2,
          otp: otpVal,
          counter: 180,
          destination: Email,
          username: Username,
          userData,
          accessKey,
        });
        setIsLoadingScreen(false);
        history.push({
          pathname: "/auth/otp",
          // state: {
          //   attempts: 2,
          //   otpVal,
          //   accessKey: accessKey,
          //   username: Username,
          //   destination: Email,
          // },
        });
      });
  };
  useEffect(() => {
    let _data = encryptStorage.getItem("UDATA");
    if (_data) {
      setDevicename(_data.deviceName);
      setAccessKey(_data.accessKey);
      setFname(_data.fullName);
      setUsername(_data.username);
      setEmail(_data.emailId);
      setMobile(_data.phone);
      setSerialNumber(_data.serialNumber);
    } else {
      if (!location.state?.accessKey) {
        history.replace("/auth/login");
      } else {
        setAccessKey(location.state?.accessKey);
        setDevicename(location.state?.deviceName);
        setSerialNumber(location.state?.serialNumber);
      }
    }
    getUserData();
  }, []);
  const getUserData = () => {
    axios.get(API_URL + "user/superadmin/unprotected").then((res) => {
      setDisableAll(true);
      // setDevicename(res.detail.deviceName);
      // setAccessKey(res.detail.accessKey);
      setFname(res.data.detail.FullName);
      setUsername(res.data.detail.Username);
      setEmail(res.data.detail.Email);
      setMobile(res.data.detail.Phone);
      // setSerialNumber(res.detail.serialNumber);
    });
    // .catch((err) => {
    //   msg = "Something went wrong!";
    //   setShowPop(true);
    //   setTimeout(() => {
    //     setShowPop(false);
    //   }, 3000);
    // });
  };
  return (
    <div className="__auth_register__">
      <FormCard name={isSuccess ? null : "Register User"}>
        {!isSuccess && (
          <div className="auth_form">
            <motion.ul variants={container} initial="hidden" animate="visible">
              <motion.li variants={item}>
                <InputBox
                  id="deviceName"
                  disabled={location.state?.deviceName ? true : false}
                  header="Device Name *"
                  onChange={(e) => {
                    const value = e.target.value;
                    const regex = /^[a-zA-Z0-9-_]*$/;
                    if (value.match(regex) || value === "") {
                      setDevicename(value);
                    }
                  }}
                  error={errors["isDNameEmpty"] || errors["isDNameUnique"]}
                  value={Devicename}
                  // onFocus={() => clearError("isDNameEmpty")}
                  helperText={errors["isDNameUnique"] && "Already used"}
                />
              </motion.li>

              <motion.li variants={item}>
                <InputBox
                  id="fullName"
                  header="Full Name *"
                  onChange={(e) => {
                    const value = e.target.value;
                    const regex = /^[a-zA-Z ]*$/;
                    if (value.match(regex) || value === "") {
                      setFname(value);
                    }
                  }}
                  disabled={disableAll}
                  error={errors["isFNameEmpty"]}
                  value={Fname}
                  onFocus={() => clearError("isFNameEmpty")}
                />
              </motion.li>

              <motion.li
                style={{ position: "relative", zIndex: 5 }}
                variants={item}
              >
                <div className="switch_box box_1">
                  <label>Verify</label>
                  <input
                    disabled={disableAll}
                    value={verifyEmail}
                    onChange={(e) => setverifyEmail(!verifyEmail)}
                    // checked={verifyEmail}
                    type="checkbox"
                    className="switch_1"
                    defaultChecked={verifyEmail}
                  />
                </div>
                <InputBox
                  id="email"
                  header="Email *"
                  disabled={disableAll}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors["isEmailEmpty"]}
                  value={Email}
                  onBlur={emailValidation}
                  onFocus={() => clearError("isEmailEmpty")}
                />
              </motion.li>
              <motion.li variants={item}>
                <InputBox
                  id="username"
                  header="Username *"
                  disabled={disableAll}
                  onChange={(e) => {
                    const value = e.target.value;
                    const regex = /^[a-zA-Z0-9]*$/;
                    if (value.match(regex) || value === "") {
                      setUsername(value);
                    }
                  }}
                  error={errors["isUsernameEmpty"]}
                  value={Username}
                  onFocus={() => clearError("isUsernameEmpty")}
                />
              </motion.li>
              <motion.li variants={item}>
                <PhoneInputBox
                  disabled={disableAll}
                  id="mobile_number"
                  isEdit={true}
                  onChange={(data) => {
                    inputNumber = data.inputNumber;
                    let _number = data.countryCode + " " + data.inputNumber;
                    setMobile(_number);
                  }}
                  onFocus={() => clearError("isMobileEmpty")}
                  value={Mobile}
                  error={errors["isMobileEmpty"] || errors["isMobileUnique"]}
                  helperText={errors["isMobileUnique"] && "Already used"}
                />
              </motion.li>
              <motion.li variants={item}>
                <InputBox
                  id="password"
                  onInput={(e) => checkPassword(e.target.value)}
                  error={errors["isPasswordEmpty"]}
                  type={oldType}
                  typeValue={(data) => handlePassword(data)}
                  password
                  header="Enter Password *"
                  onChange={(e) => {
                    const value = e.target.value;
                    const regex = /^[a-zA-Z0-9!@#$%&()+]*$/;
                    if (value.match(regex) || value === "") {
                      setPassword(value);
                    }
                  }}
                  value={Password}
                  onFocus={() => {
                    clearError("isPasswordEmpty");
                  }}
                  onBlur={() => {
                    setDropdown(false);
                  }}
                />
                {dropdown && (
                  <div className="dropdown">
                    <div className="dropdown-content">
                      <p>Password must contain:</p>

                      <p className={isUpperCase ? "valid" : "invalid"}>
                        An <b>Uppercase</b> letter
                      </p>
                      <p className={isLowerCase ? "valid" : "invalid"}>
                        A <b>Lowercase</b> letter
                      </p>
                      <p className={isNumber ? "valid" : "invalid"}>
                        A <b>number</b>
                      </p>
                      <p className={areMinEightChar ? "valid" : "invalid"}>
                        Minimum <b>8 characters</b>
                      </p>
                      <p className={areSpecialCharacters ? "valid" : "invalid"}>
                        Special Characters Allowed: <b>!@#$%&()+</b>
                      </p>
                    </div>
                  </div>
                )}
              </motion.li>
              <motion.li variants={item}>
                <InputBox
                  id="password2"
                  error={errors["isCPasswordEmpty"]}
                  type={oldType2}
                  value={ConfirmPassword}
                  typeValue={(data) => handleConfirmPassword(data)}
                  password
                  header="Confirm Password *"
                  onChange={(e) => {
                    const value = e.target.value;
                    const regex = /^[a-zA-Z0-9!@#$%&()+]*$/;
                    if (value.match(regex) || value === "") {
                      setConfirmPassword(value);
                    }
                  }}
                  onFocus={() => clearError("isCPasswordEmpty")}
                  onBlur={() => {
                    let _errors = { ...errors };
                    if (Password !== ConfirmPassword) {
                      _errors["isPasswordEmpty"] = true;
                      _errors["isCPasswordEmpty"] = true;
                    } else {
                      _errors["isPasswordEmpty"] = false;
                      _errors["isCPasswordEmpty"] = false;
                    }
                    setErrors({ ..._errors });
                  }}
                />
              </motion.li>
            </motion.ul>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                // marginTop: "1vw",
              }}
            >
              {/* <Button
                onClick={() => postData(true)}
                style={{ width: "8vw" }}
                name="Verify & Submit"
                type="gradient"
              /> */}
              <Button
                style={{ width: "8vw" }}
                onClick={() => {
                  if (!verifyEmail) {
                    let _errors = { ...errors };
                    if (Email === "") _errors["isEmailEmpty"] = true;
                    if (Password === "" || PassError)
                      _errors["isPasswordEmpty"] = true;
                    if (ConfirmPassword === "")
                      _errors["isCPasswordEmpty"] = true;
                    if (Password !== ConfirmPassword) {
                      _errors["isPasswordEmpty"] = true;
                      _errors["isCPasswordEmpty"] = true;
                    }
                    if (
                      Password &&
                      ConfirmPassword &&
                      Password === ConfirmPassword
                    ) {
                      _errors["isPasswordEmpty"] = false;
                      _errors["isCPasswordEmpty"] = false;
                    }
                    if (PassError) {
                      _errors["isPasswordEmpty"] = true;
                      setDropdown(true);
                    }
                    setErrors({ ..._errors });
                    if (Object.values(_errors).includes(true) || PassError) {
                      return;
                    }

                    open();
                  } else {
                    postData(true);
                  }
                  // if (verifyEmail) postData(true);
                  // else postData(false);
                }}
                name="Submit"
                disabled={PassError}
              />
            </div>
          </div>
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
      {showPop && (
        <Modal
          modalOpen={showPop}
          handleClose={() => {
            setShowPop(false);
            history.push("/auth/register");
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
      {modalOpen && (
        <Modal
          className="adjust_modal"
          onConfirm={() => {
            close();
            postData();
          }}
          handleClose={() => {
            close();
          }}
          type="confirm"
          errorHeader="Confirmation"
          errorText="Email Verification is disabled. Do you want to continue?"
        />
      )}
    </div>
  );
}
