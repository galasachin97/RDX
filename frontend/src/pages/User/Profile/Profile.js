import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import Button from "../../../components/Button/Button";
import { BoxCard } from "../../../components/card/Card";
import InputBox from "../../../components/Inputbox/InputBox";
import Modal from "../../../components/Modal/Modal";
import Navbar from "../../../components/Navbar/Navbar";
import PasswordVerification from "../../../components/PasswordVerification/PasswordVerification";
import { container, item, xMotion } from "../../../helper/motions";
import { axiosApiInstance } from "../../../helper/request";
import { encryptStorage } from "../../../helper/storage";
import "./profile.scss";
let userType = "";
let timeout = "";

export default function Profile() {
  const [accessKey, setaccessKey] = useState("");
  const [isDisable, setIsDisable] = useState(true);
  const [profileData, setprofileData] = useState("");
  const [activeDevice, setActiveDevice] = useState(true);
  const [oldType, setOldType] = useState("password");
  const [oldType2, setOldType2] = useState("password");
  const [errors, setErrors] = useState({
    isPasswordEmpty: false,
    isCPasswordEmpty: false,
  });
  const [showPassContainer, setShowPassContainer] = useState(false);

  const [VerifyPassword, setVerifyPassword] = useState("");
  const [Password, setPassword] = useState("");
  const [ConfirmPassword, setConfirmPassword] = useState("");
  //Password Validation
  const [isLowerCase, setisLowerCase] = useState(false);
  const [isUpperCase, setisUpperCase] = useState(false);
  const [isNumber, setisNumber] = useState(false);
  const [areMinEightChar, setareMinEightChar] = useState(false);
  const [areSpecialCharacters, setareSpecialCharacters] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [PassError, setPassError] = useState(false);
  const [showPassErrorModal, setshowPassErrorModal] = useState({
    showPop: false,
    msg: "",
    type: "",
    header: "",
  });
  const clearError = (name) => {
    //console.log(name);
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

  const resetModal = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setshowPassErrorModal((prevState) => ({
        ...prevState,
        showPop: false,
        msg: "",
        type: "alert",
        header: "Error",
      }));
    }, 3000);
  };
  const validateData = () => {
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
    } else {
      setShowPassContainer(true);
    }
  };

  const postData = () => {
    let eData = encryptStorage.getItem("UID");

    let obj = {
      Username: eData.username,
      Password: Password,
    };
    //console.log(obj);
    axiosApiInstance
      .put("user/password", obj)
      .then((res) => {
        setVerifyPassword("");
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Password updated Successfully.You will be automatically logged out!",
          type: "success",
          header: "Success",
        }));
        setTimeout(() => {
          //logout api to be called
          encryptStorage.removeItem("UID");
          window.location.href = "/";
        }, 5000);
      })
      .catch((err) => {
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Something went wrong.",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

  const postPassword = () => {
    if (VerifyPassword === "") {
      return;
    }
    axiosApiInstance
      .post("user/verify-password", {
        Password: VerifyPassword,
      })
      .then((res) => {
        if (res.status === 200) {
          postData();
        }
      })
      .catch((err) => {
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Password did not matched. Try again!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
        //console.log(err.response);
      });
  };

  useEffect(() => {
    let ldata = encryptStorage.getItem("UID");
    axiosApiInstance.get("user").then((data) => {
      userType = ldata.role;
      setprofileData(data.data);
    });

    axiosApiInstance.get("base/device").then((data) => {
      setaccessKey(data.data.Access_key);
    });
  }, []);

  useEffect(() => {
    if (Password !== "" && ConfirmPassword !== "") {
      if (Password === ConfirmPassword) {
        setIsDisable(false);
      } else {
        setIsDisable(true);
      }
    }
  }, [Password, ConfirmPassword]);

  return (
    <div className="Profile">
      <Navbar navName="Profile">
        <div className="_profile_list_">
          <div className="fixed_activity">
            <motion.ul
              variants={container}
              exit="exit"
              initial="hidden"
              animate="visible"
            >
              <motion.li
                className={activeDevice && "active_stage"}
                variants={item}
                key={item}
                onClick={() => setActiveDevice(item)}
              >
                {profileData.Username}
              </motion.li>
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
                id="FullName"
                header="Full Name"
                disabled
                //   onChange={(e) => setUsername(e.target.value)}
                //   error={errors["isUsernameEmpty"]}
                value={profileData.FullName}
                //   onFocus={() => clearError("isUsernameEmpty")}
              />

              <InputBox
                id="Role"
                header="Role"
                disabled
                //   onChange={(e) => setUsername(e.target.value)}
                //   error={errors["isUsernameEmpty"]}
                value={profileData.Role}
                //   onFocus={() => clearError("isUsernameEmpty")}
              />
              <InputBox
                id="Username"
                header="Username"
                disabled
                //   onChange={(e) => setUsername(e.target.value)}
                //   error={errors["isUsernameEmpty"]}
                value={profileData.Username}
                //   onFocus={() => clearError("isUsernameEmpty")}
              />
              <InputBox
                id="Email"
                header="Email"
                disabled
                //   onChange={(e) => setUsername(e.target.value)}
                //   error={errors["isUsernameEmpty"]}
                value={profileData.Email}
                //   onFocus={() => clearError("isUsernameEmpty")}
              />

              {userType === "Superadmin" && (
                <React.Fragment>
                  <InputBox
                    id="AccessKey"
                    header="Access Key"
                    disabled
                    //   onChange={(e) => setUsername(e.target.value)}
                    //   error={errors["isUsernameEmpty"]}
                    //   onFocus={() => clearError("isUsernameEmpty")}
                    style={{ background: "transparent", display: "none" }}
                  />

                  <div className="rtsp_ta">
                    <p>{accessKey}</p>
                    <CopyToClipboard text={accessKey}>
                      <i className="material-icons adjust_copy">content_copy</i>
                    </CopyToClipboard>
                  </div>
                </React.Fragment>
              )}

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
                  //console.log(value);
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
              <Button
                style={{ width: "8vw" }}
                onClick={validateData}
                name="Submit"
                type={"gradient"}
                // disabled={PassError}
                disabled={isDisable}
              />
            </BoxCard>
          </motion.div>
        </div>
        {showPassErrorModal.showPop && (
          <Modal
            className={"transparent_modal"}
            handleClose={() => {
              setshowPassErrorModal((prevState) => ({
                ...prevState,
                showPop: false,
              }));
            }}
            type={showPassErrorModal.type ? showPassErrorModal.type : "alert"}
            errorHeader={
              showPassErrorModal.header ? showPassErrorModal.header : "Error"
            }
            errorText={showPassErrorModal.msg}
          />
        )}
        {showPassContainer && (
          <PasswordVerification
            close={() => setShowPassContainer(false)}
            postPassword={postPassword}
            password={VerifyPassword}
            setPassword={setVerifyPassword}
          />
        )}
      </Navbar>
    </div>
  );
}
