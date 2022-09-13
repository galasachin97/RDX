import React, { useState, useEffect } from "react";
import Button from "../../../components/Button/Button";
import FormCard from "../../../components/FormCard/FormCard";
import InputBox from "../../../components/Inputbox/InputBox";
import "./login.scss";
import { motion } from "framer-motion";
import { container, item } from "../../../helper/motions";
import { Link, useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../../helper/request";
import Loading from "../../../components/Loading/Loading";
import { encryptStorage } from "../../../helper/storage";
import useModal from "../../../helper/useModal";
import Modal from "../../../components/Modal/Modal";

export default function AuthLogin() {
  let history = useHistory();
  const location = useLocation();
  const [Username, setUsername] = useState("");
  const [Password, setPassword] = useState("");
  const [isLoading, setisLoading] = useState(true);
  const [errors, setErrors] = useState({
    isUsernameEmpty: false,
    isPasswordEmpty: false,
  });
  const { modalOpen, close, open } = useModal();
  const [loadingScreen, setLoadingScreen] = useState(false);

  const [oldType, setOldType] = useState("password");
  const handlePassword = (type) => {
    if (!type) {
      setOldType("password");
    } else {
      setOldType("text");
    }
  };

  const clearError = (name) => {
    let _errors = { ...errors };
    _errors[name] = false;
    setErrors({ ..._errors });
  };

  const postData = () => {
    let _errors = { ...errors };
    if (Username === "") _errors["isUsernameEmpty"] = true;
    if (Password === "") _errors["isPasswordEmpty"] = true;
    setErrors({ ..._errors });
    if (Object.values(_errors).includes(true)) {
      return;
    }
    setLoadingScreen(true);
    axios
      .post(
        API_URL + "user/login",
        {},
        {
          headers: {
            username: Username,
            password: Password,
          },
        }
      )
      .then((res) => {
        // getSound(res);
        getJetpack(res);
      })
      .catch((err) => {
        setLoadingScreen(false);
        open();
        setTimeout(() => {
          close();
        }, 4000);
      });
  };

  const getJetpack = (res) => {
    let _data = { ...res };
    axios
      .get(API_URL + "host/jetpack/info")
      .then((res) => {
        console.log(res.data);
        if (res.data?.version) {
          _data.data.layout = false;
        } else {
          _data.data.layout = true;
        }
        console.log(_data);
        getSound(_data);
      })
      .catch(() => {});
  };

  const getSound = (res) => {
    let _data = { ...res };
    axios
      .get(API_URL + "host/notification/sound")
      .then((ress) => {
        encryptStorage.removeItem("VID");
        encryptStorage.removeItem("VID2");
        _data.data.notificationSound = ress.data.detail.notificationSound;
        console.log(_data.data);
        encryptStorage.setItem("UID", _data.data);
        localStorage.removeItem("type");
        localStorage.setItem("accessToken", _data.data.access_token);
        localStorage.setItem("showAnimation", true);
        localStorage.setItem("refreshToken", _data.data.refresh_token);
        history.replace("/home");
      })
      .catch((err) => {
        _data.data.notificationSound = true;
        encryptStorage.removeItem("VID");
        encryptStorage.removeItem("VID2");
        console.log(_data.data);
        encryptStorage.setItem("UID", _data.data);
        localStorage.removeItem("type");
        localStorage.setItem("accessToken", _data.data.access_token);
        localStorage.setItem("showAnimation", true);
        localStorage.setItem("refreshToken", _data.data.refresh_token);
        history.replace("/home");
      })
      .finally(() => {
        setLoadingScreen(false);
      });
  };

  const getSystemData = async () => {
    axios
      .get(API_URL + "base/startup")
      .then((res) => {
        setisLoading(false);
        if (res.data.detail === "suspended") {
          history.replace("/auth/error");
        }
        if (res.data.detail === "user_selection") {
          if (location.state?.user === "end_user")
            history.replace("/auth/network");
          else history.replace("/auth/type");
        }
        if (res.data.detail === "network") {
          history.replace("/auth/network");
        }
      })
      .catch((err) => {
        setisLoading(false);
        if (err.response === undefined) {
          history.push("/auth/error");
        }
      });
  };
  useEffect(() => {
    if (!location.state?.callAPI) {
      getSystemData();
    } else {
      setisLoading(false);
    }
  }, []);

  if (isLoading) {
    return <Loading text={"Breath"} />;
  }
  return (
    <div className="__auth_login__">
      <FormCard name="Login" copyright>
        <div className="auth_form">
          <motion.ul
            variants={container}
            exit="exit"
            initial="hidden"
            animate="visible"
          >
            <motion.li variants={item}>
              <InputBox
                id="username"
                header="Username *"
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
                tooltip={
                  location.state?.callAPI &&
                  "Enter your access key as an username"
                }
              />
            </motion.li>

            <motion.li variants={item}>
              <InputBox
                id="password"
                error={errors["isPasswordEmpty"]}
                type={oldType}
                typeValue={(data) => handlePassword(data)}
                password
                header="Enter Password *"
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => clearError("isPasswordEmpty")}
                value={Password}
                onKeyDown={(e) => {
                  if (e.keyCode === 13) {
                    postData();
                  }
                }}
              />
            </motion.li>
            <motion.li variants={item}>
              <p className="signup-text">
                <Link
                  to={{
                    pathname: "/auth/reset",
                    state: {
                      forgotPasswordClicked: true,
                    },
                  }}
                >
                  <span>Forgot password?</span>
                </Link>
              </p>
            </motion.li>
          </motion.ul>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button onClick={postData} type="gradient" name="Login" />
        </div>
      </FormCard>
      {modalOpen && (
        <Modal
          className="transparent_modal"
          handleClose={() => {
            close();
          }}
          type="alert"
          errorHeader="Error"
          errorText="Invalid Credential!"
        />
      )}
      {loadingScreen && <Loading type={"transparent"} text={"Loading"} />}
    </div>
  );
}
