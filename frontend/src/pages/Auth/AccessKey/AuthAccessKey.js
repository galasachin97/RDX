import React, { useState, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import Button from "../../../components/Button/Button";
import FormCard from "../../../components/FormCard/FormCard";
import InputBox from "../../../components/Inputbox/InputBox";
import { motion } from "framer-motion";
import "./accesskey.scss";
import success from "../../../assets/images/congrats.png";
import { container, item } from "../../../helper/motions";
import axios from "axios";
import { API_URL } from "../../../helper/request";
import Loading from "../../../components/Loading/Loading";
import Modal from "../../../components/Modal/Modal";
import useModal from "../../../helper/useModal";
let apiData = {};
let acPresent = false;
let timeout = null;
export default function AuthAccessKey() {
  let history = useHistory();
  const [accessKey, setAccessKey] = useState("");
  const [inputAccessKey, setInputAccessKey] = useState("");
  const [isEmpty, setisEmpty] = useState(false);
  const [isSuccess, setisSuccess] = useState(false);
  const [isLoading, setisLoading] = useState(true);
  const [isError, setisError] = useState(false);
  const { modalOpen, close, open } = useModal();

  const postData = () => {
    if (inputAccessKey === "" || inputAccessKey.length !== 40) {
      setisEmpty(true);
      return;
    }

    if (acPresent) {
      if (accessKey !== inputAccessKey) {
        setisError(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          setisError(false);
        }, 3000);
        return;
      }
    }

    //loading screen
    let localData = localStorage.getItem("type");
    open();
    axios
      .post(API_URL + "base/authentication", {
        access_key: inputAccessKey.toLowerCase(),
      })
      .then((res) => {
        if (Object.keys(apiData).length > 0 && apiData.accessKey) {
          history.push({
            pathname: "/auth/device/register",
            state: {
              accessKey: inputAccessKey,
              serialNumber: apiData.serialNumber,
              deviceName: apiData.deviceName,
            },
          });
        } else {
          if (res.data.detail.mfgPresent) {
            if (res.data.detail.userType.includes("user")) {
              history.push({
                pathname: "/auth/device/register",
                state: {
                  accessKey: inputAccessKey,
                  serialNumber: res.data.detail.serialNumber,
                },
              });
            } else {
              history.push({
                pathname: "/auth/error",
                state: { message: "Device cannot be configured." },
              });
            }
          } else {
            if (res.data.detail.userType.includes("manufacturer")) {
              history.push({
                pathname: "/auth/activate",
                state: {
                  accessKey: inputAccessKey,
                  serialNumber: res.data.detail.serialNumber,
                },
              });
            } else {
              history.push({
                pathname: "/auth/error",
                state: { message: "Device cannot be configured." },
              });
            }
          }
        }
      })
      .catch((err) => {
        if (err.response.status === 400) {
          if (err.response.data.detail === "device not found") {
            history.push({
              pathname: "/auth/device/register",
              state: { accessKey: inputAccessKey },
            });
          }
        }
        if (err.response.status === 404) {
          if (err.response.data.detail === "user not found") {
            // alert("Please Enter correct access key!");
            setisError(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              setisError(false);
            }, 3000);
          }

          if (err.response.data.detail === "device not found") {
            if (localData === "user") {
              history.push({
                pathname: "/auth/device/register",
                state: { accessKey: inputAccessKey },
              });
            } else {
              history.push({
                pathname: "/auth/activate",
                state: { accessKey: inputAccessKey },
              });
            }
          }
        }
        if (err.response.status === 403) {
          if (err.response.data.detail === "device not found") {
            history.push("/");
            // history.push({
            //   pathname: "/auth/device/register",
            //   //  state: { accessKey, serialNumber: res.data.detail.serialNumber },
            // });
          }

          // history.push({
          //   pathname: "/auth/activate",
          //   state: { accessKey },
          // });
        }
      })
      .finally(() => {
        close();
      });
  };

  const getSystemData = async () => {
    axios
      .get(API_URL + "base/startup")
      .then((res) => {
        if (res.data.detail === "success") {
          history.replace("/auth/login");
        }
      })
      .catch((err) => {
        if (err.response === undefined) {
          history.push("/auth/error");
        }
      });
  };

  const getInfo = () => {
    axios
      .get(API_URL + "base/fetch_info")
      .then((res) => {
        if (res.status === 200) {
          setisLoading(false);
          if (res.data.detail.accessKey) {
            acPresent = true;
            setAccessKey(res.data.detail.accessKey);
          }
          apiData = { ...res.data.detail };
        }
      })
      .catch((err) => {
        acPresent = false;
        setisLoading(false);
        if (err.response.status === 400) {
          apiData = {};
        }
        if (err.response.status === 404) {
          apiData = {};
        }
        if (err.response.status === 406) {
          history.push({
            pathname: "/auth/network",
            state: {
              showPop: true,
            },
          });
        }
        if (err.response.status === 403) {
          if (err.response.data.detail === "Forbidden") {
            history.push({
              pathname: "/auth/error",
              state: { message: "Device cannot be configured." },
            });
          }
        }
      });
  };
  useEffect(() => {
    getSystemData();
    getInfo();
  }, []);

  if (isLoading) {
    return <Loading text={"Breath"} />;
  }
  return (
    <div className="__auth_accesskey__">
      <FormCard
        arrow={isSuccess ? false : true}
        name={isSuccess ? null : "Enter Your Access Key"}
      >
        {!isSuccess && (
          <motion.div
            className="auth_form"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={item}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <InputBox
                id="accessKey"
                header="Access Key *"
                maxLength={40}
                // disabled={acPresent}
                onInput={(e) => {
                  const value = e.target.value;
                  const regex = /^[a-zA-Z0-9]*$/;
                  if (value.match(regex) || value === "") {
                    setInputAccessKey(value);
                  }
                }}
                error={isEmpty}
                value={inputAccessKey}
                onFocus={() => setisEmpty(false)}
                style={{ textTransform: "lowercase" }}
                tooltip="You will find the access key in your registered email."
              />
              <p className="signup-text">
                Don't have an Access key? &nbsp;
                <Link
                  to={{ pathname: "http://marketplace.diycam.com" }}
                  target="_blank"
                >
                  <span>Sign-up</span>
                </Link>
              </p>

              <Button
                onClick={postData}
                style={{ alignSelf: "center" }}
                type="gradient"
                name="Submit"
              />
            </motion.div>
          </motion.div>
        )}
        {isSuccess && (
          <div className="_success_">
            <img src={success} />
            <h1>CONGRATULATIONS!</h1>
            <p className="text">Your device has been successfully activated</p>
          </div>
        )}
      </FormCard>
      {modalOpen && <Loading text={"Breath"} />}
      {isError && (
        <Modal
          modalOpen={isError}
          handleClose={() => {
            setisError(false);
          }}
          type="alert"
          errorHeader="Error"
          errorText="Please Enter correct access key!"
        />
      )}
    </div>
  );
}
