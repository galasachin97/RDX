import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import AppCard from "../../../components/AppCard/AppCard";
import Button from "../../../components/Button/Button";
import { BoxCard } from "../../../components/card/Card";
import Navbar from "../../../components/Navbar/Navbar";
import "./camera.scss";
import Logo from "../../../assets/images/Logo.jpg";
import dots from "../../../assets/images/dots.png";
import useModal from "../../../helper/useModal";
import Modal from "../../../components/Modal/Modal";
import InputBox from "../../../components/Inputbox/InputBox";
import socketio from "socket.io-client";
import { useHistory } from "react-router-dom";
import Scrollbars from "react-custom-scrollbars";
import ReactTooltip from "react-tooltip";
import { axiosApiInstance, SOCKET_URL } from "../../../helper/request";
import useLoading from "../../../helper/useLoading";
import { encryptStorage } from "../../../helper/storage";
import { cloneDeep } from "lodash";
import Loading from "../../../components/Loading/Loading";
import toast, { Toaster } from "react-hot-toast";
import CopyToClipboard from "react-copy-to-clipboard";
import NVR from "./NVR/NVR";
import axios from "axios";

let camID = "";
let nvrID = "";
let interval = "";

let timeout = null;
let timeout2 = null;
let ip = socketio(SOCKET_URL);
let msg = "";
let userType = "Operator";
let activeCamDetails = {};
let NVRAPI = null;
const notify = (data) => {
  return toast(
    (t) => (
      <div className="routeModal">
        <div style={{ display: "flex", alignItems: "center" }}>
          {data?.type === "success" ? (
            <i className="material-icons success_icon">done</i>
          ) : (
            <i className="material-icons modal_icon">warning</i>
          )}

          <div className="warning_content">
            <h3>{data?.type === "success" ? "Success" : "Error"}</h3>
            <p>{data?.msg}</p>
          </div>
        </div>
        <div className="warning_options">
          <i
            className="material-icons warning_icon"
            onClick={() => toast.dismiss(t.id)}
          >
            close
          </i>
        </div>
      </div>
    )
    // {
    //   duration: 500000,
    // }
  );
};
export function Camera() {
  console.log("camera")
  let history = useHistory();
  const [isConfirmDelete, setisConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [CamData, setCamData] = useState([]);
  const [viewAll, setviewAll] = useState({
    activeView: "",
    isViewAll: false,
  });
  const [Cameras, setCameras] = useState({
    active: [],
    inactive: [],
    all: [],
  });
  const [isFloatOpen, setisFloatOpen] = useState(false);
  const [activeView, setActiveView] = useState("Grid");
  const [activeFilter, setActiveFilter] = useState("Camera");
  const { modalOpen, close, open } = useModal();
  const { isLoading, loadingFinished, loading } = useLoading();
  const [isEditCamOpen, setIsEditCamOpen] = useState(false);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [isViewDetailLoading, setIsViewDetailLoading] = useState(false);
  const [Password, setPassword] = useState("");
  const [Username, setUsername] = useState("");
  const [oldType, setOldType] = useState("password");
  const [errors, setErrors] = useState({
    isUsernameEmpty: false,
    isPasswordEmpty: false,
  });

  const [SocketData, setSocketData] = useState([]);
  const handleSocketData = (res) => {
    setSocketData([...res]);
  };

  const escKey = (e) => {
    if (e.key === "Escape") {
      if (isViewDetailOpen) {
        document.addEventListener("keydown", escKey, false);
        setIsViewDetailOpen(false);
      }
      //Do whatever when esc is pressed
    }
  };

  useEffect(() => {
    let ele1 = document.querySelector(".side_nav_");
    let ele2 = document.querySelector(".nav_header");
    let ele3 = document.querySelector("#fab1");
    let ele4 = document.querySelector(".fixed_activity");
    if (isViewDetailOpen) {
      document.addEventListener("keydown", escKey, false);
      if (ele1 && ele2 && ele3 && ele4) {
        ele1.style.position = "relative";
        ele1.style.zIndex = "0";
        ele2.style.zIndex = "0";
        ele3.style.zIndex = "-1";
        ele4.style.zIndex = "-1";
      }
      const fetchSocketData = async () => {
        ip = socketio(SOCKET_URL);
        ip.emit("get_all_status");
        ip.on("service_status", handleSocketData);
      };
      fetchSocketData();
    } else {
      if (ele1 && ele2 && ele3 && ele4) {
        ele1.style.removeProperty("position");
        ele1.style.removeProperty("zIndex");
        ele2.style.zIndex = "12";
        ele3.style.zIndex = "115";
        ele4.style.removeProperty("zIndex");
        ele4.style.zIndex = "1";
      }
    }
    encryptStorage.removeItem("LIM");
    encryptStorage.removeItem("VID");
    return () => {
      document.removeEventListener("keydown", escKey, false);
    };
  }, [isViewDetailOpen]);

  const renderStatus = (param) => {
    let _data = cloneDeep(SocketData);
    if (_data.length) {
      let filter = _data.filter((item) => item.ServiceName === param);
      return filter[0].Status;
    }
    return true;
  };

  const getCameraDetails = () => {
    setIsViewDetailLoading(true);
    axiosApiInstance
      .get("camera/details?CameraID=" + activeCamDetails.Camera_id)
      .then((res) => {
        res.data.CameraDetails.Test_image =
          res.data.CameraDetails.Test_image + "?" + Math.random();
        setCamData(res.data);
      })
      .catch((err) => {})
      .finally(() => {
        setIsViewDetailLoading(false);
      });
  };

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
  const [showPassErrorModal, setshowPassErrorModal] = useState({
    showPop: false,
    msg: "",
    type: "alert",
    header: "",
  });

  const finishServices = async () => {
    axiosApiInstance
      .get("camera/finish_configure")
      .then((res) => {
        if (res.status == 200) {
          setIsEditCamOpen(false);
          setUsername("");
          setPassword("");
          setOldType("password");
          notify({
            type: "success",
            msg: "Camera Details Updated Successfully!",
          });
        }
      })
      .catch((err) => {
        notify({
          type: "alert",
          msg: "Failed to Update Camera Details!",
        });
      });
  };

  useEffect(() => {
    let ele1 = document.querySelector(".side_nav_");
    let ele2 = document.querySelector(".nav_header");
    let ele3 = document.querySelector("#fab1");
    let ele4 = document.querySelector(".fixed_activity");
    if (isEditCamOpen) {
      // document.addEventListener("keydown", escKey, false);
      if (ele1 && ele2 && ele3 && ele4) {
        ele1.style.position = "relative";
        ele1.style.zIndex = "0";
        ele2.style.zIndex = "0";
        ele3.style.zIndex = "-1";
        ele4.style.zIndex = "-1";
      }
    } else {
      if (ele1 && ele2 && ele3 && ele4) {
        ele1.style.removeProperty("position");
        ele1.style.removeProperty("zIndex");
        ele2.style.zIndex = "12";
        ele3.style.zIndex = "115";
        ele4.style.removeProperty("zIndex");
        ele4.style.zIndex = "1";
      }
    }
    return () => {
      // document.removeEventListener("keydown", escKey, false);
    };
  }, [isEditCamOpen]);

  const captureSnap = () => {
    setIsDeleting(true);
    let _errors = { ...errors };
    if (Username === "") _errors["isUsernameEmpty"] = true;
    if (Password === "") _errors["isPasswordEmpty"] = true;

    setErrors({ ..._errors });
    if (Object.values(_errors).includes(true)) {
      return;
    }

    let body = {
      Link: activeCamDetails.Rtsp_link,
      CameraSource: activeCamDetails.Camera_source,
      Type: "Test",
      Username,
      Password,
    };

    axiosApiInstance
      .post("camera/capture", body)
      .then((res) => {
        // if (res.data) {
        putCameraDetail();
        // } else {
        //   setIsDeleting(false);
        //   notify({
        //     type: "alert",
        //     msg: "Invalid Username or Password!",
        //   });
        // }
      })
      .catch((err) => {
        setIsDeleting(false);
        notify({
          type: "alert",
          msg: "Invalid Username or Password!",
        });
      });
  };

  const putCameraDetail = () => {
    let body = {
      CameraID: activeCamDetails.Camera_id,
      Username,
      Password,
    };

    axiosApiInstance
      .put("camera/camera_details", body)
      .then((res) => {
        finishServices();
      })
      .catch((err) => {
        notify({
          type: "alert",
          msg: "Failed to Update Camera Details!",
        });
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  const resetModal = () => {
    timeout = setTimeout(() => {
      setshowPassErrorModal((prevState) => ({
        ...prevState,
        showPop: false,
        msg: "",
        type: "alert",
        header: "",
      }));
    }, 4000);
  };

  const cameraHealthCheck = () => {
    axiosApiInstance
      .get("camera/new/health/camera", { timeout: 5000 })
      .catch((err) => {});
  };

  const getCamera = () => {
    let ldata = encryptStorage.getItem("UID");
    userType = ldata.role;
    loading();
    axiosApiInstance
      .get("camera?Layout=list")
      .then((res) => {
        // setCameras(res.data.Data);
        let _data = res.data.Data;
        let obj = {
          active: [],
          inactive: [],
          all: [],
        };
        for (let i = 0; i < _data.length; i++) {
          obj.all.push({ ..._data[i] });
          if (_data[i].Type === "Active") {
            obj.active.push({ ..._data[i] });
          } else {
            obj.inactive.push({ ..._data[i] });
          }
        }
        setCameras({ ...obj });
        // cameraHealthCheck();
      })
      .catch((err) => {
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Failed to fetch camera!",
          type: "alert",
          header: "Error",
        }));
        clearTimeout(timeout);
        resetModal();
      })
      .finally(() => {
        loadingFinished();
      });
  };
  const getCameraInterval = async () => {
    interval = setInterval(async () => {
      let response = await axiosApiInstance.get("camera?Layout=list");
      if (response?.status === 200) {
        let _data = response.data.Data;
        let obj = {
          active: [],
          inactive: [],
          all: [],
        };
        for (let i = 0; i < _data.length; i++) {
          obj.all.push({ ..._data[i] });
          if (_data[i].Type === "Active") {
            obj.active.push({ ..._data[i] });
          } else {
            obj.inactive.push({ ..._data[i] });
          }
        }
        setCameras({ ...obj });
      }
    }, 30000);
  };

  const deleteCamera = () => {
    setIsDeleting(true);
    setisConfirmDelete(false);
    axiosApiInstance
      .delete("camera?CameraID=" + camID)
      .then((res) => {
        getCamera();
        setIsDeleting(false);
      })
      .catch((err) => {
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Something went wrong!",
          type: "alert",
          header: "Error",
        }));
        clearTimeout(timeout);
        resetModal();
      })
      .finally(() => {
        setisConfirmDelete(false);
      });
  };

  const deleteNVR = () => {
    setIsDeleting(true);
    axios
      .get("http://192.168.1.5:8000/delete_nvr?nvr_name=" + nvrID)
      .then((res) => {
        NVRAPI();
      })
      .catch((err) => {
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Something went wrong!",
          type: "alert",
          header: "Error",
        }));
        clearTimeout(timeout);
        resetModal();
      })
      .finally(() => {
        setisConfirmDelete(false);
        setIsDeleting(false);
      });
  };

  useEffect(() => {
    document.title = "Camera";
    sessionStorage.removeItem("timer");
    getCamera();
    setTimeout(() => {
      getCameraInterval();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let ele = document.getElementById("fab1");
    if (ele) {
      if (isFloatOpen) {
        ele.style.animation = "none";
      } else {
        ele.style.animation = " beat 0.5s infinite alternate";
      }
    }
  }, [isFloatOpen]);

  const callFunc = (call) => {
    console.log(call);
  };
  return (
    <div className="__camera_wrapper__">
      <Toaster
        containerStyle={{
          top: 50,
        }}
        toastOptions={{
          style: {
            maxWidth: "525px",
          },
        }}
      />
      <Navbar navName="Camera ">
        <div style={{ display: "flex" }}>
          <div className="_filter_list_">
            <div className="fixed_activity">
              {/* <h4 className="title_">Filter</h4>
              <div
                className="view_switch"
                style={{
                  color: activeFilter === "Camera" ? "#fff" : "#000",
                }}
              >
                <p
                  style={{
                    color: activeFilter === "Camera" ? "#fff" : "#000",
                  }}
                  onClick={() => {
                    setActiveFilter("Camera");
                  }}
                >
                  Camera
                </p>
                <p
                  style={{
                    color: activeFilter === "NVR" ? "#fff" : "#000",
                  }}
                  onClick={() => setActiveFilter("NVR")}
                >
                  NVR
                </p>
                <div
                  className="active_view"
                  style={{
                    left: activeFilter === "Camera" ? "0%" : "50%",
                    color: activeFilter === "Camera" ? "#fff" : "#000",
                  }}
                ></div>
              </div> */}

              <h4 className="title_">Layout</h4>
              <div
                className="view_switch"
                style={{
                  color: activeView === "Grid" ? "#fff" : "#000",
                }}
              >
                <p
                  style={{
                    color: activeView === "Grid" ? "#fff" : "#000",
                  }}
                  onClick={() => {
                    setActiveView("Grid");
                    setviewAll((prevState) => ({
                      ...prevState,
                      isViewAll: false,
                      activeView: "",
                    }));
                  }}
                >
                  Grid
                </p>
                <p
                  style={{
                    color: activeView === "List" ? "#fff" : "#000",
                  }}
                  onClick={() => setActiveView("List")}
                >
                  List
                </p>
                <div
                  className="active_view"
                  style={{
                    left: activeView === "Grid" ? "0%" : "50%",
                    color: activeView === "Grid" ? "#fff" : "#000",
                  }}
                ></div>
              </div>
              <h2 className="title_">Actions</h2>

              <Button
                style={{
                  width: "8vw",
                  fontSize: "0.8vw",
                  marginBottom: "1.2vw",
                  marginTop: "1.2vw",
                }}
                onClick={() => {
                  getCamera();
                  cameraHealthCheck();
                }}
                type="gradient"
                name="Refresh Page"
              />
            </div>
          </div>

          {activeFilter === "Camera" && (
            <div className="_grid_">
              {!viewAll.isViewAll && activeView === "Grid" && (
                <div className="list_camera_container fadeIn">
                  {!isLoading &&
                    Cameras?.all?.length > 0 &&
                    Cameras?.all?.map((item) => (
                      <CameraCard
                        key={item.Camera_id}
                        data={item}
                        onDelete={(camIDEE) => {
                          camID = camIDEE;
                          setisConfirmDelete(true);
                        }}
                        history={history}
                        userType={userType}
                        onEdit={(data) => {
                          setIsDeleting(data);
                        }}
                        onEditDetail={(data) => {
                          setIsDeleting(true);
                          axiosApiInstance
                            .get("camera/configure_services")
                            .then((res) => {
                              setIsEditCamOpen(data);
                            })
                            .catch((err) => {
                              notify({
                                type: "alert",
                                msg: "Failed to Configure Services!",
                              });
                            })
                            .finally(() => {
                              setIsDeleting(false);
                            });
                        }}
                        handleGetCameraDetail={() => {
                          getCameraDetails();
                        }}
                        onViewDetail={(data) => {
                          setIsViewDetailOpen(data);
                        }}
                      />
                    ))}

                  {isLoading && [1].map((item) => <SkeletonCard key={item} />)}

                  {Cameras.all.length === 0 && !isLoading && (
                    <div className="no_camera">No Camera Added</div>
                  )}
                </div>
              )}

              {!viewAll.isViewAll && activeView === "List" && (
                <div className="grid_camera_container fadeIn">
                  <AppCard
                    // style={{
                    //   backgroundColor: "#ceeffb",
                    // }}
                    className={"adjust_slider"}
                    cornerShadow
                    handleViewAll={() => {
                      setviewAll((prevState) => ({
                        ...prevState,
                        isViewAll: true,
                        activeView: "active",
                      }));
                    }}
                    {...{
                      Description:
                        "These are the cameras on which usecases are currently active.",
                      Service_name: "Active Camera",
                    }}
                    usecases={Cameras?.active}
                    history={history}
                    CCOnDelete={(camIDEE) => {
                      camID = camIDEE;
                      setisConfirmDelete(true);
                    }}
                    CCUsertype={userType}
                    CConEdit={(data) => {
                      setIsDeleting(data);
                    }}
                    CConEditDetail={(data) => {
                      console.log(data);
                      setIsDeleting(true);
                      axiosApiInstance
                        .get("camera/configure_services")
                        .then((res) => {
                          setIsEditCamOpen(data);
                        })
                        .catch((err) => {
                          notify({
                            type: "alert",
                            msg: "Failed to Configure Services!",
                          });
                        })
                        .finally(() => {
                          setIsDeleting(false);
                        });
                    }}
                    CChandleGetCameraDetail={() => {
                      getCameraDetails();
                    }}
                    CConViewDetail={(data) => {
                      setIsViewDetailOpen(data);
                    }}
                    hideBtn
                  />

                  <AppCard
                    className={"adjust_slider2"}
                    // style={{
                    //   backgroundColor: "#f6c1c1",
                    // }}
                    cornerShadow
                    handleViewAll={() => {
                      setviewAll((prevState) => ({
                        ...prevState,
                        isViewAll: true,
                        activeView: "inactive",
                      }));
                    }}
                    {...{
                      Description:
                        "These are the cameras which are added into the system.",
                      Service_name: "Inactive Camera",
                    }}
                    usecases={Cameras?.inactive}
                    history={history}
                    CCOnDelete={(camIDEE) => {
                      camID = camIDEE;
                      setisConfirmDelete(true);
                    }}
                    CCUsertype={userType}
                    CConEdit={(data) => {
                      setIsDeleting(data);
                    }}
                    onEdit={(data) => {
                      setIsDeleting(data);
                    }}
                    CConEditDetail={(data) => {
                      console.log(data);
                      setIsDeleting(true);
                      axiosApiInstance
                        .get("camera/configure_services")
                        .then((res) => {
                          setIsEditCamOpen(data);
                        })
                        .catch((err) => {
                          notify({
                            type: "alert",
                            msg: "Failed to Configure Services!",
                          });
                        })
                        .finally(() => {
                          setIsDeleting(false);
                        });
                    }}
                    CChandleGetCameraDetail={() => {
                      getCameraDetails();
                    }}
                    CConViewDetail={(data) => {
                      setIsViewDetailOpen(data);
                    }}
                    hideBtn
                  />
                </div>
              )}

              {viewAll.isViewAll && (
                <BoxCard className="view_all_card fadeIn">
                  <div className="_span">
                    <i
                      className="material-icons a_back"
                      onClick={() => {
                        setviewAll((prevState) => ({
                          ...prevState,
                          isViewAll: false,
                          activeView: "",
                        }));
                      }}
                    >
                      arrow_back
                    </i>
                    {viewAll.activeView} Cameras
                  </div>
                  {Cameras[viewAll.activeView].map((item) => (
                    <CameraCard
                      key={item.Camera_id}
                      data={item}
                      onDelete={(camIDEE) => {
                        camID = camIDEE;
                        setisConfirmDelete(true);
                      }}
                      history={history}
                      userType={userType}
                      onEdit={(data) => {
                        setIsDeleting(data);
                      }}
                      onEditDetail={(data) => {
                        setIsDeleting(true);
                        axiosApiInstance
                          .get("camera/configure_services")
                          .then((res) => {
                            setIsEditCamOpen(data);
                          })
                          .catch((err) => {
                            notify({
                              type: "alert",
                              msg: "Failed to Configure Services!",
                            });
                          })
                          .finally(() => {
                            setIsDeleting(false);
                          });
                      }}
                      handleGetCameraDetail={() => {
                        getCameraDetails();
                      }}
                      onViewDetail={(data) => {
                        setIsViewDetailOpen(data);
                      }}
                    />
                  ))}
                </BoxCard>
              )}
            </div>
          )}
          {activeFilter === "NVR" && (
            <div className="_grid_">
              <NVR
                layout={viewAll}
                setIsDeleting={setIsDeleting}
                setisConfirmDelete={setisConfirmDelete}
                getNVRID={(data) => {
                  nvrID = data;
                }}
                dummyFuncc={(data) => {
                  NVRAPI = data;
                }}
              />
            </div>
          )}
          {userType !== "Operator" && (
            <div className="inner-fabs">
              <div
                className="fabb round"
                id="fab4"
                data-tooltip="Create"
                onClick={() => {
                  axiosApiInstance
                    .get("service/?all=true")
                    .then((resp) => {
                      if (resp.data.detail.length > 0) {
                        history.push("/camera/add");
                      } else {
                        msg = "Please download services first!";
                        open();
                        timeout = setTimeout(() => {
                          close();
                          setisFloatOpen(!isFloatOpen);
                          let innerFabs =
                            document.getElementsByClassName("inner-fabs")[0];
                          innerFabs.classList.toggle("show");
                        }, 5000);
                      }
                    })
                    .catch((err) => {
                      if (err.response.status === 404) {
                        msg = "Please download services first!";
                        open();
                        timeout = setTimeout(() => {
                          close();
                          setisFloatOpen(!isFloatOpen);
                          let innerFabs =
                            document.getElementsByClassName("inner-fabs")[0];
                          innerFabs.classList.toggle("show");
                        }, 5000);
                      }
                    });
                }}
              >
                <p>Add Camera Manually</p>
                <i className="material-icons">camera</i>
              </div>
              {/* {userType === "Superadmin" && (
                <div
                  className="fabb round"
                  id="fab3"
                  onClick={() => history.push("/nvr/add")}
                >
                  <p>Add NVR</p>
                  <i className="material-icons">add_to_queue</i>
                </div>
              )} */}

              {/* <div className="fab round" id="fab2" data-tooltip="Send">
                <i className="material-icons">send</i>
              </div> */}
            </div>
          )}

          <ReactTooltip delayShow={100} />
          {userType !== "Operator" && (
            <div
              className="fabb"
              data-tip="Add Camera"
              // data-tip="Add Camera / NVR"
              id="fab1"
              onClick={() => {
                setisFloatOpen(!isFloatOpen);
                let innerFabs =
                  document.getElementsByClassName("inner-fabs")[0];
                innerFabs.classList.toggle("show");
              }}
            >
              <i className="material-icons" id="fabIcon">
                add
              </i>
            </div>
          )}

          {isFloatOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.5,
              }}
              className="_modal_wrapper_"
              onClick={() => {
                setisFloatOpen(false);
                let innerFabs =
                  document.getElementsByClassName("inner-fabs")[0];
                innerFabs.classList.toggle("show");
              }}
            ></motion.div>
          )}
        </div>
      </Navbar>
      {showPassErrorModal.showPop && (
        <Modal
          className={"transparent_modal"}
          handleClose={() => {
            setshowPassErrorModal((prevState) => ({
              ...prevState,
              showPop: false,
            }));
          }}
          type={showPassErrorModal.type}
          errorHeader={showPassErrorModal.header}
          errorText={showPassErrorModal.msg}
        />
      )}
      {modalOpen && (
        <Modal
          modalOpen={modalOpen}
          handleClose={() => {
            setisFloatOpen(false);
            let innerFabs = document.getElementsByClassName("inner-fabs")[0];
            innerFabs.classList.remove("show");
            close();
            clearTimeout(timeout);
          }}
          type="alert"
          errorHeader="Error"
          errorText={msg}
        />
      )}
      {isDeleting && <Loading type={"transparent"} text={"Loading"} />}
      {isConfirmDelete && (
        <Modal
          onConfirm={() => {
            if (activeFilter === "NVR") {
              deleteNVR();
            } else {
              deleteCamera();
            }
          }}
          handleClose={() => {
            camID = "";
            setisConfirmDelete(false);
          }}
          type="confirm"
          errorHeader="Warning"
          errorText={
            "Are you sure you want to delete the " +
            activeFilter.toLowerCase() +
            "?"
          }
        />
      )}

      {isEditCamOpen && (
        <Modal
          className="edit_cam_pop"
          modalOpen={isEditCamOpen}
          handleClose={() => {
            setIsDeleting(true);
            axiosApiInstance
              .get("camera/finish_configure")
              .then((res) => {
                setUsername("");
                setPassword("");
                setOldType("password");
                setIsEditCamOpen(false);
              })
              .catch((err) => {
                notify({
                  type: "alert",
                  msg: "Failed to Configure Services!",
                });
              })
              .finally(() => {
                setIsDeleting(false);
              });
            ip.off("service_status");
          }}
        >
          <h1>Edit Camera Details</h1>
          <div
            className="close"
            onClick={() => {
              setIsDeleting(true);
              axiosApiInstance
                .get("camera/finish_configure")
                .then((res) => {
                  setUsername("");
                  setPassword("");
                  setOldType("password");
                  setIsEditCamOpen(false);
                })
                .catch((err) => {
                  notify({
                    type: "alert",
                    msg: "Failed to Configure Services!",
                  });
                })
                .finally(() => {
                  setIsDeleting(false);
                });
              ip.off("service_status");
              ip.off("service_status");
            }}
          >
            <i className="material-icons" style={{ color: "#fff" }}>
              close
            </i>
          </div>
          <div className="_flex_">
            <div className="cam_details2">
              <InputBox
                id="RTSPUsername"
                header="Username"
                onChange={(e) => {
                  const value = e.target.value;
                  const regex = /^[a-zA-Z0-9]*$/;
                  if (value.match(regex) || value === "") {
                    setUsername(value);
                  }
                }}
                error={errors["isUsernameEmpty"]}
                value={Username}
                onFocus={() => clearError("isUsernameEmpty")}
              />
              <InputBox
                id="password"
                error={errors["isPasswordEmpty"]}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    captureSnap();
                  }
                }}
              />
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "2vw",
                  marginBottom: "1vw",
                }}
              >
                <Button
                  style={{ width: "6vw" }}
                  onClick={captureSnap}
                  type="gradient"
                  name="Submit"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {isViewDetailOpen && (
        <Modal
          className={
            isViewDetailLoading ? "isLoading__Wrapper" : "pop_adjust__"
          }
          handleClose={() => {
            setIsViewDetailOpen(false);
            ip.off("service_status");
          }}
        >
          {isViewDetailLoading ? (
            <div className="isLoading__ s_loader"></div>
          ) : (
            <React.Fragment>
              <h1>View Details</h1>
              <div
                className="close"
                onClick={() => {
                  setIsViewDetailOpen(false);
                  ip.off("service_status");
                }}
              >
                <i className="material-icons" style={{ color: "#fff" }}>
                  close
                </i>
              </div>
              <div className="_flex_">
                <div className="cam_details">
                  <InputBox
                    id="name"
                    header="Camera Name"
                    disabled
                    value={CamData?.CameraDetails?.Camera_name}
                  />
                  <InputBox
                    id="Location"
                    header="Camera Location"
                    disabled
                    value={CamData?.CameraDetails?.Location}
                  />
                  <label
                    style={{
                      fontSize: " 0.78125vw",
                      color: "var(--text)",
                    }}
                  >
                    RTSP Link
                  </label>
                  <div className="rtsp_ta">
                    <p>{CamData?.CameraDetails?.Rtsp_link}</p>
                    <CopyToClipboard text={CamData?.CameraDetails?.Rtsp_link}>
                      <i className="material-icons adjust_copy">content_copy</i>
                    </CopyToClipboard>
                  </div>
                  <label
                    style={{
                      fontSize: " 0.78125vw",
                      color: "var(--text)",
                    }}
                  >
                    Test Image
                  </label>
                  <br />
                  <img
                    src={SOCKET_URL + CamData?.CameraDetails?.Test_image}
                    className="snap"
                    onError={(e) => {
                      e.target.src = Logo;
                    }}
                  />
                </div>
                <div className="alert_details">
                  {CamData?.UsecaseDetails?.length > 0 ? (
                    <div className="alert_data">
                      <div className="header">
                        <p>App</p>
                        <p>Status</p>
                      </div>
                      <Scrollbars
                        autoHeight
                        autoHeightMin={100}
                        autoHeightMax="10vw"
                      >
                        {CamData?.UsecaseDetails?.map((item) => (
                          <div className="alertStatus" key={item}>
                            <p>{item.replaceAll("_", " ")}</p>
                            {renderStatus(item) ? (
                              <i
                                className="material-icons"
                                style={{ color: "rgb(100, 228, 91)" }}
                              >
                                check_circle
                              </i>
                            ) : (
                              <i
                                className="material-icons"
                                style={{ color: "red" }}
                              >
                                close
                              </i>
                            )}
                            {/* <i className="material-icons" style={{ color: "#FFCF64" }}>
                        check_circle
                      </i> */}
                          </div>
                        ))}
                      </Scrollbars>
                    </div>
                  ) : (
                    <div className="no_data">NO APP IS RUNNING</div>
                  )}

                  {CamData?.AIDetails?.length > 0 ? (
                    <div className="alert_data">
                      <div className="header">
                        <p>AI</p>
                        <p>Status</p>
                      </div>
                      <Scrollbars
                        autoHeight
                        autoHeightMin={100}
                        autoHeightMax="10vw"
                      >
                        {CamData?.AIDetails?.map((item) => (
                          <div className="alertStatus" key={item}>
                            <p>{item.replaceAll("_", " ")}</p>
                            {renderStatus(item) ? (
                              <i
                                className="material-icons"
                                style={{ color: "rgb(100, 228, 91)" }}
                              >
                                check_circle
                              </i>
                            ) : (
                              <i
                                className="material-icons"
                                style={{ color: "red" }}
                              >
                                close
                              </i>
                            )}
                          </div>
                        ))}
                      </Scrollbars>
                    </div>
                  ) : (
                    <div className="no_data">NO AI IS ACTIVE</div>
                  )}
                </div>
              </div>
            </React.Fragment>
          )}
        </Modal>
      )}
    </div>
  );
}

