import React, { useEffect, useState } from "react";
import { axiosApiInstance } from "../../helper/request";
import InputBox from "../Inputbox/InputBox";
import "./time.scss";

let interval;
let today = "";

export default function Timezone({ onClick }) {
  const [tzData, settzData] = useState([]);
  const [dateTime, setdateTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  let date = new Date(tzData.Current_datetime);

  const getDateTime = (dateTimeString) => {
    today = new Date(dateTimeString);
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var yyyy = today.getFullYear();
    var pcdate = dd + "/" + mm + "/" + yyyy;

    var hours = today.getHours();
    var minutes = today.getMinutes();
    var seconds = today.getSeconds();
    var ampm = hours >= 12 ? "PM" : "AM";
    if (hours !== 0) {
      hours = hours % 12;
      hours = hours ? hours : 12;
    }
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    var strTime = hours + ":" + minutes + ":" + seconds + " " + ampm;
    return strTime;
  };

  useEffect(() => {
    fetchtimezonedata();
  }, []);

  useEffect(() => {
    interval = setInterval(() => {
      if (today) {
        today.setSeconds(today.getSeconds() + 1);
        setdateTime(getDateTime(today.toString()));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchtimezonedata = () => {
    axiosApiInstance.get("host/timesettings").then((data) => {
      setIsLoading(false);
      getDateTime(data.data.Current_datetime);
      settzData(data.data);
    });
  };

  if (isLoading) {
    return <div className="_timezone_ s_loader"></div>;
  }

  return (
    <div className="_timezone_ fadeIn">
      <div className="time">
        <h2>Current Time Details</h2>
        <h3>
          {date.toString().substring(0, 16).replace(" ", ", ") ===
          "Invalid, Date" ? (
            <p style={{ fontSize: "30px", paddingTop: "6px" }}>Loading . . .</p>
          ) : (
            date.toString().substring(0, 16).replace(" ", ", ")
          )}
        </h3>
        <h1>{dateTime}</h1>
      </div>
      <div className="time_selector">
        <p>Timezone</p>
        {/* <InputBox
          disabled={true}
          value={tzData.Timezone}
          style={{ width: "100%", marginTop: "0.8vw" }}
        /> */}
        <div className="_flex">
          <div className="_time">{tzData.Timezone}</div>
          <i className={"material-icons arrow_"} onClick={onClick}>
            arrow_forward
          </i>
        </div>
      </div>
    </div>
  );
}
