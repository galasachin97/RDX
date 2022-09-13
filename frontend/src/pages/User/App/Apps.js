import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import AppCard, { UCCard } from "../../../components/AppCard/AppCard";
import Button from "../../../components/Button/Button";
import { BoxCard } from "../../../components/card/Card";
import Dropdown from "../../../components/Dropdown/Dropdown";
import Modal from "../../../components/Modal/Modal";
import Navbar from "../../../components/Navbar/Navbar";
import { axiosApiInstance } from "../../../helper/request";
import useLoading from "../../../helper/useLoading";
import { SOCKET_URL } from "../../../helper/request";
import { motion } from "framer-motion";
import socketio from "socket.io-client";
import "./apps.scss";
import Loading from "../../../components/Loading/Loading";
import ReactHlsPlayer from "react-hls-player/dist";
import {
  AppearanceUpload,
  notify,
} from "../Setting/Appearance/AppearanceSetting";
let isFiltered = false;
let maxDate = null;
let minDate = null;
let _parent_id = null;
let timeout = "";
let socket = null;
let downloadSocket = null;
let updateSocket = null;
let downloadAllSocket = null;
let globalSocket = null;
let selectedID = null;
let resLink = null;
let _interval = null;
let _link = null;
let _copyLink = null;
export default function Apps({ adata }) {
  let history = useHistory();
  const { isLoading, loadingFinished, loading } = useLoading();
  const [Type, setType] = useState("");
  const [DownloadAllDisable, setDownloadAllDisable] = useState(false);
  const [UpdateAllDisable, setUpdateAllDisable] = useState(false);
  const [isApplyDisabled, setisApplyDisabled] = useState(true);
  const [search, setSearch] = useState("");
  const [appData, setAppData] = useState({});
  const [Status, setStatus] = useState("");
  const [startDate, setstartDate] = useState("");
  const [viewAll, setviewAll] = useState(false);
  const [isLiveFeedOpen, setIsLiveFeedOpen] = useState(false);
  const [loadingScreen, setLoadingScreen] = useState(false);
  const [endtDate, setendtDate] = useState("");
  const [isEditDisabled, setisEditDisabled] = useState(true);
  const [selectedAI, setselectedAI] = useState({
    title: "",
  });

  const [streamLink, setstreamLink] = useState(null);

  const [UploadModel, setUploadModel] = useState({
    isOpen: false,
    primaryFile: null,
    secondaryFile: null,
    serviceId: "",
    typeOptions: ["Deepstream"],
    selectedType: "",
  });
  const [showPassErrorModal, setshowPassErrorModal] = useState({
    showPop: false,
    msg: "",
    type: "",
    header: "",
  });

  const resetModal = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setshowPassErrorModal((prevState) => ({
        ...prevState,
        showPop: false,
        msg: "",
        type: "alert",
        header: "Error",
      }));
    }, 3000);
  };

  const convertUTCTime = (time) => {
    let utcDateTime = new Date(time);
    return (
      utcDateTime.getUTCFullYear() +
      "-" +
      String(utcDateTime.getUTCMonth() + 1).padStart(2, "0") +
      "-" +
      String(utcDateTime.getUTCDate()).padStart(2, "0") +
      "T" +
      utcDateTime.getUTCHours() +
      ":" +
      utcDateTime.getUTCMinutes()
    );
  };
  const setIntialTime = () => {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yy = today.getFullYear();
    var hrs = today.getHours();
    if (hrs.toString().length < 2) hrs = "0" + hrs;
    var mnt = today.getMinutes();
    if (today.getMinutes() < 10) {
      mnt = "0" + today.getMinutes();
    }
    // setstartDate(yy + "-" + mm + "-" + dd + "T" + "00:00");
    // setendtDate(yy + "-" + mm + "-" + dd + "T" + hrs + ":" + mnt);
    maxDate = yy + "-" + mm + "-" + dd + "T" + "00:00";

    let last30days = new Date(today.setDate(today.getDate() - 30));
    var dd = String(last30days.getDate()).padStart(2, "0");
    var mm = String(last30days.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yy = last30days.getFullYear();
    var hrs = last30days.getHours();
    var mnt = last30days.getMinutes();
    if (last30days.getMinutes() < 10) {
      mnt = "0" + last30days.getMinutes();
    }
    minDate = yy + "-" + mm + "-" + dd + "T" + "00:00";
  };

  const postLiveStart = (_id) => {
    axiosApiInstance
      .get("service/live/start?serviceId=" + _id + "&link=" + resLink)
      .then((res) => {
        setstreamLink(res.data.link);
        _link = res.data.link;
        _copyLink = res.data.link;
        setIsLiveFeedOpen(true);
        _interval = setInterval(() => {
          console.log(_copyLink, _link);
          if (_copyLink) {
            setstreamLink(null);
            _copyLink = null;
          } else {
            setstreamLink(_link);
            _copyLink = _link;
          }
        }, 2000);
      })
      .catch((err) => {
        setLoadingScreen(false);

        notify({
          type: "alert",
          msg: "Server Error!",
        });
      });
  };

  const downloadAllApp = () => {
    setDownloadAllDisable(true);
    axiosApiInstance
      .post("service/download/all")
      .then((res) => {
        setDownloadAllDisable(false);
        downloadAllSocket = socketio(SOCKET_URL);
        globalSocket = socketio(SOCKET_URL);
        adata({
          open: true,
          msg: "All services will be downloaded!",
          type: "success",
        });

        downloadAllSocket.on("service_download", (data) => {
          let taskName = data.detail.taskName.split(":");
          console.log(taskName);
          adata({
            open: true,
            msg:
              data.detail.status === "True" || data.detail.status
                ? taskName[0].replaceAll("_", " ") + " Downloaded Successfully"
                : taskName[0].replaceAll("_", " ") + " Download Failed",
            type:
              data.detail.status === "True" || data.detail.status
                ? "success"
                : "alert",
          });
        });

        globalSocket.on("downloadall", (data) => {
          console.log("GLOBAL DATA");
          console.log(data);
          if (Object.keys(data).length > 0) {
            adata({
              open: true,
              msg:
                data.status === "True" || data.status
                  ? "All Services are Downloaded Successfully"
                  : "Failed to Download all Services",
              type: data.status === "True" || data.status ? "success" : "alert",
            });
            if (window.location.pathname.includes("app")) {
              if (viewAll) {
                getFilterSearch2(true);
              } else if (search) {
                getFilterSearch2(false);
              } else {
                getApp();
              }
            }
            globalSocket.off("downloadall");
            downloadAllSocket.off("service_download");
          }
        });
      })
      .catch((err) => {
        adata({
          open: true,
          msg: "All Services are Downloaded",
          type: "alert",
        });
        setDownloadAllDisable(false);
      });
  };

  const updateAllApp = () => {
    setUpdateAllDisable(true);
    axiosApiInstance
      .post("service/update/all")
      .then((res) => {
        setUpdateAllDisable(false);
        downloadAllSocket = socketio(SOCKET_URL);
        globalSocket = socketio(SOCKET_URL);
        adata({
          open: true,
          msg: "All Services will be updated soon!",
          type: "success",
        });

        downloadAllSocket.on("service_update", (data) => {
          let taskName = data.detail.taskName.split(":");
          console.log(taskName);
          adata({
            open: true,
            msg:
              data.detail.status === "True" || data.detail.status
                ? taskName[0].replaceAll("_", " ") + " Updated Successfully"
                : taskName[0].replaceAll("_", " ") + " Update Failed",
            type:
              data.detail.status === "True" || data.detail.status
                ? "success"
                : "alert",
          });
        });

        globalSocket.on("updateall", (data) => {
          console.log("GLOBAL DATA");
          console.log(data);
          if (Object.keys(data).length > 0) {
            adata({
              open: true,
              msg:
                data.status === "True" || data.status
                  ? "All Services are Updated Successfully"
                  : "Failed to Update all Services",
              type: data.status === "True" || data.status ? "success" : "alert",
            });
            if (window.location.pathname.includes("app")) {
              if (viewAll) {
                getFilterSearch2(true);
              } else if (search) {
                getFilterSearch2(false);
              } else {
                getApp();
              }
            }
            globalSocket.off("updateall");
            downloadAllSocket.off("service_update");
          }
        });
      })
      .catch((err) => {
        setUpdateAllDisable(false);
        adata({
          open: true,
          msg: "All Services are up-to-date",
          type: "alert",
        });
      });
  };

  const refreshModules = () => {
    loading();
    axiosApiInstance
      .get("service/refresh")
      .then((res) => {})
      .catch((err) => {
        loadingFinished();
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Error while refreshing modules.",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

  const getApp = () => {
    axiosApiInstance
      .get("service/apps")
      .then((res) => {
        loadingFinished();
        setAppData({ ...res.data.detail });
        getCamera();
      })
      .catch((err) => {
        loadingFinished();
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Error while fetching apps.",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

  const getCamera = () => {
    axiosApiInstance
      .get("camera")
      .then((res) => {
        setisEditDisabled(res.data.Data.length === 0);
        loadingFinished();
        // setCameras();
      })
      .catch((err) => {
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Error while fetching Camera.",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
    // .finally(() => {
    //   loadingFinished();
    // });
  };

  const getFilterSearch = (isAll = false) => {
    isFiltered = true;
    let url = null;
    if (!isAll) {
      setstartDate("");
      setendtDate("");
      setisApplyDisabled(true);
      setType("");
      setAppData([]);
      setStatus("");
      setIntialTime();
      url = "service/?text=" + search;
    } else {
      url = "service/?all=true";
      if (startDate) {
        if (!endtDate) {
          alert("end date required");
          return;
        }
        url +=
          "&start_timestamp=" +
          convertUTCTime(startDate) +
          "&end_timestamp=" +
          convertUTCTime(endtDate);
      }

      if (Type) {
        url += "&type=" + Type;
      }
      if (Status) {
        url += "&status=" + Status;
      }
    }
    setLoadingScreen(true);
    axiosApiInstance
      .get(url)
      .then((res) => {
        console.log(res.data.detail);
        if (viewAll) {
          setviewAll(false);
        }

        setAppData([...res.data.detail]);
      })
      .catch((err) => {
        isFiltered = false;
        setAppData([]);
        // setshowPassErrorModal((prevState) => ({
        //   ...prevState,
        //   showPop: true,
        //   msg: "Something went wrong while filtering data.",
        //   type: "alert",
        //   header: "Error",
        // }));
        // resetModal();
      })
      .finally(() => {
        setLoadingScreen(false);
      });
  };

  const getFilterSearch2 = (isAll = false) => {
    isFiltered = true;
    let url = null;
    if (!isAll) {
      url = "service/?text=" + search;
    } else {
      url = "service/?all=true";

      if (startDate) {
        if (!endtDate) {
          alert("end date required");
          return;
        }
        url +=
          "&start_timestamp=" +
          convertUTCTime(startDate) +
          "&end_timestamp=" +
          convertUTCTime(endtDate);
      }
      // url =
      //   "service/?start_timestamp=" +
      //   convertUTCTime(startDate) +
      //   "&end_timestamp=" +
      //   convertUTCTime(endtDate);

      url += "&parent_id=" + _parent_id;
    }
    axiosApiInstance
      .get(url)
      .then((res) => {
        setAppData([...res.data.detail]);
      })
      .catch((err) => {
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Something went wrong while filtering data.",
          type: "alert",
          header: "Error",
        }));
        resetModal();
        setAppData([]);
      });
  };

  useEffect(() => {
    refreshModules();
    getApp();
    setIntialTime();
    document.title = "Apps";
    return () => {
      if (streamLink) {
        axiosApiInstance.delete("service/live/stop");
      }
      isFiltered = false;
      setAppData({});
      setviewAll(false);
    };
  }, []);

  useEffect(() => {
    if (viewAll) {
      getFilterSearch2(true);
    }
  }, [viewAll]);

  const handleClear = (all) => {
    isFiltered = false;
    setstartDate("");
    setendtDate("");
    setisApplyDisabled(true);
    setType("");
    setStatus("");
    setAppData([]);
    setSearch("");
    setIntialTime();
    setviewAll(false);
    getApp();
  };

  const postUpdate = (items) => {
    if (items.Status !== "updating") {
      axiosApiInstance
        .post("service/update", {
          serviceId: items.Service_name,
        })
        .then((res) => {
          if (res.status === 200) {
            adata({
              open: true,
              msg: items.Service_name.replaceAll("_", " ") + " is updating!",
              type: "success",
            });
            updateSocket = socketio(SOCKET_URL);
            updateSocket.on("service_update", (data) => {
              let taskName = data.detail.taskName.split(":");
              adata({
                open: true,
                msg:
                  data.detail.status === "True"
                    ? taskName[1].replaceAll("_", " ") + " Updated Successfully"
                    : taskName[1].replaceAll("_", " ") + " Update Failed",
                type: data.detail.status === "True" ? "success" : "alert",
              });

              if (window.location.pathname.includes("app")) {
                if (viewAll) {
                  getFilterSearch2(true);
                } else if (search) {
                  getFilterSearch2(false);
                } else {
                  getApp();
                }
              }
              updateSocket.off("service_update");
            });
          }
        })
        .catch((err) => {
          let _msg = "Something went wrong!";
          if (err.response.status === 404) {
            _msg = "No Update Available";
          } else {
            _msg = "Something went wrong!";
          }
          setshowPassErrorModal((prevState) => ({
            ...prevState,
            showPop: true,
            msg: _msg,
            type: "alert",
            header: "Error",
          }));
          resetModal();
        });
    }
  };

  const postUninstall = (items) => {
    axiosApiInstance
      .post("service/uninstall", {
        serviceId: items.Service_name,
      })
      .then((res) => {
        if (res.status === 200) {
          adata({
            open: true,
            msg: items.Service_name.replaceAll("_", " ") + " is uninstalling!",
            type: "success",
          });
          socket = socketio(SOCKET_URL);
          socket.on("service_uninstall", (message) => {
            let taskName = message.detail.taskName.split(":");

            adata({
              open: true,
              msg:
                message.detail.status === "True"
                  ? taskName[1].replaceAll("_", " ") +
                    " Uninstalled Successfully"
                  : taskName[1].replaceAll("_", " ") + " Uninstall Failed",
              type: message.detail.status === "True" ? "success" : "alert",
            });

            if (window.location.pathname.includes("app")) {
              if (viewAll) {
                getFilterSearch2(true);
              } else if (search) {
                getFilterSearch2(false);
              } else {
                getApp();
              }
            }

            socket.off("service_uninstall");
          });
        }
      })
      .catch((err) => {
        let _msg = "Something went wrong!";
        if (err.response?.status === 403) {
          _msg = "App is currently active!";
        } else {
          _msg = "Something went wrong!";
        }

        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: _msg,
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

  const postDownload = (items) => {
    axiosApiInstance
      .post("service/download", {
        serviceId: items.Service_name,
      })
      .then((res) => {
        if (res.status === 200) {
          adata({
            open: true,
            msg: items.Service_name.replaceAll("_", " ") + " is downloading!",
            type: "success",
          });

          if (window.location.pathname.includes("app")) {
            if (viewAll) {
              getFilterSearch2(true);
            } else if (search) {
              getFilterSearch2(false);
            } else {
              getApp();
            }
          }

          downloadSocket = socketio(SOCKET_URL);
          downloadSocket.on("service_download", (data) => {
            let taskName = data.detail.taskName.split(":");

            adata({
              open: true,
              msg:
                data.detail.status === "True"
                  ? taskName[1].replaceAll("_", " ") +
                    " Downloaded Successfully"
                  : taskName[1].replaceAll("_", " ") + " Download Failed",
              type: data.detail.status === "True" ? "success" : "alert",
            });
            if (window.location.pathname.includes("app")) {
              if (viewAll) {
                getFilterSearch2(true);
              } else if (search) {
                getFilterSearch2(false);
              } else {
                getApp();
              }
            }
            downloadSocket.off("service_download");
          });
        }
      })
      .catch((err) => {
        let _msg = "Something went wrong!";
        if (err.response.status === 404) {
          _msg = "No Update Available";
        } else {
          _msg = "Something went wrong!";
        }
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: _msg,
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

  const postZipData = (file, idee) => {
    console.log(file);
    if (file.type !== "application/x-zip-compressed") {
      adata({
        open: true,
        msg: "Only ZIP file allowed!",
        type: "alert",
      });
      return;
    }
    let formData = new FormData();
    formData.append("zip", file, file.name);
    setLoadingScreen(true);
    axiosApiInstance
      .post("service/upload/ai?serviceId=" + idee, formData)
      .then((res) => {
        adata({
          open: true,
          msg: "ZIP file uploaded successfully!",
          type: "success",
        });
      })
      .catch((err) => {
        adata({
          open: true,
          msg: "ZIP file upload failed successfully!",
          type: "alert",
        });
      })
      .finally(() => {
        setLoadingScreen(false);
      });
  };
  useEffect(() => {
    console.log(Type, Status, startDate, endtDate);
    if (Type) {
      setisApplyDisabled(false);
    } else if (Status) {
      setisApplyDisabled(false);
    } else {
      setisApplyDisabled(true);
    }
    if (startDate) {
      if (endtDate) {
        setisApplyDisabled(false);
      } else {
        setisApplyDisabled(true);
      }
    }
  }, [Type, Status, startDate, endtDate]);

  return (
    <div className="__apps_wrapper__">
      <Navbar
        navName="Apps"
        searchValue={search}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        onKeyDown={() => {
          if (search === "") {
            isFiltered = false;
            handleClear();
          } else {
            getFilterSearch(false);
          }
        }}
        getApp={getApp}
      >
        <div style={{ display: "flex" }}>
          <div className="_setting_list_">
            <div className="fixed_activity">
              <h2 className="title_">Actions</h2>
              <div className="actions__">
                <Button
                  style={{ width: "7vw" }}
                  name="Update All"
                  onClick={updateAllApp}
                  disabled={UpdateAllDisable}
                />
                <div style={{ height: "1.5vw" }} />
                <Button
                  style={{ width: "7vw" }}
                  name="Download All"
                  onClick={downloadAllApp}
                  disabled={DownloadAllDisable}
                />
              </div>
              <h2 className="title_">Filters</h2>
              <Dropdown
                className="adjust_dd"
                optionsList={["Usecase", "AI"]}
                handleOption={(data) => {
                  setType(data);
                }}
                defaultText={Type}
                label="Type"
              />
              <Dropdown
                className="adjust_dd"
                optionsList={[
                  "active",
                  "inactive",
                  "downloading",
                  "downloaded",
                  "suspended",
                  "purchased",
                ]}
                handleOption={(data) => {
                  setStatus(data);
                }}
                defaultText={Status}
                label="Status"
              />
              <div className="date_time">
                <p className="time-label">Start Date and Time</p>
                <input
                  id="startDate"
                  type="datetime-local"
                  className=""
                  style={{ fontWeight: "bold", width: "92%" }}
                  value={startDate}
                  onChange={(e) => {
                    console.log(e);
                    let tsMAX = new Date(e.target.value).getTime();
                    let tsMIN = new Date(endtDate).getTime();
                    if (tsMAX > tsMIN) {
                      alert("GREATER THAN START");
                    } else {
                      setstartDate(e.target.value);
                      setSearch("");
                    }
                  }}
                  max={maxDate}
                  // min={minDate}
                />
              </div>
              <div className="date_time">
                <p className="time-label">End Date and Time</p>
                <input
                  style={{ fontWeight: "bold", width: "92%" }}
                  id="endDate"
                  type="datetime-local"
                  className=""
                  onChange={(e) => {
                    let tsMAX = new Date(startDate).getTime();
                    let tsMIN = new Date(e.target.value).getTime();

                    if (tsMAX > tsMIN) {
                      alert("GREATER THAN START");
                    } else {
                      setendtDate(e.target.value);
                      setSearch("");
                    }
                  }}
                  value={endtDate}
                  max={maxDate}
                  min={startDate}
                  disabled={!startDate}
                />
              </div>
              <div style={{ marginTop: "2vw" }}>
                <Button
                  style={{ width: "7vw" }}
                  name="Apply"
                  onClick={() => getFilterSearch(true)}
                  disabled={isApplyDisabled}
                />
                <Button
                  style={{ width: "7vw" }}
                  onClick={() => {
                    loading();
                    handleClear(true);
                  }}
                  type="gradient"
                  name="Clear"
                  // onClick={() => history.push("/alerts")}
                  // disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="_grid_">
            {!isFiltered && appData.length === 0 && !isLoading && (
              <div className="uc_map2">
                <p>NO DATA</p>
              </div>
            )}
            <ReactTooltip
              delayShow={500}
              id="global2"
              className="r_tt_adjust"
            />
            {!viewAll &&
              (isFiltered ? (
                <div className="uc_map">
                  {appData.length === 0 ? (
                    <p>NO DATA</p>
                  ) : (
                    Array.isArray(appData) &&
                    appData?.map((item, index) => (
                      <UCCard
                        isEditDisabled={isEditDisabled}
                        onUpdateClick={() => postUpdate(item)}
                        onUninstallClick={() => postUninstall(item)}
                        onDownloadClick={() => postDownload(item)}
                        name={"slide" + index}
                        {...item}
                        soloRender={true}
                        history={history}
                        key={item.Service_id}
                        editLoading={(data) => setLoadingScreen(data)}
                        onLiveFeedClick={() => {
                          // setIsLiveFeedOpen(true)
                          setLoadingScreen(true);
                          axiosApiInstance
                            .delete("service/live/stop")
                            .then((res) => {
                              axiosApiInstance
                                .get(
                                  "service/live/details?serviceId=" +
                                    item.Service_id
                                )
                                .then((res) => {
                                  resLink = res.data.detail;
                                  postLiveStart(item.Service_id);
                                })
                                .catch((err) => {
                                  console.log(err);
                                  setLoadingScreen(false);
                                  notify({
                                    type: "alert",
                                    msg: "Live view cant be fetched!",
                                  });
                                });
                            });
                        }}
                        onDefaultClick={() => {
                          axiosApiInstance
                            .post(
                              "service/default?serviceId=" +
                                item.Service_id +
                                "&type=primary",
                              {}
                            )
                            .then((res) => {
                              notify({
                                type: "success",
                                msg: "Default model will be applied soon!",
                              });
                              socket = socketio(SOCKET_URL);
                              socket.on("unzip_process", (data) => {
                                console.log(data);
                                if (data === "Folder not exist") {
                                  notify({
                                    type: "alert",
                                    msg: "Model does not exist.",
                                  });
                                } else {
                                  notify({
                                    type: "success",
                                    msg: "Default Model applied successfully!",
                                  });
                                }
                                socket.close();
                              });
                            })
                            .catch((err) => {
                              notify({
                                type: "alert",
                                msg: "Server Error",
                              });
                            })
                            .finally(() => {
                              setLoadingScreen(false);
                            });
                        }}
                        onUploadClick={() => {
                          selectedID = item.Service_id;
                          setUploadModel((prev) => ({
                            ...prev,
                            isOpen: true,
                          }));
                        }}
                      />
                    ))
                  )}
                </div>
              ) : (
                Object.keys(appData)?.map((item) => (
                  <AppCard
                    isEditDisabled={isEditDisabled}
                    key={appData[item].Service_id}
                    usecases={appData[item].usecases}
                    {...appData[item]}
                    postUninstall={postUninstall}
                    postUpdate={postUpdate}
                    postDownload={postDownload}
                    history={history}
                    type="usecase"
                    handleViewAll={(data) => {
                      _parent_id = item;
                      setviewAll(true);
                      setselectedAI((prevState) => ({
                        ...prevState,
                        title: appData[item].Service_name.replaceAll("_", " "),
                      }));
                    }}
                    editLoading={(data) => setLoadingScreen(data)}
                  />
                ))
              ))}

            {viewAll && appData.length > 0 && (
              <BoxCard className="view_all_card fadeIn">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <i
                    className="material-icons a_back"
                    onClick={() => {
                      loading();
                      handleClear();
                    }}
                  >
                    arrow_back
                  </i>
                  <h1>{selectedAI.title}</h1>
                </div>

                <div className="uc_map">
                  {appData?.map((item, index) => (
                    <UCCard
                      isEditDisabled={isEditDisabled}
                      onUpdateClick={() => postUpdate(item)}
                      onUninstallClick={() => postUninstall(item)}
                      onDownloadClick={() => postDownload(item)}
                      name={"slide" + index}
                      {...item}
                      soloRender={true}
                      history={history}
                      key={item.Service_id}
                      editLoading={(data) => setLoadingScreen(data)}
                    />
                  ))}
                </div>
              </BoxCard>
            )}
            {isLoading && (
              <div>
                <SkeletonCard />
              </div>
            )}
          </div>
        </div>
      </Navbar>
      {showPassErrorModal.showPop && (
        <Modal
          className={"transparent_modal t_modal"}
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
      {loadingScreen && <Loading type={"transparent"} text={"Loading"} />}

      {isLiveFeedOpen && (
        <Modal
          className={"pop_adjust__"}
          handleClose={() => {
            axiosApiInstance.delete("service/live/stop").then((res) => {
              setstreamLink(null);
              setIsLiveFeedOpen(false);
            });
          }}
        >
          <React.Fragment>
            <div
              className="close"
              onClick={() => {
                axiosApiInstance.delete("service/live/stop").then((res) => {
                  setstreamLink(null);
                  setIsLiveFeedOpen(false);
                });
              }}
            >
              <i className="material-icons" style={{ color: "#fff" }}>
                close
              </i>
            </div>
            <div className="_flex_">
              <div className="video_wrapper_">
                {console.log(SOCKET_URL, streamLink)}
                <ReactHlsPlayer
                  src={SOCKET_URL + streamLink}
                  onLoadedData={(e) => {
                    clearInterval(_interval);
                    setLoadingScreen(false);
                  }}
                  controls={false}
                  width="100%"
                  className="hls-player_"
                  autoPlay
                  muted
                  id="hls"
                />
                <i
                  className={"material-icons fullscreen"}
                  onClick={() => {
                    const ele = document
                      .getElementById("hls")
                      .requestFullscreen();
                  }}
                >
                  fullscreen
                </i>
              </div>
            </div>
          </React.Fragment>
        </Modal>
      )}
      {UploadModel.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.4,
          }}
          className="model_upload_pop_"
        >
          <div id="add_user" className="detail_container fadeIn">
            <h1>Upload Model</h1>
            <div
              className="close"
              onClick={() => {
                setUploadModel((prev) => ({
                  ...prev,
                  isOpen: false,
                  primaryFile: null,
                  secondaryFile: null,
                  serviceId: "",
                  selectedOption: "",
                }));
              }}
            >
              <i className="material-icons" style={{ color: "#fff" }}>
                close
              </i>
            </div>
            <Dropdown
              className="adjust_dd"
              optionsList={UploadModel.typeOptions}
              handleOption={(data) => {
                // console.log(data);
                // setselectedAI(data);
              }}
              defaultText={UploadModel.selectedType}
              label="Select type"
            />
            <AppearanceUpload
              name="Upload primary"
              value={UploadModel.primaryFile}
              type=".zip"
              onChange={(e) => {
                if (e.target.value) {
                  if (
                    e.target.files[0].type === "application/x-zip-compressed" ||
                    e.target.files[0].type === "application/zip"
                  ) {
                    setUploadModel((prev) => ({
                      ...prev,
                      primaryFile: e.target.files[0],
                    }));
                  } else {
                    notify({
                      type: "alert",
                      msg: "Please select only zip file!",
                    });
                  }
                } else {
                  setUploadModel((prev) => ({
                    ...prev,
                    primaryFile: null,
                  }));
                }
              }}
              defaultText="Object detection model"
            />
            {/* <AppearanceUpload
              name="Upload secondary"
              value={UploadModel.secondaryFile}
              type=".zip"
              onChange={(e) => {
                if (e.target.value) {
                  setUploadModel((prev) => ({
                    ...prev,
                    secondaryFile: e.target.files[0],
                  }));
                } else {
                  setUploadModel((prev) => ({
                    ...prev,
                    secondaryFile: null,
                  }));
                }
              }}
              defaultText="Classification model"
            /> */}
            <div className="btn__">
              <p className="skip">Skip</p>
              <Button
                style={{ width: "5.2vw" }}
                // onClick={postData}
                onClick={() => {
                  setLoadingScreen(true);
                  let formData = new FormData();
                  formData.append(
                    "zip_file",
                    UploadModel.primaryFile,
                    UploadModel.primaryFile.name
                  );
                  axiosApiInstance
                    .post(
                      "service/add?serviceId=" + selectedID + "&type=primary",
                      formData
                    )
                    .then((res) => {
                      notify({
                        type: "success",
                        msg: "File uploaded successfully!",
                      });
                      socket = socketio(SOCKET_URL);
                      socket.on("unzip_process", (data) => {
                        notify({
                          type: "success",
                          msg: "Model uploaded successfully!",
                        });
                        socket.close();
                      });
                    })
                    .catch((err) => {
                      notify({
                        type: "alert",
                        msg: "ZIP file failed",
                      });
                    })
                    .finally(() => {
                      setLoadingScreen(false);
                    });
                }}
                type="gradient"
                name="Submit"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

const SkeletonCard = () => {
  return (
    <div className="skeleton skeleton--card">
      <div className="skeleton--content">
        <div style={{ width: "100%", flex: "1", alignSelf: "center" }}>
          <div className="s_loader skeleton--line" />
          <div className="s_loader skeleton--line" />
          <div className="s_loader skeleton--line" />
        </div>
        <div style={{ width: "100%", flex: "2", overflow: "hidden" }}>
          <div className="s_loader skeleton--title"></div>
        </div>
      </div>
    </div>
  );
};
