import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import Button from "../../../components/Button/Button";
import { BoxCard } from "../../../components/card/Card";
import InputBox from "../../../components/Inputbox/InputBox";
import Navbar from "../../../components/Navbar/Navbar";
import { container, xMotion } from "../../../helper/motions";
import { axiosApiInstance } from "../../../helper/request";
import dots from "../../../assets/images/dots.png";
import ReactTooltip from "react-tooltip";
import "./users.scss";
import useModal from "../../../helper/useModal";
import Modal from "../../../components/Modal/Modal";
import Dropdown from "../../../components/Dropdown/Dropdown";
import { encryptStorage } from "../../../helper/storage";
import { useDebouncedEffect } from "../../../helper/useDebounce";
import "react-phone-input-2/lib/style.css";
import PhoneInputBox from "../../../components/PhoneInputBox/PhoneInputBox";
import useLoading from "../../../helper/useLoading";
import Loading from "../../../components/Loading/Loading";

let _lData__ = encryptStorage.getItem("VID");
let _lData__2 = encryptStorage.getItem("VID2");
let activeInput = null;
let _stop = false;
var otpVal;
let msg = "";
let errortype = "";
let time = 180;
let timeout = null;
let isunique = {
  email: false,
  username: false,
  mobile: true,
};
let inputNumber = "";
let inputNumber2 = "";
export default function Users() {
  const [filterRole, setfilterRole] = useState("");
  const filterRoleOptions = () => {
    let eData = encryptStorage.getItem("UID");
    if (eData.role === "Superadmin") return ["Superadmin", "Admin", "Operator"];
    else return ["Admin", "Operator"];
  };

  const [search, setSearch] = useState("");
  const [_isLoading, set_isLoading] = useState(false);
  const [userData, setUserData] = useState([]);
  const [isFloatOpen, setisFloatOpen] = useState(false);
  const [showAdduser, setshowAdduser] = useState(false);
  const [showOTPContainer, setshowOTPContainer] = useState(false);
  const [attempts, setAttempts] = useState(2);
  const [counter, setCounter] = useState(_lData__ ? _lData__.counter : time);
  const { modalOpen, close, open } = useModal();
  const [isConfirm, setIsConfirm] = useState(false);
  const [disableSaveButton, setDisableSaveButton] = useState(false);
  const [MobileNoLength, setMobileNoLength] = useState(12);

  const [roleOption, setroleOption] = useState(["Admin", "Operator"]);

  const [Fname, setFname] = useState("");
  const [Email, setEmail] = useState("");
  const [verifyEmail, setverifyEmail] = useState(true);
  const [Role, setRole] = useState("");
  const [Mobile, setMobile] = useState("");
  const [Username, setUsername] = useState("");
  const [Password, setPassword] = useState("");
  const [ConfirmPassword, setConfirmPassword] = useState("");
  const [otp1, setOtp1] = useState("");
  const [otp2, setOtp2] = useState("");
  const [otp3, setOtp3] = useState("");
  const [otp4, setOtp4] = useState("");
  const [otp5, setOtp5] = useState("");
  const [otp6, setOtp6] = useState("");
  useDebouncedEffect(
    () => (Email || Mobile || Username ? uniqueCheck() : undefined),
    [Email, Mobile, Username],
    1000
  );

  const resetState = () => {
    setErrors({
      isFNameEmpty: false,
      isRoleEmpty: false,
      isEmailEmpty: false,
      isEmailUnique: false,
      isUsernameEmpty: false,
      isUsernameUnique: false,
      isMobileEmpty: false,
      isMobileUnique: false,
      isPasswordEmpty: false,
      isCPasswordEmpty: false,
    });
    setFname("");
    setEmail("");
    setverifyEmail(true);
    setRole("");
    setMobile("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setOtp1("");
    setOtp2("");
    setOtp3("");
    setOtp4("");
    setOtp5("");
    setOtp6("");
    setisFloatOpen(false);
    setshowOTPContainer(false);
    setIsConfirm(false);
    setAttempts(2);
    _stop = false;
    encryptStorage.removeItem("VID");
    otpVal = null;
  };

  const [EmailVerified, setEmailVerified] = useState(false);
  const [errors, setErrors] = useState({
    isFNameEmpty: false,
    isRoleEmpty: false,
    isEmailEmpty: false,
    isEmailUnique: false,
    isUsernameEmpty: false,
    isUsernameUnique: false,
    isMobileEmpty: false,
    isMobileUnique: false,
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

  const [oldType, setOldType] = useState("password");
  const [oldType2, setOldType2] = useState("password");
  const { isLoading, loadingFinished, loading } = useLoading();
  const uniqueCheck = async () => {
    let obj = {};
    let _err = { ...errors };
    if (activeInput === "username") obj.Username = Username;
    if (activeInput === "email") obj.Email = Email;
    if (activeInput === "mobile") obj.Phone = Mobile;
    axiosApiInstance
      .post("user/duplicate", obj)
      .then((res) => {
        //console.log(res);
        if (activeInput === "mobile") {
          isunique.username = true;
          _err.isMobileUnique = false;
        }
        if (activeInput === "username") {
          isunique.email = true;
          _err.isUsernameUnique = false;
        }

        if (activeInput === "email") {
          _err.isEmailUnique = false;
        }
        setErrors({ ..._err });
      })
      .catch((err) => {
        //console.log(err.response);
        if (err.response.status === 409) {
          if (err.response.data.detail.includes("email")) {
            if (activeInput === "email") {
              _err.isEmailUnique = true;
            }
            //console.log("EMAIL IS NOT VALID");
          }
          if (err.response.data.detail.includes("username")) {
            //console.log("username IS NOT VALID");
            if (activeInput === "username") {
              _err.isUsernameUnique = true;
            }
          }
          if (err.response.data.detail.includes("phone")) {
            //console.log("phone IS NOT VALID");
            if (activeInput === "mobile") {
              _err.isMobileUnique = true;
            }
          }
        }
        setErrors({ ..._err });
      });
    //console.log(_err);
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

  const postData = (otp) => {
    let _errors = { ...errors };
    if (Fname === "") _errors["isFNameEmpty"] = true;
    if (Role === "") _errors["isRoleEmpty"] = true;
    if (Email === "") _errors["isEmailEmpty"] = true;
    if (Username === "") _errors["isUsernameEmpty"] = true;
    // if (Mobile === "" || Mobile.length !== MobileNoLength)
    if (inputNumber === "") _errors["isMobileEmpty"] = true;
    if (Password === "") _errors["isPasswordEmpty"] = true;
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
      _errors["isPasswordEmpty"] = false;
      _errors["isCPasswordEmpty"] = false;
    }
    let obj = {
      FullName: Fname,
      Username: Username,
      Password: Password,
      Email: Email,
      Phone: Mobile,
      Role: Role,
      EmailVerified: EmailVerified,
    };

    if (verifyEmail) {
      otpVal = Math.floor(Math.random() * 899999 + 100000);
      postOTP2(otpVal, obj);
    } else {
      set_isLoading(true);
      axiosApiInstance
        .post("user/create", obj)
        .then((res) => {
          if (res.status === 200) {
            set_isLoading(false);
            errortype = "success";
            msg = "User Added Successfully";
            open();
            clearTimeout(timeout);
            resetState();
            timeout = setInterval(() => {
              close();
            }, 3000);
            getUsers();
          }
        })
        .catch((err) => {
          //console.log(err.response);
          set_isLoading(false);
        });
    }
  };

  const postOTP2 = (otpVal, userData) => {
    set_isLoading(true);
    axiosApiInstance
      .post("user/otp?userVerify=true", {
        destination: Email,
        username: Username,
        otp: otpVal.toString(),
        interval: "3",
      })
      .then((res) => {
        set_isLoading(false);
        var ele = document.querySelector("#add_user");
        ele.classList.add("slideOutLeft");
        setTimeout(() => {
          setshowAdduser(false);
          setshowOTPContainer(true);
          ele.classList.remove("slideOutLeft");
        }, 500);
        userData.EmailVerified = true;
        //console.log("SETTING ");
        encryptStorage.setItem("VID", {
          attempts: 2,
          otp: otpVal,
          counter: time,
          destination: Email,
          userData,
        });
      })
      .catch((err) => {
        setshowAdduser(false);
        set_isLoading(false);
        msg = "OTP limit exhausted. Please try later!";
        open();
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          close();
          resetState();
        }, 5000);
        return;
      });
  };

  const postOTP = () => {
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
      set_isLoading(true);
      setTimeout(() => {
        _stop = true;
        errortype = "success";
        setCounter(0);
        let _uData = encryptStorage.getItem("VID");
        axiosApiInstance
          .post("user/create", _uData.userData)
          .then((res) => {
            if (res.status === 200) {
              set_isLoading(false);
              msg = "User Created Successfully!";
              open();
              clearTimeout(timeout);
              timeout = setTimeout(() => {
                close();
              }, 5000);
              encryptStorage.removeItem("VID");
              getUsers();
              resetState();
            }
          })
          .catch((err) => {
            //console.log(err.response);
            set_isLoading(false);
          });
      }, 1500);
    } else {
      set_isLoading(true);
      setTimeout(() => {
        set_isLoading(false);
        _stop = false;
        msg = "Invalid OTP, Please try again!";
        open();
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          close();
        }, 3000);
      }, 1500);
    }
  };

  const postResendOTP = () => {
    let _lData = encryptStorage.getItem("VID");
    if (attempts === 0) {
      msg = "No More attempts left Please try later!";
      errortype = "alert";
      open();
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        close();
        resetState();
      }, 5000);
      return;
    }
    otpVal = Math.floor(Math.random() * 899999 + 100000);
    set_isLoading(true);
    axiosApiInstance
      .post("user/otp?userVerify=true", {
        destination: _lData.userData.Email,
        otp: otpVal.toString(),
        interval: "3",
        username: _lData.userData.Username,
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
          //console.log("406");
        } else {
          msg = "OTP limit exhausted, Please try again later!";
          errortype = "alert";
          open();
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            close();
            resetState();
          }, 5000);
        }
        //console.log(err.response);
      })
      .finally(() => {
        set_isLoading(false);
      });
  };

  const getUsers = () => {
    loading();
    axiosApiInstance
      .get("user/users")
      .then((res) => {
        setUserData(res.data.Data);
      })
      .catch((err) => {
        //console.log(err.response);
        msg = "Failed to get Users!";
        open();
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          close();
        }, 3000);
      })
      .finally(() => {
        loadingFinished();
      });
  };

  const postFilter = (isAll = false) => {
    let url = "user/filter?all=" + isAll;
    //console.log("called");
    if (!isAll) {
      if (filterRole) {
        url += "&role=" + filterRole;
      }

      if (search) {
        url = "";
        url = "user/filter?all=false&text=" + search;
      }
    }
    //console.log(url);
    axiosApiInstance.get(url).then((res) => setUserData(res.data.detail));
  };

  useEffect(() => {
    document.title = "Users";
    let _uData = encryptStorage.getItem("UID");
    setroleOption(
      _uData.role === "Superadmin" ? ["Admin", "Operator"] : ["Operator"]
    );
    getUsers();
    // postFilter(true);
  }, []);

  useEffect(() => {
    if (_lData__) {
      if (_lData__.attempts >= 0) {
        if (_lData__.counter === 0) {
          setCounter(0);
        } else {
          setCounter(_lData__.counter);
        }
        setisFloatOpen(true);
        setshowOTPContainer(true);
        setAttempts(_lData__.attempts);
      }
    }
  }, []);

  useEffect(() => {
    let ele = document.querySelector(".addUser");
    if (isFloatOpen) {
      ele.style.animation = "none";
    } else {
      ele.style.animation = " beat 0.5s infinite alternate";
    }
  }, [isFloatOpen]);

  useEffect(() => {
    if (showOTPContainer) {
      if (!_stop) {
        counter > 0 &&
          setTimeout(() => {
            //console.log(counter);
            let _lData = encryptStorage.getItem("VID");
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
          msg = "OTP limit exhausted, Please try again later!";
          open();
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            close();
            resetState();
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
          msg = "OTP limit exhausted, Please try again later!";
          open();
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            close();
            resetState();
          }, 5000);
          // alert("All Attempts done");

          setCounter(0);
          return;
        } else if (lData.counter === 0 && attempts !== 0) {
          //console.log("lData.counter === 1 && attempts !== 0");
          setCounter(0);
          lData.counter = 0;
          otpVal = lData.otp;
        }
        //console.log("SETTING ");

        encryptStorage.setItem("VID", lData);
      } else {
        //console.log("lData not found!");
        resetState();
        // setCounter(time);
        // _stop = false;
        // otpVal = "location.state?.otpVal";
        // encryptStorage.setItem("VID", {
        //   attempts,
        //   otp: "location.state?.otpVal",
        //   counter: time,
        // });
      }
    }
  }, [showOTPContainer]);

  const handleClear = (all) => {
    setfilterRole("");
    // setSearch("");
    postFilter(all);
  };

  return (
    <div className="__users_wrapper__">
      <Navbar
        navName="Users"
        searchValue={search}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        onKeyDown={() => {
          handleClear(false);
        }}
      >
        {isFloatOpen && (
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
            {showAdduser && (
              <div id="add_user" className="detail_container slideInRight">
                <h1>Add User</h1>
                <div
                  className="close"
                  onClick={() => {
                    // setshowAdduser(false);
                    // setisFloatOpen(false);
                    resetState();
                  }}
                >
                  <i className="material-icons" style={{ color: "#fff" }}>
                    close
                  </i>
                </div>
                <div className="_flex_">
                  <div className="cam_details">
                    <InputBox
                      id="fullName"
                      header="Full Name *"
                      // onChange={(e) => setFname(e.target.value)}
                      onChange={(e) => {
                        const value = e.target.value;
                        //console.log(value);
                        const regex = /^[a-zA-Z ]*$/;
                        if (value.match(regex) || value === "") {
                          setFname(value);
                        }
                      }}
                      error={errors["isFNameEmpty"]}
                      value={Fname}
                      onFocus={() => clearError("isFNameEmpty")}
                    />
                    <Dropdown
                      optionsList={roleOption}
                      handleOption={(data) => setRole(data)}
                      defaultText={Role}
                      label="Role *"
                      error={errors["isRoleEmpty"]}
                      id="role"
                      onMouseDown={() => clearError("isRoleEmpty")}
                    />

                    <PhoneInputBox
                      id="mobile_number"
                      isEdit={true}
                      onChange={(data) => {
                        inputNumber = data.inputNumber;
                        let _number = data.countryCode + " " + data.inputNumber;
                        setMobile(_number);
                      }}
                      onFocus={() => clearError("isMobileEmpty")}
                      value={Mobile}
                      error={
                        errors["isMobileEmpty"] || errors["isMobileUnique"]
                      }
                      helperText={errors["isMobileUnique"] && "Already used"}
                    />

                    <InputBox
                      id="username"
                      header="Username *"
                      onChange={(e) => {
                        activeInput = e.target.id;
                        const value = e.target.value;
                        const regex = /^[a-zA-Z0-9]*$/;
                        if (value.match(regex) || value === "") {
                          setUsername(value);
                        }
                      }}
                      error={
                        errors["isUsernameEmpty"] || errors["isUsernameUnique"]
                      }
                      onFocus={() => clearError("isUsernameEmpty")}
                      disabled={!isunique.username}
                      value={Username}
                      helperText={errors["isUsernameUnique"] && "Already used"}
                    />
                    <div style={{ position: "relative", zIndex: 5 }}>
                      <div className="switch_box box_1">
                        <label>Verify</label>
                        <input
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
                        disabled={!isunique.email}
                        onChange={(e) => {
                          activeInput = e.target.id;
                          setEmail(e.target.value);
                        }}
                        error={
                          errors["isEmailEmpty"] || errors["isEmailUnique"]
                        }
                        value={Email}
                        onBlur={() => {
                          setDisableSaveButton(true);
                          emailValidation();
                        }}
                        onFocus={() => clearError("isEmailEmpty")}
                        helperText={errors["isEmailUnique"] && "Already used"}
                      />
                    </div>

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
                        //console.log(value);
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
                          <p
                            className={
                              areSpecialCharacters ? "valid" : "invalid"
                            }
                          >
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
                  </div>
                  <Button
                    style={{ width: "8vw" }}
                    onClick={postData}
                    type="gradient"
                    name="Save"
                    disabled={disableSaveButton}
                  />
                </div>
              </div>
            )}
            {showOTPContainer && (
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
                  {counter !== 0 && (
                    <p className="_counter">{counter} seconds</p>
                  )}
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
                  onClick={postOTP}
                  name="Submit"
                />
              </div>
            )}
          </motion.div>
        )}
        <ReactTooltip delayShow={200} />
        <div
          data-tip="Add User"
          className="addUser"
          onClick={() => {
            encryptStorage.removeItem("VID");
            setisFloatOpen(!isFloatOpen);
            setTimeout(() => {
              setshowAdduser(true);
            }, 200);
          }}
        >
          <i className="material-icons" id="fabIcon">
            add
          </i>
        </div>
        <div style={{ display: "flex" }}>
          <div className="_setting_list_">
            <div className="fixed_activity">
              <h2 className="title_">Filters</h2>
              <Dropdown
                className="adjust_dd"
                optionsList={filterRoleOptions()}
                handleOption={(data) => {
                  setfilterRole(data);
                }}
                defaultText={filterRole}
                label="User Role"
              />
              <div style={{ marginTop: "2vw" }}>
                <Button
                  style={{ width: "7vw" }}
                  name="Apply"
                  onClick={() => postFilter(false)}
                  disabled={filterRole.length === 0}
                />
                <Button
                  style={{ width: "7vw" }}
                  onClick={() => handleClear(true)}
                  type="gradient"
                  name="Clear"
                  // onClick={() => history.push("/alerts")}
                  // disabled={isLoading}
                />
              </div>
              {/* <motion.ul
                variants={container}
                exit="exit"
                initial="hidden"
                animate="visible"
              >
                {userList.map((items) => (
                  <motion.li
                    className={items === activeDevice && "active_stage"}
                    variants={item}
                    key={items}
                    onClick={() => setActiveDevice(items)}
                  >
                    {items}
                  </motion.li>
                ))}
              </motion.ul> */}
            </div>
          </div>

          <div className="_grid_">
            <motion.div
              variants={xMotion}
              exit="exit"
              initial="hidden"
              animate="visible"
              className="_user_setting_"
            >
              {isLoading ? (
                <SkeletonCard />
              ) : (
                userData.map((item) => (
                  <UserCard
                    key={item.Username}
                    name={item.FullName}
                    role={item.Role}
                    {...item}
                    reload={() => getUsers()}
                    loadModal={() => {
                      let _lDATA = encryptStorage.getItem("VID2");
                      if (_lDATA) {
                        if (_lDATA.userData.Username === item.Username) {
                          return true;
                        } else return false;
                      } else {
                        return false;
                      }
                    }}
                  />
                ))
              )}
            </motion.div>
          </div>
        </div>
      </Navbar>
      {modalOpen && (
        <Modal
          className="transparent_modal"
          handleClose={() => {
            close();
          }}
          type={errortype ? errortype : "alert"}
          errorHeader={errortype === "success" ? "Success" : "Error"}
          errorText={msg}
        />
      )}
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
      {_isLoading && <Loading type={"transparent"} text={"Loading"} />}
    </div>
  );
}

