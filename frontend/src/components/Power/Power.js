import React, { useEffect, useState } from "react";
import { axiosApiInstance } from "../../helper/request";

import "./power.scss";
export default function Power({ type }) {
  const [powerOnDate, setPowerOnDate] = useState("");
  const [powerOnTime, setPowerOnTime] = useState("");
  const [powerOffDate, setPowerOffDate] = useState("");
  const [powerOffTime, setPowerOffTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const ordinal = (n) => {
    var s = ["th", "st", "nd", "rd"];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const getDateTime = (dateTimeString) => {
    var today = new Date(dateTimeString);

    // var day = today.toDateString().split(" ")[0]
    var month = today.toDateString().split(" ")[1];
    var date = today.toDateString().split(" ")[2];
    var year = today.toDateString().split(" ")[3];

    var ord = ordinal(date);

    var hours = today.getHours();

    var minutes = today.getMinutes();

    var ampm = hours >= 12 ? "PM" : "AM";
    if (hours !== 0) {
      hours = hours % 12;
      hours = hours ? hours : 12;
    }
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;

    var strDate = ord + " " + String(month).padStart(2, "0") + " " + year;
    var strTime = hours + ":" + minutes + " " + ampm;
    return strDate + "  " + strTime;
  };

  const getPowerOnOffTime = () => {
    axiosApiInstance("host/devicelogs?startlogs=true")
      .then((res) => {
        var shutdownDateTime = getDateTime(
          res.data.latestshutdown.date + " " + res.data.latestshutdown.time
        );
        setPowerOffDate(shutdownDateTime.split("  ")[0]);
        setPowerOffTime(shutdownDateTime.split("  ")[1]);

        var powerOnDateTime = getDateTime(
          res.data.lateststart.date + " " + res.data.lateststart.time
        );
        setPowerOnDate(powerOnDateTime.split("  ")[0]);
        setPowerOnTime(powerOnDateTime.split("  ")[1]);
      })
      .catch((err) => {
        console.debug(err.response);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getPowerOnOffTime();
  }, []);

  if (isLoading) {
    return <div className="_power_ s_loader"></div>;
  }
  return (
    <div
      className={type === "on" ? "_power_ fadeIn" : "_power_ fadeIn _power_off"}
    >
      <div className="_title">
        <i
          className="material-icons"
          style={{ color: type === "on" ? "#39D5CF" : "#ff007c" }}
        >
          power_settings_new
        </i>

        {type === "on" ? (
          <p style={{ color: "#39D5CF" }}>Powered ON</p>
        ) : (
          <p>Powered OFF</p>
        )}
      </div>
      {type === "on" ? (
        <div className="_data">{powerOnDate}</div>
      ) : (
        <div className="_data">{powerOffDate}</div>
      )}
      {type === "on" ? (
        <div className="_data">{powerOnTime}</div>
      ) : (
        <div className="_data">{powerOffTime}</div>
      )}
    </div>
  );
}
