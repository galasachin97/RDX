import axios from "axios";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { API_URL, SOCKET_URL } from "../../helper/request";
import { encryptStorage } from "../../helper/storage";
import rdxVideo from "../../assets/images/RDX.mp4";
import "./cu.scss";
var interval = null;
let timeout = 8000;
export default function CheckUser() {
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
    console.log(myvid)
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
        systemStartup();
      }, timeout);
    }
  };

  useEffect(() => {
    let myvid = document.getElementById("brand_video");

    myvid.addEventListener("loadedmetadata", handleLoadedMetaData);
    // cleanup this component
    return () => {
      myvid.removeEventListener("loadedmetadata", handleLoadedMetaData);
    };
  }, []);

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
      {/* <p className="logoText">RDX</p> */}
      {/* <p className="company">RDX</p> */}
    </div>
  );
}
