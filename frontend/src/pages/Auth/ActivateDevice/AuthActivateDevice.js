import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Button from "../../../components/Button/Button";
import FormCard from "../../../components/FormCard/FormCard";
import InputBox from "../../../components/Inputbox/InputBox";
import { motion } from "framer-motion";
import "./activate.scss";
import { container, item } from "../../../helper/motions";
import success from "../../../assets/images/congrats.png";
import copy from "../../../assets/images/copy.png";
import axios from "axios";
import { API_URL } from "../../../helper/request";
import useModal from "../../../helper/useModal";
import Modal from "../../../components/Modal/Modal";
import useLoading from "../../../helper/useLoading";
import Loading from "../../../components/Loading/Loading";
let timeout = null;
export default function AuthActivateDevice() {
  let history = useHistory();
  const location = useLocation();
  const [error, seterror] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [Password, setPassword] = useState("");
  const [ConfirmPassword, setConfirmPassword] = useState("");
  const [oldType, setOldType] = useState("password");
  const [oldType2, setOldType2] = useState("password");
  const [isSuccess, setisSuccess] = useState(false);
  const { modalOpen, close, open } = useModal();
  const [showPop, setShowPop] = useState(false);
  const { isLoading, loadingFinished, loading } = useLoading();

  const [errors, setErrors] = useState({
    isSerialNameEmpty: false,
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

  const clearError = (name) => {
    let _errors = { ...errors };
    _errors[name] = false;
    setErrors({ ..._errors });
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
      setDropdown(false);
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
    //loading screen
    let _errors = { ...errors };
    if (serialNumber === "" || serialNumber.length !== 56)
      _errors["isSerialNameEmpty"] = true;
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
    loading();
    axios
      .post(
        API_URL + "base/device_activation",
        {
          serial_number: serialNumber.toLowerCase(),
          password: Password,
        },
        {
          headers: {
            accessKey: location.state.accessKey,
          },
        }
      )
      .then((res) => {
        setisSuccess(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          history.replace({
            pathname: "/auth/login",
            state: {
              callAPI: true,
              accessKey: location.state.accessKey,
            },
          });
        }, 5000);
      })
      .catch((err) => {
        if (err.response.status === 404) {
          open();
          seterror("Please Enter Correct Serial Number !");
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            close();
          }, 3000);
        }
        if (err.response.status === 401) {
          if (err.response.data.detail === "Unauthorized") {
            history.replace("/auth/error");
          } else {
            open();
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              close();
            }, 3000);
            seterror("Please Enter Correct Access Key!");
          }
        }
        if (err.response.status === 406) {
          setShowPop(true);
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            history.push("/auth/activate");
            setShowPop(false);
          }, 3000);
        }
      })
      .finally(() => {
        loadingFinished();
      });
  };

  useEffect(() => {
    if (!location.state) {
      history.push("/");
    } else {
      if (location.state.serialNumber) {
        setSerialNumber(location.state.serialNumber);
      }
    }
  }, []);

  const copyToClipBoard = async (copyMe) => {
    try {
      await navigator.clipboard.writeText(copyMe);
    } catch (err) {}
  };

  const renderSerial = (text) => {
    let part1 = text.substring(0, 4);
    let part2 = text.substring(text.length - 4, text.length);
    // let part3 = text.substring(text.length / 2, text.length / 2 + 4);
    return part1 + "*************" + part2;
  };
  return (
    <div className="__auth_activate_device__">
      <FormCard name={isSuccess ? null : "Activate Device"}>
        {!isSuccess && (
          <React.Fragment>
            <motion.div
              className="auth_form"
              variants={container}
              initial="hidden"
              animate="visible"
            >
              <motion.ul
                variants={item}
                style={{ display: "flex", flexDirection: "column" }}
              >
                {location.state?.serialNumber ? (
                  <motion.li style={{ position: "relative" }}>
                    <InputBox
                      id="SerialNumber"
                      header="Serial Number *"
                      // onChange={(e) => setSerialNumber(e.target.value)}
                      // error={errors["isSerialNameEmpty"]}
                      value={renderSerial(serialNumber)}
                      // onFocus={() => clearError("isSerialNameEmpty")}
                      disabled={true}
                      style={{
                        paddingRight: "30px",
                      }}
                    />
                    <img
                      className="copy"
                      src={copy}
                      onClick={() => copyToClipBoard(serialNumber)}
                    />
                  </motion.li>
                ) : (
                  <motion.li style={{ position: "relative" }}>
                    <InputBox
                      id="SerialNumber"
                      header="Serial Number *"
                      error={errors["isSerialNameEmpty"]}
                      value={serialNumber}
                      onFocus={() => clearError("isSerialNameEmpty")}
                      disabled={location.state?.serialNumber ? true : false}
                      tooltip="You have to generate the serial number from cloud dashboard"
                      maxLength={56}
                      onChange={(e) => {
                        const value = e.target.value;
                        const regex = /^[a-zA-Z0-9]*$/;
                        if (value.match(regex) || value === "") {
                          setSerialNumber(value);
                        }
                      }}
                    />
                  </motion.li>
                )}

                <motion.li variants={item}>
                  <InputBox
                    id="password"
                    error={errors["isPasswordEmpty"]}
                    onInput={(e) => checkPassword(e.target.value)}
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
                    onFocus={() => clearError("isPasswordEmpty")}
                    value={Password}
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
                          className={areSpecialCharacters ? "valid" : "invalid"}
                        >
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
            </motion.div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button
                onClick={postData}
                style={{ alignSelf: "center" }}
                type="gradient"
                name="Submit"
                disabled={PassError}
              />
            </div>
          </React.Fragment>
        )}
        {isSuccess && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="_success_"
          >
            <img src={success} />
            <h1>CONGRATULATIONS!</h1>
            <p className="text">Your device has been successfully activated.</p>
          </motion.div>
        )}
      </FormCard>
      {modalOpen && (
        <Modal
          modalOpen={modalOpen}
          handleClose={close}
          type="alert"
          errorHeader="Error"
          errorText={error}
        />
      )}

      {showPop && (
        <Modal
          modalOpen={showPop}
          handleClose={() => {
            setShowPop(false);
            history.push("/auth/activate");
          }}
          type="alert"
          errorHeader="Error"
          errorText="Internet connection not present!"
        />
      )}
      {isLoading && <Loading text={"Breath"} />}
    </div>
  );
}
