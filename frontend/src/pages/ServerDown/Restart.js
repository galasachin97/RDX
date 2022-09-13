import axios from "axios";
import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router";
import { API_URL } from "../../helper/request";
import { encryptStorage } from "../../helper/storage";

import "./server_down.scss";
var interval = null;
let timeout = null;
export default function Restart() {
  let history = useHistory();
  const location = useLocation();

  const [percentage, setpercentage] = useState(
    localStorage.getItem("timeout") || 0
  );

  const getSystemStartup = () => {
    axios
      .get(API_URL + "host/systemstartup")
      .then((res) => {
        clearInterval(interval);
        localStorage.removeItem("timeout");
        localStorage.setItem("theme", "Light");
        history.push("/auth/login");
      })
      .catch((err) => {});
  };
  const systemStartup = () => {
    encryptStorage.removeItem("UID");
    getSystemStartup();
    interval = setInterval(async () => {
      getSystemStartup();
    }, 3000);
  };
  useEffect(() => {
    if (!location.state) {
      history.push("/auth/login");
      localStorage.setItem("theme", "Light");
    } else {
      systemStartup();
    }
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // useEffect(() => {
  //   localStorage.removeItem("user");
  //   if (!location.state) {
  //     localStorage.setItem("theme", "Light");
  //     history.push("/auth/login");
  //   }

  //   var duration = 150000 - localStorage.getItem("timeout") * 1000 || 150000;
  //   var percent = duration / 100;
  //   var i = localStorage.getItem("timeout") || 0;
  //   timeout = setTimeout(() => {
  //     i++;
  //     localStorage.setItem("timeout", i);
  //     setpercentage(i);
  //     if (i >= 100) {
  //       localStorage.setItem("timeout", 100);
  //       setpercentage(i);
  //       clearTimeout(timeout);
  //     }
  //   }, percent);
  // }, [percentage]);

  return (
    <div className="restart">
      <p className="company">RDX</p>
      <CircularProgressBar2 style={{ position: "absolute" }} />
      {/* <CircularProgressBar
        strokeWidth="15"
        sqSize="300"
        percentage={percentage}
        style={{ position: "absolute" }}
      /> */}
    </div>
  );
}

export const CircularProgressBar2 = ({
  sqSize,
  strokeWidth,
  percentage,
  style,
}) => {
  return (
    <svg className="circular" viewBox="25 25 50 50" style={style}>
      <circle
        className="path"
        cx="50"
        cy="50"
        r="20"
        fill="none"
        strokeWidth="2"
        strokeMiterlimit={10}
        // stroke-miterlimit="10"
      />
    </svg>
  );
};

const CircularProgressBar = ({ sqSize, strokeWidth, percentage, style }) => {
  // Size of the enclosing square
  //   const sqSize = sqSize;
  // SVG centers the stroke width on the radius, subtract out so circle fits in square
  const radius = (sqSize - strokeWidth) / 2;
  // Enclose cicle in a circumscribing square
  const viewBox = `0 0 ${sqSize} ${sqSize}`;
  // Arc length at 100% coverage is the circle circumference
  const dashArray = radius * Math.PI * 2;
  // Scale 100% coverage overlay with the actual percent
  const dashOffset = dashArray - (dashArray * percentage) / 100;
  return (
    <svg width={sqSize} height={sqSize} viewBox={viewBox} style={style}>
      <circle
        className="circle-background"
        cx={sqSize / 2}
        cy={sqSize / 2}
        r={radius}
        strokeWidth={`${strokeWidth}px`}
      />
      <circle
        className="circle-progress"
        cx={sqSize / 2}
        cy={sqSize / 2}
        r={radius}
        strokeWidth={`${strokeWidth}px`}
        // Start progress marker at 12 O'Clock
        transform={`rotate(-90 ${sqSize / 2} ${sqSize / 2})`}
        style={{
          strokeDasharray: dashArray,
          strokeDashoffset: dashOffset,
        }}
      />
      {/* <text
        className="circle-text"
        x="50%"
        y="50%"
        dy=".3em"
        textAnchor="middle"
      >
        {`${percentage}%`}
      </text> */}
    </svg>
  );
};
