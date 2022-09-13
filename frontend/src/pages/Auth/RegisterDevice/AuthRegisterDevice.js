import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Button from "../../../components/Button/Button";
import FormCard from "../../../components/FormCard/FormCard";
import InputBox from "../../../components/Inputbox/InputBox";
import { motion } from "framer-motion";
import "./rd.scss";
import { container, item } from "../../../helper/motions";
import axios from "axios";
import { API_URL } from "../../../helper/request";
import Modal from "../../../components/Modal/Modal";
let isSNPresent = false;
export default function AuthRegisterDevice() {
  let history = useHistory();
  const location = useLocation();

  const [serialNumber, setserialNumber] = useState("");
  const [isEmpty, setisEmpty] = useState(false);
  const [showPop, setShowPop] = useState(false);

  const postData = () => {
    if (serialNumber === "" || serialNumber.length !== 56) {
      setisEmpty(true);
      return;
    }
    history.push({
      pathname: "/auth/register",
      state: {
        accessKey: location.state.accessKey,
        serialNumber,
        deviceName: location.state.deviceName,
      },
    });
  };

  useEffect(() => {
    if (!location.state) {
      history.push("/");
    } else {
      if (location.state.serialNumber) {
        isSNPresent = true;
        setserialNumber(location.state.serialNumber);
      }
    }
  }, []);
  const renderSerial = (text) => {
    let part1 = text.substring(0, 4);
    let part2 = text.substring(text.length - 4, text.length);
    // let part3 = text.substring(text.length / 2, text.length / 2 + 4);
    return part1 + "*************" + part2;
  };

  const getSerial = () => {
    axios
      .get(API_URL + "base/serialNumber", {
        headers: {
          accessKey: location.state.accessKey,
        },
      })
      .then((res) => {
        isSNPresent = true;
        setserialNumber(res.data.detail);
      })
      .catch((err) => {
        if (err.response.status === 406) {
          setShowPop(true);
        }

        setTimeout(() => {
          setShowPop(false);
        }, 3000);
        // alert(err.response.detail);
      });
  };
  return (
    <div className="__auth_register_device__">
      <FormCard back name="Register Device">
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
              id="serialNumber"
              header="Serial Number *"
              onChange={(e) => {
                if (!isSNPresent) {
                  const value = e.target.value;
                  const regex = /^[a-zA-Z0-9]*$/;
                  if (value.match(regex) || value === "") {
                    setserialNumber(value);
                  }
                }
              }}
              error={isEmpty}
              value={serialNumber}
              onFocus={() => setisEmpty(false)}
              // disabled={isSNPresent}
              disabled={true}
              maxLength={56}
            />
            <p className="signup-text">
              <span
                className={isSNPresent && "disabled"}
                onClick={isSNPresent ? null : () => getSerial()}
              >
                click here
              </span>
              &nbsp; to get the serial number
            </p>

            <Button
              onClick={postData}
              style={{ alignSelf: "center" }}
              type="gradient"
              name="Submit"
            />
          </motion.div>
        </motion.div>
      </FormCard>
      {showPop && (
        <Modal
          modalOpen={showPop}
          handleClose={() => {
            setShowPop(false);
            history.push("/auth/device/register");
          }}
          type="alert"
          errorHeader="Error"
          errorText="Internet connection not present!"
        />
      )}
    </div>
  );
}
