import React, { useState, useEffect } from "react";
import Button from "../../../components/Button/Button";
import FormCard from "../../../components/FormCard/FormCard";
import InputBox from "../../../components/Inputbox/InputBox";
import "./reset.scss";
import { motion } from "framer-motion";
import { container, item } from "../../../helper/motions";
import { Link, useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../../helper/request";
import { encryptStorage } from "../../../helper/storage";
import useModal from "../../../helper/useModal";
import Modal from "../../../components/Modal/Modal";
let msg = "";
export default function AuthResetPassword() {
  let history = useHistory();
  const location = useLocation();
  const [Username, setUsername] = useState("");
  const [isUsernameEmpty, setisUsernameEmpty] = useState(false);
  const { modalOpen, close, open } = useModal();
  const [isSuccess, setisSuccess] = useState(false);
  const [isLoading, setisLoading] = useState(true);


  const postData = () => {
    if (Username === "") {
      setisUsernameEmpty(true);
      return;
    }
    let otpVal = Math.floor(Math.random() * 899999 + 100000);
    axios
      .post(API_URL + "user/otp?forgotPassword=true", {
        username: Username,
        otp: otpVal.toString(),
        interval: "3",
      })
      .then((res) => {
        if (res.status === 200) {
          history.push({
            pathname: "/auth/reset/otp",
            state: {
              otpVal,
              interval: "3",
              username: res.data.detail.username,
            },
          });
        }
      })
      .catch((err) => {
        if (err.response.status === 403) {
          msg = "OTP limit Exhausted! Please try again later.";
        } else {
          msg = "Username not found!";
        }
        open();
        setTimeout(() => {
          close();
        }, 4000);
      });
  };

  useEffect(() => {
    encryptStorage.removeItem("VID");
    if (!location.state?.forgotPasswordClicked) {
      history.replace("/auth/login");
    } 
  }, []);

  return (
    <div className="__auth_reset_password__">
      <FormCard arrow={isSuccess ? false : true} name="Reset Password">
        <div className="auth_form">
          <motion.ul
            variants={container}
            exit="exit"
            initial="hidden"
            animate="visible"
          >
            <motion.li variants={item}>
              <InputBox
                id="RegisteredUsername"
                header="Registered Username *"
                onChange={(e) => setUsername(e.target.value)}
                error={isUsernameEmpty}
                value={Username}
                // onBlur={emailValidation}
                onFocus={() => setisUsernameEmpty(false)}
              />
            </motion.li>
          </motion.ul>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "5vw",
          }}
        >
          <Button onClick={postData} type="gradient" name="Submit" />
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
          errorText={msg}
        />
      )}
    </div>
  );
}