export const CameraCard = ({
  data,
  onDelete,
  history,
  className,
  // handleOutsideClick,
  onEdit, //invokes loading screen
  onEditDetail,
  onViewDetail,
  handleGetCameraDetail,
}) => {
  const [isOpen, setisOpen] = useState(false);

  const handleClickOutside = (e) => {
    if (
      !e.target.classList.contains("btnn") &&
      !e.target.classList.contains("floating_menu")
    ) {
      var ele = document.querySelector(".floating_menu");
      if (ele) {
        ele.classList.add("exit_float_menu");
        timeout = setTimeout(() => {
          setisOpen(false);
          ele.classList.remove("exit_float_menu");
        }, 200);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      ip.off("service_status");
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <BoxCard
      className={className ? "adjust_cam_card " + className : "adjust_cam_card"}
    >
      {isOpen && (
        <motion.div
          initial={{
            width: 0,
            height: 0,
            padding: 0,
          }}
          animate={{
            width: "10.4166666667vw",
            height: "auto",
            padding: "inherit",
            paddingRight: "0.9vw",
          }}
          transition={{ duration: 0.3 }}
          className="floating_menu"
        >
          <button
            className="btnn"
            onClick={() => {
              setisOpen(false);
              activeCamDetails = { ...data };
              onViewDetail(true);
              handleGetCameraDetail();
              clearInterval(interval);
            }}
          >
            View Details
          </button>
          {userType !== "Operator" && (
            <button
              className="btnn"
              onClick={() => {
                setisOpen(false);
                onEditDetail(true);
                activeCamDetails = { ...data };
              }}
            >
              Edit Details
            </button>
          )}
          {userType !== "Operator" && (
            <button
              className="btnn"
              onClick={() => {
                setisOpen(false);
                onDelete(data.Camera_id);
              }}
            >
              Delete Camera
            </button>
          )}
          {userType !== "Operator" && (
            <button
              onClick={() => {
                clearInterval(interval);
                sessionStorage.removeItem("timer");
                onEdit(true);
                axiosApiInstance
                  .get("base/device")
                  .then((ress) => {
                    axiosApiInstance
                      .get("camera/configure_services")
                      .then((res) => {
                        let data_ = {
                          usecaseLimit: ress.data.Limitations.Usecase,
                          deepStreamLimit: ress.data.Limitations.Deepstream,
                          cameraLimit: ress.data.Limitations.Camera,
                        };
                        encryptStorage.setItem("LIM", data_);
                        history.push("camera/update/" + data.Camera_id);
                      })
                      .catch((err) => err.response)
                      .finally(() => {
                        onEdit(false);
                      });
                  })
                  .catch((err) => {
                    alert("Something Went Wrong in fetching Camera limit!");
                    onEdit(false);
                    console.log(err.response);
                  });
              }}
              className="btnn"
            >
              Add/Remove Apps
            </button>
          )}

          <img
            src={dots}
            className="dot_icon_active"
            onClick={() => {
              var ele = document.querySelector(".floating_menu");
              ele.classList.add("exit_float_menu");
              clearTimeout(timeout2);
              timeout2 = setTimeout(() => {
                setisOpen(false);
                ele.classList.remove("exit_float_menu");
              }, 200);
            }}
          />
        </motion.div>
      )}
      {!isOpen && (
        <img
          src={dots}
          className="dot_icon"
          onClick={() => {
            clearTimeout(timeout2);
            setTimeout(() => {
              setisOpen(true);
            }, 200);
          }}
        />
      )}

      <img
        src={SOCKET_URL + data.Test_image + "?" + Math.random()}
        className="cam_image"
        onError={(e) => {
          e.target.src = Logo;
        }}
      />
      <div className="can_info">
        <div className="_flex">
          <h2 title={data.Camera_name}>{data.Camera_name}</h2>
          <div className="inline">
            <p>Camera Status :</p>
            {data.Camera_status ? (
              <i className="material-icons" style={{ color: "#64E45B" }}>
                check_circle
              </i>
            ) : (
              <i className="material-icons" style={{ color: "#FF3465" }}>
                cancel
              </i>
            )}
          </div>
        </div>

        <div className="_flex">
          <div className="inline">
            <i className="material-icons" style={{ color: "var(--primary)" }}>
              location_on
            </i>
            {/* {items.Description.length > 75
              ? items.Description.substring(0, 75) + "..."
              : items.Description} */}
            <h3 title={data.Location}>
              {data.Location.length > 18
                ? data.Location.substring(0, 18) + "..."
                : data.Location}
            </h3>
          </div>
          <div className="inline">
            <p>Model Status :</p>
            {data.Ai_status ? (
              <i className="material-icons" style={{ color: "#64E45B" }}>
                check_circle
              </i>
            ) : (
              <i className="material-icons" style={{ color: "#FF3465" }}>
                cancel
              </i>
            )}
          </div>
        </div>
      </div>
    </BoxCard>
  );
};

const SkeletonCard = () => {
  return (
    <div className="skeleton skeleton--card">
      <div className="skeleton--content">
        <div className="skeleton--content-wrapper">
          <div className="s_loader skeleton--title"></div>
        </div>
        <div className="skeleton--content-wrapper2">
          <div className="s_loader skeleton--line"></div>
          <div className="s_loader skeleton--line"></div>
          <div className="s_loader skeleton--line"></div>
        </div>
      </div>
    </div>
  );
};
