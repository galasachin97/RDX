import React, { useState, useEffect } from "react";
import annotation from "../../assets/images/annotation.gif";
import { NavLink } from "react-router-dom";
import "./welcome.scss";

import { encryptStorage } from "../../helper/storage";
import { axiosApiInstance } from "../../helper/request";
import useLoading from "../../helper/useLoading";
import Modal from "../Modal/Modal";
export default function WelcomeUser({ theme, Role }) {
  const [name, setname] = useState("");
  const [cameraCount, setCameraCount] = useState("0");
  const [alertCount, setAlertCount] = useState("0");
  const { isLoading, loadingFinished, loading } = useLoading();
  const [showPassErrorModal, setshowPassErrorModal] = useState({
    showPop: false,
    msg: "",
    type: "",
    header: "",
  });

  const fetchCameraCount = () => {
    loading();
    axiosApiInstance
      .get("camera/count")
      .then((resp) => {
        setCameraCount(resp.data.detail);
        fetchAlertCount();
      })
      .catch((err) => {
        loadingFinished();
        // setshowPassErrorModal((prevState) => ({
        //   ...prevState,
        //   showPop: true,
        //   msg: "Failed to fetch camera count!",
        //   type: "alert",
        //   header: "Error",
        // }));
        // resetModal();
      });
  };

  const fetchAlertCount = () => {
    axiosApiInstance
      .get("base/count")
      .then((resp) => {
        setAlertCount(resp.data.detail);
      })
      .catch((err) => {
        // setshowPassErrorModal((prevState) => ({
        //   ...prevState,
        //   showPop: true,
        //   msg: "Failed to fetch alert count!",
        //   type: "alert",
        //   header: "Error",
        // }));
        // resetModal();
      })
      .finally(() => {
        loadingFinished();
      });
  };

  useEffect(() => {
    if (name === "") {
      let dataa = encryptStorage.getItem("UID");
      setname(dataa.fullname);
    }
    fetchCameraCount();
  }, []);
  if (isLoading) {
    return <div className="_welcome_user_ s_loader"></div>;
  }

  return (
    <div className="_welcome_user_ fadeIn">
      <h2>Welcome back {name}!</h2>
      {Role !== "Manufacturer" && (
        <React.Fragment>
          <p>Here is a collective overview of your system</p>
          <ul className="_ul">
            <li>
              <NavLink
                to="/camera"
                activeClassName="activated_tab"
                // style={{ color: "#013aa2" }}
              >
                {cameraCount + " Cameras"}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/alerts"
                activeClassName="activated_tab"
                // style={{ color: "#013aa2" }}
              >
                {alertCount + " Alerts"}
              </NavLink>
            </li>
          </ul>
        </React.Fragment>
      )}

      <img src={annotation} className="annotation" alt="annotation" />
      {/* <div className="img_user">
        <img
          className="welcome_icon"
          src={theme === "Dark" ? welcomeUserDark : welcomeUser}
        />
        <img className="hand" src={hand} />
        <img className="dot1" src={dot} />
        <img className="dot2" src={dot} />
      </div> */}
      {showPassErrorModal.showPop && (
        <Modal
          className={"transparent_modal"}
          handleClose={() => {
            setshowPassErrorModal((prevState) => ({
              ...prevState,
              showPop: false,
            }));
          }}
          type={showPassErrorModal.type ? showPassErrorModal.type : "alert"}
          errorHeader={
            showPassErrorModal.header ? showPassErrorModal.header : "Error"
          }
          errorText={showPassErrorModal.msg}
        />
      )}
    </div>
  );
}
