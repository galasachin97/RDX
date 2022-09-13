import React, { useEffect, useState } from "react";
import Button from "../../../components/Button/Button";
import FormCard from "../../../components/FormCard/FormCard";
import InputBox from "../../../components/Inputbox/InputBox";
import "./reset.scss";
import { motion } from "framer-motion";
import { container, item } from "../../../helper/motions";
import { Link, useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import success from "../../../assets/images/congrats.png";
import { API_URL } from "../../../helper/request";
import Modal from "../../../components/Modal/Modal";
import { encryptStorage } from "../../../helper/storage";
import useModal from "../../../helper/useModal";
let msg = "";
export default function AuthResentPasswordinput() {
  let history = useHistory();
  const location = useLocation();
  const { modalOpen, close, open } = useModal();
  const [Password, setPassword] = useState("");
  const [ConfirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    isPasswordEmpty: false,
    isCPasswordEmpty: false,
  });

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
    // console.log(otp);
    let _errors = { ...errors };
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
      Username: location.state?.username,
      New_password: Password,
    };
    axios
      .post(API_URL + "user/update-password", obj)
      .then((res) => {
        if (res.status === 200) {
          msg = "Password updated successfully!";
          open();
          setTimeout(() => {
            history.push("/auth/login");
          }, 5000);
        }
      })
      .catch((err) => {
        if (err.response.status === 406) {
          setShowPop(true);
        }
      });

    // let obj = {
    //   accessKey: accessKey,
    //   deviceName: Devicename,
    //   fullName: Fname,
    //   username: Username,
    //   password: Password,
    //   emailId: Email,
    //   phone: Mobile,
    //   serialNumber: SerialNumber,
    // };
    // console.log(obj);
    // axios
    //   .post(API_URL + "base/register_device", obj)
    //   .then((res) => {
    //     console.log(res);
    //     if (otp) {
    //       encryptStorage.setItem("UDATA", obj);
    //       var otpVal = Math.floor(Math.random() * 899999 + 100000);
    //       postOTP(otpVal);
    //     } else {
    //       setisSuccess(true);
    //       setTimeout(() => {
    //         history.replace("/auth/login");
    //       }, 5000);
    //     }
    //   })
    //   .catch((err) => {
    //     if (err.response.status === 406) {
    //       setShowPop(true);
    //     }
    //     if (
    //       err.response.status === 403 &&
    //       err.response.data.detail === "Already configured"
    //     ) {
    //       var otpVal = Math.floor(Math.random() * 899999 + 100000);
    //       postOTP(otpVal);
    //     }
    //     console.log(err.response);
    //   });
  };

  useEffect(() => {
    if (!location.state?.username) {
      history.replace("/auth/login");
    }
  }, []);

  return (
    <div className="__auth_register__">
      <FormCard name={isSuccess ? null : "Reset Password"}>
        {!isSuccess && (
          <div className="auth_form">
            <motion.ul variants={container} initial="hidden" animate="visible">
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
                    // setDropdown(true);
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
                onClick={postData}
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
          errorText="Internet connection not present!"
        />
      )}
      {modalOpen && (
        <Modal
          className="transparent_modal"
          handleClose={() => {
            close();
          }}
          type="success"
          errorHeader="Success"
          errorText={msg}
        />
      )}
    </div>
  );
}
