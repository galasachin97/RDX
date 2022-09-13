import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import Button from "../../../../components/Button/Button"; // for submit button
import { BoxCard } from "../../../../components/card/Card"; // for card on which components will be shown
import Dropdown from "../../../../components/Dropdown/Dropdown"; // for day and month dropdonws
import Loading from "../../../../components/Loading/Loading";
import { xMotion } from "../../../../helper/motions";
import { axiosApiInstance, SOCKET_URL } from "../../../../helper/request";
import "./storage.scss";
import socketio from "socket.io-client";
import Modal from "../../../../components/Modal/Modal";
import Counter from "../../../../components/Counter/Counter";
let socket = null;
let timeout = "";
let Month = [];
let Day = [];
let str = "Select option";
export default function Storage() {
  const [dayMonth, setDayMonth] = useState("Days");
  const [value, setValue] = useState(1);
  const [errors, setErrors] = useState({
    isDayMonthEmpty: false,
    isValueEmpty: false,
  });
  const [loadingScreen, setLoadingScreen] = useState(false);
  const [showErrorModal, setshowErrorModal] = useState({
    showPop: false,
    msg: "",
    type: "alert",
    header: "Error",
  });

  const resetModal = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setshowErrorModal((prevState) => ({
        ...prevState,
        showPop: false,
        msg: "",
        type: "alert",
        header: "Error",
      }));
    }, 3000);
  };

  const fifoStatusHandler = () => {
    socket = socketio(SOCKET_URL);
    socket.on("fifo", (data) => {
      if (data === "success") {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Backup Setting Updated Successfully!",
          type: "success",
          header: "Success",
        }));
      } else {
         setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Failed to update backup setting!",
          type: "alert",
          header: "Error",
        }));
      }
      console.log("FIFO SOCKET DATA");
      console.log(data);
      socket.close();
      socket = null;

      resetModal();
    });
  };

  const minmax = (value, min, max) => {
    if (parseInt(value) > max) return max;
    else if (!value) return "1";
    else return parseInt(value);
  };

  const handleCounter = (e, type, type2) => {
    if (type2 === "input") {
      if (isNaN(e.target.value)) {
        return;
      }
      const onlyNums = e.target.value.replace(/[^0-9]/g, "");
      setValue(minmax(onlyNums, 1, dayMonth === "Days" ? 31 : 12).toString());
    } else {
      if (type === "increment") {
        if (value == (dayMonth === "Days" ? 31 : 12)) {
          return;
        }
        let _add = parseInt(value);
        _add++;
        _add = _add.toString();
        setValue(_add);
      } else {
        if (value == 1) {
          return;
        }
        let _add = parseInt(value);
        _add--;
        _add = _add.toString();
        setValue(_add);
      }
    }
  };

  const handleSubmit = () => {
    let _errors = { ...errors };
    if (!dayMonth) _errors["isDayMonthEmpty"] = true;
    if (!value) _errors["isValueEmpty"] = true;
    setErrors({ ..._errors });
    if (Object.values(_errors).includes(true)) {
      return;
    }
    setLoadingScreen(true);

    axiosApiInstance
      .get(`host/fifo?type=${dayMonth}&days_or_month=${value}`)
      .then((res) => {
        fifoStatusHandler();
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Backup Setting is in process. You will get notification once finished!",
          type: "success",
          header: "Success",
        }));
        resetModal();
      })
      .catch((err) => {
        console.log(err);
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Server Error",
          type: "alert",
          header: "Error",
        }));
      })
      .finally(() => {
        setLoadingScreen(false);
      });
  };

  useEffect(() => {
    for (let i = 1; i <= 31; i++) {
      if (i <= 12) {
        Month[i - 1] = `${i}`;
      }
      Day[i - 1] = `${i}`;
    }
  }, [dayMonth, value]);

  const clearError = (name) => {
    let _errors = { ...errors };
    _errors[name] = false;
    //console.log(_errors);
    setErrors({ ..._errors });
  };

  return (
    <motion.div
      variants={xMotion}
      exit="exit"
      initial="hidden"
      animate="visible"
      className="_storage_"
    >
      <BoxCard className="card_size">
        <div style={{ display: "flex", alignItems: "center" }}>
          <Dropdown
            id="day-month"
            optionsList={["Days", "Month"]}
            handleOption={(data) => {
              str = `Select ${data}`;
              setDayMonth(data);
              setValue(1);
            }}
            defaultText={dayMonth}
            label="How many Day/Month of backup?"
            error={errors["isDayMonthEmpty"]}
            onFocus={() => clearError("isDayMonthEmpty")}
          />
          <Counter
            required
            label={""}
            value={value}
            handleDecrement={() => handleCounter(null, "decrement", "button")}
            handleIncrement={() => handleCounter(null, "increment", "button")}
            handleInput={(e) => handleCounter(e, null, "input")}
          />
        </div>
        {/* 
        <Dropdown
          optionsList={dayMonth === "Days" ? Day : Month}
          handleOption={(data) => setValue(data)}
          defaultText={value}
          label={str}
          id="val"
          error={errors["isValueEmpty"]}
          onFocus={() => clearError("isValueEmpty")}
        /> */}
        <div
          style={{
            position: "absolute",
            bottom: "1vw",
            left: 0,
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            style={{ width: "8vw" }}
            onClick={handleSubmit}
            type="gradient"
            name="Submit"
          />
        </div>
      </BoxCard>
      {/* {showModal && (
            <Modal
              modalOpen={showModal}
              handleClose={() => {
                setshowModal(false);
              }}
              type="alert"
              errorHeader="Error"
              errorText={error}
            />
          )}
          {showPassContainer && (
            <PasswordVerification
              close={closeModal}
              postPassword={postPassword}
              password={password}
              setPassword={setPassword}
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
          )} */}

      {loadingScreen && <Loading type={"transparent"} text={"Loading"} />}

      {showErrorModal.showPop && (
        <Modal
          className={"transparent_modal"}
          handleClose={() => {
            setshowErrorModal((prevState) => ({
              ...prevState,
              showPop: false,
            }));
          }}
          type={showErrorModal.type ? showErrorModal.type : "alert"}
          errorHeader={showErrorModal.header ? showErrorModal.header : "Error"}
          errorText={showErrorModal.msg}
        />
      )}
    </motion.div>
  );
}
