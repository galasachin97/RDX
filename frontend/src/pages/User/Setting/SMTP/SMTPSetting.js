import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import Button from "../../../../components/Button/Button";
import { BoxCard } from "../../../../components/card/Card";
import Dropdown from "../../../../components/Dropdown/Dropdown";
import InputBox from "../../../../components/Inputbox/InputBox";
import SwitchBox from "../../../../components/SwitchBox/SwitchBox";
import { xMotion } from "../../../../helper/motions";
import { axiosApiInstance } from "../../../../helper/request";
import PasswordVerification from "../../../../components/PasswordVerification/PasswordVerification";
import useModal from "../../../../helper/useModal";
import Modal from "../../../../components/Modal/Modal";
import "./smtp.scss";
import Loading from "../../../../components/Loading/Loading";

let msg = "";
let type = "success";
let timeout = "";

export default function SMTPSetting() {
  const [showLoading, setshowLoading] = useState(false);
  const [oldType, setOldType] = useState("password");
  const [oldType2, setOldType2] = useState("password");
  const [errors, setErrors] = useState({
    isNameEmpty: false,
    isPortEmpty: false,
    isServerEmpty: false,
    isUsernameEmpty: false,
    isEmailEmpty: false,
    isPasswordEmpty: false,
    isCPasswordEmpty: false,
  });

  const [Name, setName] = useState(null);
  const [Port, setPort] = useState(null);
  const [selectedServer, setselectedServer] = useState(null);
  const [Username, setUsername] = useState(null);
  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [ConfirmPassword, setConfirmPassword] = useState("");
  const [showPassContainer, setShowPassContainer] = useState(false);
  const { modalOpen, close, open } = useModal();
  const [adminPassword, setAdminPassword] = useState(null);

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

  const postData = () => {
    let _errors = { ...errors };
    if (!Name) _errors["isNameEmpty"] = true;
    if (!Port) _errors["isPortEmpty"] = true;
    if (!selectedServer) _errors["isServerEmpty"] = true;
    if (!Username) _errors["isUsernameEmpty"] = true;
    if (!Email) _errors["isEmailEmpty"] = true;
    if (!Password) _errors["isPasswordEmpty"] = true;
    // if (!ConfirmPassword) _errors["isCPasswordEmpty"] = true;
    // if (Password !== ConfirmPassword) {
    //   _errors["isPasswordEmpty"] = true;
    //   _errors["isCPasswordEmpty"] = true;
    // }
    // if (Password && ConfirmPassword && Password === ConfirmPassword) {
    //   _errors["isPasswordEmpty"] = false;
    //   _errors["isCPasswordEmpty"] = false;
    // }
    setErrors({ ..._errors });
    if (Object.values(_errors).includes(true)) {
      return;
    }

    let data = {
      Smtp_ssl: true,
      Smtp_port: Port,
      Smtp_host: selectedServer,
      Smtp_user: Username,
      Smtp_password: Password,
      Emails_from_email: Email,
      Emails_from_name: Name,
    };
    setshowLoading(true);
    axiosApiInstance
      .post("base/smtp", data)
      .then((res) => {
        //console.log(res.data);
        msg = "Details successfully updated!";
        type = "success";
        setShowPassContainer(false);
        open();
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          close();
          setPassword("");
          setConfirmPassword("");
          getSMTPSettings();
        }, 5000);
      })
      .catch((err) => {
        //console.log(err.response.data.detail);
        msg = err.response.data.detail;
        type = "alert";
        open();
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          close();
          setPassword("");
          setConfirmPassword("");
        }, 5000);
      })
      .finally(() => {
        setshowLoading(false);
      });
  };

  const getSMTPSettings = () => {
    axiosApiInstance
      .get("base/smtp")
      .then((res) => {
        //console.log(res.data);
        res.data?.Smtp_port && setPort(res.data.Smtp_port);
        res.data?.Smtp_host && setselectedServer(res.data.Smtp_host);
        res.data?.Smtp_user && setUsername(res.data.Smtp_user);
        res.data?.Emails_from_email && setEmail(res.data.Emails_from_email);
        res.data?.Emails_from_name && setName(res.data.Emails_from_name);
      })
      .catch((err) => {
        //console.log(err.response);
      });
  };

  const setDefaultValues = () => {
    setshowLoading(true);
    axiosApiInstance
      .delete("base/smtp")
      .then((res) => {
        type = "success";
        msg = "Details successfully updated!";
        open();
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          close();
          setPort("");
          setselectedServer("");
          setUsername("");
          setEmail("");
          setName("");
          setShowPassContainer(false);
          setAdminPassword("");
        }, 5000);
      })
      .catch((err) => {
        //console.log(err.response);
        type = "alert";
        msg = "Something went wrong!";
        open();
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          close();
        }, 5000);
      })
      .finally(() => {
        setshowLoading(false);
      });
  };

  const postPassword = () => {
    if (adminPassword === "") {
      return;
    }
    axiosApiInstance
      .post("user/verify-password", {
        Password: adminPassword,
      })
      .then((res) => {
        if (res.status === 200) {
          setShowPassContainer(false);
          setDefaultValues();
          setAdminPassword("");
        }
      })
      .catch((err) => {
        type = "alert";
        msg = "Invalid Password!";
        setAdminPassword("");
        open();
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          close();
        }, 3000);
        //console.log(err.response);
      });
  };

  useEffect(() => {
    getSMTPSettings();
  }, []);

  return (
    <motion.div
      variants={xMotion}
      exit="exit"
      initial="hidden"
      animate="visible"
      className="_smtp_setting_"
    >
      <BoxCard className="card_size">
        <InputBox
          id="name"
          header="Your Name"
          onChange={(e) => setName(e.target.value)}
          error={errors["isNameEmpty"]}
          value={Name}
          onFocus={() => clearError("isNameEmpty")}
        />
        <InputBox
          id="port"
          header="Port"
          onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ""))}
          error={errors["isPortEmpty"]}
          value={Port}
          onFocus={() => clearError("isPortEmpty")}
        />
        <InputBox
          id="Outgoing"
          onChange={(e) => setselectedServer(e.target.value)}
          value={selectedServer}
          error={errors["isServerEmpty"]}
          header="Outgoing Server"
          onFocus={() => clearError("isServerEmpty")}
        />
        <InputBox
          id="username"
          header="Username"
          onChange={(e) => {
            const value = e.target.value;
            const regex = /^[a-zA-Z0-9@.]*$/;
            if (value.match(regex) || value === "") {
              setUsername(value);
            }
          }}
          error={errors["isUsernameEmpty"]}
          value={Username}
          onFocus={() => clearError("isUsernameEmpty")}
        />
        <InputBox
          id="email"
          header="From Email"
          onChange={(e) => setEmail(e.target.value)}
          error={errors["isEmailEmpty"]}
          value={Email}
          onBlur={emailValidation}
          onFocus={() => clearError("isEmailEmpty")}
        />

        <InputBox
          id="password"
          //   onInput={(e) => checkPassword(e.target.value)}
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
          onFocus={() => clearError("isPasswordEmpty")}
          value={Password}
          // onBlur={() => {
          //   setDropdown(false);
          // }}
        />
        {/* <InputBox
          id="password2"
          error={errors["isCPasswordEmpty"]}
          type={oldType2}
          value={ConfirmPassword}
          typeValue={(data) => handleConfirmPassword(data)}
          password
          header="Confirm Password *"
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          onKeyDown={(e) => {
            if (e.keyCode === 13) {
              postData();
            }
          }}
        /> */}

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
            onClick={setShowPassContainer}
          />
          <Button
            style={{ width: "8vw" }}
            onClick={postData}
            type="gradient"
            name="Save"
          />
        </div>
      </BoxCard>
      {showPassContainer && (
        <PasswordVerification
          close={() => setShowPassContainer(false)}
          postPassword={postPassword}
          password={adminPassword}
          setPassword={setAdminPassword}
        />
      )}
      {modalOpen && (
        <Modal
          className="transparent_modal"
          handleClose={() => {
            close();
          }}
          type={type ? type : "alert"}
          errorHeader="Success"
          errorText={msg}
        />
      )}
      {showLoading && <Loading type={"transparent"} text={"Loading"} />}
    </motion.div>
  );
}
