import axios from "axios";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import "../../CheckUser/cu.scss";
import { encryptStorage } from "../../../helper/storage";
import { SOCKET_URL, API_URL } from "../../../helper/request";
var interval = null;
let timeout = 8000;
export default function Maintenance() {
  let history = useHistory();
  const [ThemeData, setThemeData] = useState({ startup_video: "" });

  const getTheme = async () => {
    let res = await fetch("http://" + window.location.host + "/Theme.json");
    let jsonData = await res.json();
    console.log(jsonData);

    setThemeData({ ...jsonData });
  };

  const handleLoadedMetaData = () => {
    let myvid = document.getElementById("brand_video");
    console.log(myvid);
    timeout = Math.ceil(myvid.duration) * 1000;
    if (!timeout) {
      timeout = 8000;
    }
    console.log(timeout);
    let _eData = encryptStorage.getItem("UID");
    if (_eData) {
      setTimeout(() => {
        history.push("/auth/login");
      }, timeout);
    } else {
      setTimeout(() => {
        // systemStartup();
      }, timeout);
    }
  };

  const systemStartup = async () => {
    const cancelTokenSource = axios.CancelToken.source();
    interval = setInterval(async () => {
      var res = await axios.get(API_URL + "host/systemstartup", {
        cancelToken: cancelTokenSource.token,
      });
      if (res.status == 200) {
        clearInterval(interval);
        history.push("/auth/login");
        // this.setState({
        //   waitScreen: false,
        //   spinner: !this.state.spinner,
        // });
      } else {
      }
    }, 3000);
  };

  useEffect(() => {
    let myvid = document.getElementById("brand_video");

    myvid.addEventListener("loadedmetadata", handleLoadedMetaData);
    // cleanup this component
    return () => {
      myvid.removeEventListener("loadedmetadata", handleLoadedMetaData);
    };
  }, []);

  useEffect(() => {
    getTheme();
    localStorage.removeItem("user");
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="check_user">
      <div className="overlay--gradient"></div>
      <video
        // onEnded={() => {
        //   document.querySelector(".logoText").style.opacity = 1;
        // }}
        src={SOCKET_URL + ThemeData?.startup_video}
        // src="http://www.w3schools.com/html/movie.mp4"
        autoPlay
        muted
        playsInline
        className="background__image"
        id="brand_video"
      />

      <h1 className="maintenance_header">Under Maintenance</h1>
      <div className="wrapper" style={{ position: "relative" }}>
        <div className="circle"></div>
        <div className="circle"></div>
        <div className="circle"></div>
        <div className="shadow"></div>
        <div className="shadow"></div>
        <div className="shadow"></div>
      </div>
      <h3 className="maintenance_sub_header">
        Please waif while your system is upgrading, we are working hard to give
        you the best experience with this one.
      </h3>
    </div>
  );
}