const UserCard = ({ name, role, reload, loadModal, ...item }) => {
  let _email = item.Email;
  // let otpVal = null;
  const [isOpen, setisOpen] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [modalType, setmodalType] = useState("alert");
  const [isDeleting, setisDeleting] = useState("");
  const { modalOpen, close, open } = useModal();
  const [isConfirm, setIsConfirm] = useState(false);
  const [disableSaveButton, setdisableSaveButton] = useState(false);
  const myRef = useRef();
  const [showPassErrorModal, setshowPassErrorModal] = useState({
    isPasswordMatch: false,
    showPop: false,
  });
  const [attempts, setAttempts] = useState(2);
  const [filterRoleOptions, setFilterRoleOptions] = useState([
    "Superadmin",
    "Admin",
    "Operator",
  ]);
  const [_isLoading, set_isLoading] = useState(false);

  const [counter, setCounter] = useState(_lData__2 ? _lData__2.counter : time);
  const [MobileNoLength, setMobileNoLength] = useState(12);
  const [showPassContainer, setShowPassContainer] = useState(false);
  const [showDetailContainer, setshowDetailContainer] = useState(false);
  const [showOTPContainer, setshowOTPContainer] = useState(false);

  const [Fname, setFname] = useState("");
  const [Email, setEmail] = useState("");
  const [Mobile, setMobile] = useState("");
  const [Role, setRole] = useState("");
  const [Username, setUsername] = useState("");
  const [Password, setPassword] = useState("");
  const [isPasswordEmpty, setisPasswordEmpty] = useState(false);
  const [currentUser, setcurrentUser] = useState("");

  const [otp1, setOtp1] = useState("");
  const [otp2, setOtp2] = useState("");
  const [otp3, setOtp3] = useState("");
  const [otp4, setOtp4] = useState("");
  const [otp5, setOtp5] = useState("");
  const [otp6, setOtp6] = useState("");

  const [oldType, setOldType] = useState("password");
  const [errors, setErrors] = useState({
    isFNameEmpty: false,
    isEmailEmpty: false,
    isUsernameEmpty: false,
    isMobileEmpty: false,
    isUsernameUnique: false,
    isMobileUnique: false,
    isEmailUnique: false,
  });
  useDebouncedEffect(
    () => (Email || Mobile || Username ? uniqueCheck() : undefined),
    [Email, Mobile, Username],
    1000
  );

  const uniqueCheck = async () => {
    if (!showDetailContainer) return;
    //console.log("uniqueCheck: " + activeInput);
    if (activeInput === "mobile") {
      if (item.Phone === Mobile) {
        setErrors((prevState) => ({
          ...prevState,
          isMobileUnique: false,
        }));

        return;
      }
    }
    if (activeInput === "email") {
      if (item.Email === Email) {
        setErrors((prevState) => ({
          ...prevState,
          isEmailUnique: false,
        }));
        return;
      }
    }
    if (activeInput === "username") {
      if (item.Username === Username) {
        setErrors((prevState) => ({
          ...prevState,
          isUsernameUnique: false,
        }));
        return;
      }
    }

    let obj = {};
    let _err = { ...errors };
    if (activeInput === "username") obj.Username = Username;
    if (activeInput === "email") obj.Email = Email;
    if (activeInput === "mobile") obj.Phone = Mobile;
    setdisableSaveButton(true);
    axiosApiInstance
      .post("user/duplicate", obj)
      .then((res) => {
        setdisableSaveButton(false);
        //console.log(res);
        if (activeInput === "mobile") {
          isunique.username = true;
          _err.isMobileUnique = false;
        }
        if (activeInput === "username") {
          isunique.email = true;
          _err.isUsernameUnique = false;
        }

        if (activeInput === "email") {
          _err.isEmailUnique = false;
        }
        setErrors({ ..._err });
      })
      .catch((err) => {
        //console.log(err.response);
        setdisableSaveButton(false);
        if (err.response.status === 409) {
          if (err.response.data.detail.includes("email")) {
            if (activeInput === "email") {
              _err.isEmailUnique = true;
            }
            //console.log("EMAIL IS NOT VALID");
          }
          if (err.response.data.detail.includes("username")) {
            //console.log("username IS NOT VALID");
            if (activeInput === "username") {
              _err.isUsernameUnique = true;
            }
          }
          if (err.response.data.detail.includes("phone")) {
            //console.log("phone IS NOT VALID");
            if (activeInput === "mobile") {
              _err.isMobileUnique = true;
            }
          }
        }
        setErrors({ ..._err });
      });
    //console.log(_err);
  };
  const handlePassword = (type) => {
    if (!type) {
      setOldType("password");
    } else {
      setOldType("text");
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
    setdisableSaveButton(false);
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

  const clearError = (name) => {
    let _errors = { ...errors };
    _errors[name] = false;
    setErrors({ ..._errors });
  };

  const handleClickOutside = (e) => {
    if (
      !e.target.classList.contains("btnn") &&
      !e.target.classList.contains("dot_icon_active") &&
      !e.target.classList.contains("floating_menu")
    ) {
      //console.log("OUTSIDE");
      setisOpen(false);
      var ele = document.querySelector(".floating_menu");
      if (ele) {
        ele?.classList.add("exit_float_menu");
        setTimeout(() => {
          setisOpen(false);
          ele?.classList.remove("exit_float_menu");
        }, 200);
      }
    }
  };

  const deleteUser = () => {
    axiosApiInstance
      .delete("user/delete?Username=" + item.Username)
      .then((res) => {
        setErrorMsg("User Deleted Successfully!");
        setmodalType("success");
        close();
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
        }));
        setisDeleting(false);
        resetState();
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          reload();
          setshowPassErrorModal((prevState) => ({
            ...prevState,
            showPop: false,
          }));
          setmodalType("");
          setErrorMsg("");
        }, 3000);
      })
      .catch((err) => {
        set_isLoading(false);
        setErrorMsg("Failed to delete user!");
        setmodalType("Error");
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
        }));
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          setshowPassErrorModal((prevState) => ({
            ...prevState,
            showPop: false,
          }));
          setmodalType("");
          setErrorMsg("");
        }, 3000);
        //console.log(err);
      });
  };
  const postPassword = () => {
    if (Password === "") {
      setisPasswordEmpty(true);
      return;
    }
    set_isLoading(true);
    axiosApiInstance
      .post("user/verify-password", {
        Password,
      })
      .then((res) => {
        if (res.status === 200) {
          set_isLoading(false);
          //console.log(isDeleting);
          if (isDeleting) {
            deleteUser();
          } else {
            var ele = document.querySelector("#p_container");
            ele.classList.add("slideOutLeft");
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              setFname(item.FullName);
              setMobile(item.Phone);
              setUsername(item.Username);
              setEmail(item.Email);
              setRole(item.Role);
              _email = item.Email;
              setShowPassContainer(false);
              setshowDetailContainer(true);
              ele.classList.remove("slideOutLeft");
            }, 500);
          }
        }

        //console.log(res);
      })
      .catch((err) => {
        set_isLoading(false);
        setErrorMsg("Password did not matched!");
        //not matched
        setmodalType("alert");
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          isPasswordMatch: false,
        }));
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          setshowPassErrorModal((prevState) => ({
            ...prevState,
            showPop: false,
            isPasswordMatch: false,
          }));
          setmodalType("");
          setErrorMsg("");
        }, 2500);
      })
      .finally(() => {
        // set_isLoading(false);
      });
  };

  const resetState = () => {
    //console.log("resetState");
    setShowPassContainer(false);
    setshowDetailContainer(false);
    setshowOTPContainer(false);
    setPassword("");
    setisPasswordEmpty(false);
    close();
    setFname(item.FullName);
    setMobile(item.Phone);
    setUsername(item.Username);
    setEmail(item.Email);
    setRole(item.Role);
    setErrors({
      isFNameEmpty: false,
      isEmailEmpty: false,
      isUsernameEmpty: false,
      isMobileEmpty: false,
      isUsernameUnique: false,
      isMobileUnique: false,
      isEmailUnique: false,
    });
    encryptStorage.removeItem("VID2");
  };

  const putProfileData = (userData) => {
    set_isLoading(true);
    axiosApiInstance
      .put("user/update", userData)
      .then((res) => {
        if (res.status === 200) {
          setErrorMsg("Profile Updated Successfully!");
          //not matched
          reload();
          close();
          resetState();
          setmodalType("success");
          setshowPassErrorModal((prevState) => ({
            ...prevState,
            showPop: true,
          }));
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            setshowPassErrorModal((prevState) => ({
              ...prevState,
              showPop: false,
            }));
            setmodalType("alert");
            setErrorMsg("");
          }, 3000);
        }
      })
      .catch((err) => {
        //console.log(err);
        setErrorMsg("Failed to update profile!");
        //not matched
        setmodalType("alert");
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
        }));
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          setshowPassErrorModal((prevState) => ({
            ...prevState,
            showPop: false,
          }));
          setmodalType("");
          setErrorMsg("");
        }, 4000);
      })
      .finally(() => {
        set_isLoading(false);
      });
  };

  const postData = (otp) => {
    let _errors = { ...errors };
    if (Fname === "") _errors["isFNameEmpty"] = true;
    if (Email === "") _errors["isEmailEmpty"] = true;
    if (Username === "") _errors["isUsernameEmpty"] = true;
    // if (Mobile === "" || Mobile.length !== MobileNoLength)
    if (inputNumber2 === "") _errors["isMobileEmpty"] = true;
    console.log(inputNumber2);
    setErrors({ ..._errors });
    if (Object.values(_errors).includes(true)) {
      return;
    }
    let obj = {
      FullName: Fname,
      Username: Username,
      Email: Email,
      Phone: Mobile,
      Role: role,
      EmailVerified: true,
    };
    if (Email !== _email) {
      otpVal = Math.floor(Math.random() * 899999 + 100000);
      set_isLoading(true);
      axiosApiInstance
        .post("user/otp?userVerify=true", {
          destination: Email,
          username: Username,
          otp: otpVal.toString(),
          interval: "3",
        })
        .then((res) => {
          var ele = document.querySelector("#d_container");
          ele.classList.add("slideOutLeft");
          setTimeout(() => {
            setshowDetailContainer(false);
            setshowOTPContainer(true);
            ele.classList.remove("slideOutLeft");
          }, 500);
          obj.EmailVerified = true;
          //console.log("SETTING ");
          encryptStorage.setItem("VID2", {
            attempts: 2,
            otp: otpVal,
            counter: time,
            destination: Email,
            userData: obj,
          });
        })
        .catch((err) => {
          setErrorMsg("OTP limit exhausted. Please try later!");
          setshowPassErrorModal((prevState) => ({
            ...prevState,
            showPop: true,
          }));
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            setErrorMsg("");
            setshowPassErrorModal((prevState) => ({
              ...prevState,
              showPop: false,
            }));

            // close();
            resetState();
          }, 5000);
          return;
        })
        .finally(() => {
          set_isLoading(false);
        });
    } else {
      putProfileData(obj);
    }
  };

  const postOTP = () => {
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
      let userData = encryptStorage.getItem("VID2");
      _stop = true;
      setCounter(0);
      putProfileData(userData.userData);
      // let _uData = encryptStorage.getItem("VID");
      // axiosApiInstance.post("user/create", _uData.userData).then((res) => {
      //   if (res.status === 200) {
      //     encryptStorage.removeItem("VID");
      //     getUsers();
      //     resetState();
      //   }
      // });
    } else {
      _stop = false;
      setmodalType("alert");
      setErrorMsg("Invalid OTP, Please try again!");
      setshowPassErrorModal((prevState) => ({
        ...prevState,
        showPop: true,
      }));
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: false,
        }));
      }, 3000);
    }
  };

  const postResendOTP = () => {
    let _lData = encryptStorage.getItem("VID2");

    if (attempts === 0) {
      setErrorMsg("No More attempts left Please try later!");
      setshowPassErrorModal((prevState) => ({
        ...prevState,
        showPop: true,
      }));
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setErrorMsg("");
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: false,
        }));

        // close();
        resetState();
      }, 5000);
      return;
    }
    otpVal = Math.floor(Math.random() * 899999 + 100000);
    set_isLoading(true);
    axiosApiInstance
      .post("user/otp?userVerify=true", {
        destination: _lData.userData.Email,
        otp: otpVal.toString(),
        interval: "3",
        uername: _lData.userData.Username,
      })
      .then((res) => {
        setAttempts(attempts - 1);
        setCounter(time);
        //console.log(otpVal);
        _lData.otp = otpVal;
        _lData.attempts = attempts - 1;
        encryptStorage.setItem("VID2", _lData);
      })
      .catch((err) => {
        if (err.response.status === 406) {
          //console.log("406");
        } else {
          setErrorMsg("OTP limit exhausted, Please try again later!");
          setshowPassErrorModal((prevState) => ({
            ...prevState,
            showPop: true,
          }));
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            setshowPassErrorModal((prevState) => ({
              ...prevState,
              showPop: false,
            }));
            resetState();
          }, 5000);
        }
        //console.log(err.response);
      })
      .finally(() => {
        set_isLoading(false);
      });
  };

  useEffect(() => {
    let _uData = encryptStorage.getItem("UID");
    //console.log(_uData);
    setcurrentUser(_uData.role);
    let _option = [...filterRoleOptions];
    // let result = _option.filter((item) => {
    //   return item !== _uData.role;
    // });
    // //console.log(result);
    // setFilterRoleOptions(result);

    if (_uData.role === "Admin") {
      //console.log("insinde");
      let roleList = ["Admin", "Operator"];
      //console.log(roleList);
      setFilterRoleOptions([...roleList]);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (item) {
      //console.log("CALLED");
      setFname(item.FullName);
      setMobile(item.Phone);
      setUsername(item.Username);
      setEmail(item.Email);
      setRole(item.Role);
      _email = item.Email;
    }
  }, []);

  useEffect(() => {
    if (loadModal()) {
      if (_lData__2) {
        if (_lData__2.attempts >= 0) {
          if (_lData__2.counter === 0) {
            setCounter(0);
          } else {
            setCounter(_lData__2.counter);
          }
          open();
          setshowOTPContainer(true);
          setAttempts(_lData__2.attempts);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (loadModal()) {
      if (showOTPContainer) {
        if (!_stop) {
          counter > 0 &&
            setTimeout(() => {
              //console.log(counter);
              let _lData = encryptStorage.getItem("VID2");
              //console.log(_lData);
              if (_lData) {
                _lData.counter = counter - 1;
              }
              if (_lData) {
                encryptStorage.setItem("VID2", _lData);
              }
              setCounter(counter - 1);
            }, 1000);
          if (attempts === 0 && counter === 0) {
            setErrorMsg("OTP limit exhausted, Please try again later!");
            setshowPassErrorModal((prevState) => ({
              ...prevState,
              showPop: true,
            }));
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              setErrorMsg("");
              setshowPassErrorModal((prevState) => ({
                ...prevState,
                showPop: false,
              }));
              resetState();
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
      }
    }
  }, [counter]);

  useEffect(() => {
    if (loadModal()) {
      if (showOTPContainer) {
        let lData = encryptStorage.getItem("VID2");
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
            setCounter(0);
            //console.log("lData.attempts === 0");
            setErrorMsg("OTP limit exhausted, Please try again later!");
            setshowPassErrorModal((prevState) => ({
              ...prevState,
              showPop: true,
            }));
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              setErrorMsg("");
              setshowPassErrorModal((prevState) => ({
                ...prevState,
                showPop: false,
              }));
              resetState();
            }, 5000);

            return;
          } else if (lData.counter === 0 && attempts !== 0) {
            //console.log("lData.counter === 1 && attempts !== 0");
            setCounter(0);
            lData.counter = 0;
            otpVal = lData.otp;
          }
          //console.log("SETTING ");

          encryptStorage.setItem("VID2", lData);
        } else {
          //console.log("lData not found!");
          resetState();
          // setCounter(time);
          // _stop = false;
          // otpVal = "location.state?.otpVal";
          // encryptStorage.setItem("VID", {
          //   attempts,
          //   otp: "location.state?.otpVal",
          //   counter: time,
          // });
        }
      }
    }
  }, [showOTPContainer]);

  const getUserActivity = () => {
    axiosApiInstance
      .get("user/log/activity?Username=" + item.Username)
      .then((res) => {
        exportToCsv(res.data.Data);
      });
  };

  const downloadFile = ({ data, fileName, fileType }) => {
    const blob = new Blob([data], { type: fileType });

    const a = document.createElement("a");
    a.download = fileName;
    a.href = window.URL.createObjectURL(blob);
    const clickEvt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    a.dispatchEvent(clickEvt);
    a.remove();
  };

  const exportToCsv = (_data) => {
    // Headers for each column
    let headers = ["Username,Action,Activity_result,Date,Time,LastModified"];

    // Convert users data to a csv
    let usersCsv = _data.reduce((acc, user) => {
      const { Username, Action, Activity_result, Date, Time, LastModified } =
        user;
      acc.push(
        [Username, Action, Activity_result, Date, Time, LastModified].join(",")
      );
      return acc;
    }, []);
    //console.log(usersCsv);
    downloadFile({
      data: [...headers, ...usersCsv].join("\n"),
      fileName: item.FullName + "_activity.csv",
      fileType: "text/csv",
    });
  };

  return (
    <div ref={myRef}>
      <BoxCard className={"usercard"}>
        <i className="material-icons person">person</i>
        <div>
          <h1>{name}</h1>
          <h3>{role}</h3>
        </div>

        <div />
        <img
          src={dots}
          onClick={() =>
            setTimeout(() => {
              setisOpen(!isOpen);
            }, 200)
          }
          className="dots"
        />
        {isOpen && (
          <motion.div
            initial={{
              width: 0,
              height: 0,
            }}
            animate={{
              width: "10.4166666667vw",
              height: "auto",
            }}
            transition={{ duration: 0.2 }}
            className="floating_menu"
          >
            <button
              className="btnn"
              onClick={() => {
                open();
                setisOpen(false);
                setShowPassContainer(true);
              }}
            >
              Edit Details
            </button>

            {currentUser !== role && role !== "Superadmin" && (
              <button
                className="btnn"
                onClick={() => {
                  open();
                  setisOpen(false);
                  setShowPassContainer(true);
                  setisDeleting(true);
                }}
              >
                Delete
              </button>
            )}
            <button
              className="btnn"
              onClick={() => {
                getUserActivity();
                setisOpen(false);
              }}
            >
              Download Logs
            </button>
            <img
              src={dots}
              className="dot_icon_active"
              onClick={() => {
                var ele = document.querySelector(".floating_menu");
                ele.classList.add("exit_float_menu");

                setTimeout(() => {
                  setisOpen(false);
                  ele.classList.remove("exit_float_menu");
                }, 200);
              }}
            />
          </motion.div>
        )}
        {modalOpen && (
          <div className="user_auth_modal">
            {showPassContainer && (
              <div className="pass_container" id="p_container">
                <h1>Confirm access</h1>
                <i
                  className="material-icons close_icon"
                  onClick={() => {
                    setShowPassContainer(false);
                    setshowDetailContainer(false);
                    close();
                    resetState();
                  }}
                >
                  close
                </i>
                <InputBox
                  id="password"
                  error={isPasswordEmpty}
                  type={oldType}
                  typeValue={(data) => handlePassword(data)}
                  password
                  header="Enter Password *"
                  onChange={(e) => setPassword(e.target.value)}
                  value={Password}
                  onFocus={() => setisPasswordEmpty(false)}
                  onBlur={() => {
                    if (Password === "") {
                      setisPasswordEmpty(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.keyCode === 13) {
                      postPassword();
                    }
                  }}
                />

                <Button
                  style={{ width: "5vw" }}
                  type={"gradient"}
                  onClick={postPassword}
                  name="Submit"
                />
              </div>
            )}

            {showDetailContainer && (
              <div id="d_container" className="detail_container slideInRight">
                <h1>Edit Detail</h1>
                <div
                  className="close"
                  onClick={() => {
                    close();
                    setshowDetailContainer(false);
                    resetState();
                  }}
                >
                  <i className="material-icons" style={{ color: "#fff" }}>
                    close
                  </i>
                </div>
                <div className="_flex_">
                  <div className="cam_details">
                    <InputBox
                      id="fullName"
                      header="Full Name *"
                      // onChange={(e) => setFname(e.target.value)}
                      onChange={(e) => {
                        const value = e.target.value;
                        const regex = /^[a-zA-Z ]*$/;
                        if (value.match(regex) || value === "") {
                          setFname(value);
                        }
                      }}
                      error={errors["isFNameEmpty"]}
                      value={Fname}
                      onFocus={() => clearError("isFNameEmpty")}
                    />
                    <PhoneInputBox
                      id="mobile"
                      isEdit={true}
                      onChange={(data) => {
                        // if (data.inputNumber) {
                        inputNumber2 = data.inputNumber;
                        let _number = data.countryCode + " " + data.inputNumber;
                        setMobile(_number);
                        // }
                      }}
                      onFocus={() => clearError("isMobileEmpty")}
                      value={Mobile}
                      error={
                        errors["isMobileEmpty"] || errors["isMobileUnique"]
                      }
                      helperText={errors["isMobileUnique"] && "Already used"}
                    />
                    {currentUser !== role ? (
                      <Dropdown
                        optionsList={filterRoleOptions}
                        handleOption={(data) => setRole(data)}
                        defaultText={Role}
                        label="Role *"
                        error={errors["isRoleEmpty"]}
                        id="role"
                        onMouseDown={() => clearError("isRoleEmpty")}
                      />
                    ) : (
                      <InputBox
                        id="role"
                        header="Role"
                        disabled
                        //   onChange={(e) => setUsername(e.target.value)}
                        //   error={errors["isUsernameEmpty"]}
                        value={item.Role}
                        //   onFocus={() => clearError("isUsernameEmpty")}
                      />
                    )}

                    <InputBox
                      id="username"
                      header="Username *"
                      disabled
                      // onChange={(e) => {
                      //   activeInput = e.target.id;
                      //   const value = e.target.value;
                      //   const regex = /^[a-zA-Z0-9]*$/;
                      //   if (value.match(regex) || value === "") {
                      //     setUsername(value);
                      //   }
                      // }}
                      error={
                        errors["isUsernameEmpty"] || errors["isUsernameUnique"]
                      }
                      // disabled={!isunique.username}
                      value={Username}
                      helperText={errors["isUsernameUnique"] && "Already used"}
                    />
                    <InputBox
                      id="email"
                      header="Email *"
                      onChange={(e) => {
                        activeInput = e.target.id;
                        setEmail(e.target.value);
                        setdisableSaveButton(true);
                      }}
                      error={errors["isEmailEmpty"] || errors["isEmailUnique"]}
                      value={Email}
                      onBlur={emailValidation}
                      // onFocus={() => clearError("isEmailEmpty")}
                      helperText={errors["isEmailUnique"] && "Already used"}
                    />
                    {/* <img src={Logo} className="snap" /> */}
                  </div>
                  <Button
                    style={{ width: "8vw" }}
                    onClick={postData}
                    type="gradient"
                    name="Save"
                    disabled={disableSaveButton}
                  />
                </div>
              </div>
            )}

            {showOTPContainer && (
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
                      onPaste={(e) => e.preventDefault()}
                      onFocus={() => onFocusEvent(6)}
                    />
                  </div>
                  {counter !== 0 && (
                    <p className="_counter">{counter} seconds</p>
                  )}
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
                  onClick={postOTP}
                  name="Submit"
                />
              </div>
            )}
          </div>
        )}
        {/* {modalOpen && (
        <Modal
          className="transparent_modal"
          handleClose={() => {
            close();
          }}
          type="alert"
          errorHeader="Error"
          errorText={msg}
        />
      )} */}

        {showPassErrorModal.showPop && (
          <Modal
            className={"pop_adjust"}
            handleClose={() => {
              setshowPassErrorModal((prevState) => ({
                ...prevState,
                showPop: false,
              }));
            }}
            type={modalType}
            errorHeader={
              modalType === "alert" || modalType === "Error"
                ? "Error"
                : "Success"
            }
            errorText={errorMsg}
          />
        )}
        {isConfirm && (
          <Modal
            onConfirm={() => {
              resetState();
              setshowOTPContainer(false);
              // resetState
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
      </BoxCard>
      {_isLoading && <Loading type={"transparent"} text={"Loading"} />}
    </div>
  );
};

const SkeletonCard = () => {
  return (
    <div className="skeleton skeleton--card">
      <div className="skeleton--content">
        <div className="skeleton--content-wrapper">
          <div className="s_loader skeleton--title"></div>
        </div>
        <div className="skeleton--content-wrapper2">
          <div className="s_loader skeleton--line"></div>
          <div className="s_loader skeleton--line"></div>
          <div className="s_loader skeleton--line"></div>
        </div>
      </div>
    </div>
  );
};
