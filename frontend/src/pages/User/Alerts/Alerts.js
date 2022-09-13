import { motion } from "framer-motion";
import React, { useEffect, useRef, useState, useCallback } from "react";
import logo from "../../../assets/images/Logo.jpg";
import Button from "../../../components/Button/Button";
import Dropdown from "../../../components/Dropdown/Dropdown";
import Navbar from "../../../components/Navbar/Navbar";
import Pagination from "../../../components/Pagination/Pagination";
import { Radio } from "../../../components/Radio/Radio";
import Table from "../../../components/Table/Table";
import { axiosApiInstance } from "../../../helper/request";
import useModal from "../../../helper/useModal";
import "./alerts.scss";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Modal from "../../../components/Modal/Modal";
import { SOCKET_URL } from "../../../helper/request";
import socketio from "socket.io-client";
import { BoxCard } from "../../../components/card/Card";
import useLoading from "../../../helper/useLoading";
import { encryptStorage } from "../../../helper/storage";
import ReactHlsPlayer from "react-hls-player";
import Scrollbars from "react-custom-scrollbars";
import { NotificationCard } from "../Home/Home";
import Loading from "../../../components/Loading/Loading";
import { notify } from "../Setting/Appearance/AppearanceSetting";
import { Prompt } from "react-router-dom";
import { useHistory } from "react-router";
let userType = "Operator";
let isAllSelected = false;
let maxDate = null;
let minDate = null;
let alertCamData = {};
let socket = null;
let timeout = "";
let t_no = "";
let total_data = 0;
let type = "all";
let resLink = null;
let _interval = null;
let _link = null;
let _copyLink = null;
let streamTimeout = 60;
let stop = false;
let selecteNotification = "";
export default function Alerts() {
  const childRef = useRef();
  const handleAfterChange = (index) => {
    setcurrentSlide(index);
  };
  const [currentSlide, setcurrentSlide] = useState(0);
  const [TotalPages, setTotalPages] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [CurrentPage, setCurrentPage] = useState(1);
  const [isConfirm, setIsConfirm] = useState(false);
  const [loadingScreen, setLoadingScreen] = useState(false);
  const [counter, setCounter] = useState(-1);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    accessibility: true,
    afterChange: handleAfterChange,
  };
  const [data, setData] = useState([]);
  const [header, setheader] = useState([
    "",
    "Sr. No.",
    "Camera Name",
    "Camera Location",
    "Alerts",
    "Date",
    "Time",
    "Image",
    "Sync Status",
  ]);
  const [showErrorModal, setshowErrorModal] = useState({
    showPop: false,
    msg: "",
    type: "alert",
    header: "Error",
  });
  const { isLoading, loadingFinished, loading } = useLoading();
  const [selectedRow, setselectedRow] = useState([]);
  const [Slides, setSlides] = useState([]);
  const [search, setSearch] = useState("");
  const [notificationArray, setNotificationArray] = useState([]);
  // const [notificationUnreadLength, setNotificationUnreadLength] = useState(0);
  const [Layout, setLayout] = useState("List");
  const [startDate, setstartDate] = useState("");
  const [endtDate, setendtDate] = useState("");
  const { modalOpen, close, open } = useModal();
  const [disableButtons, setDisableButtons] = useState(true);
  const [showLayout, setshowLayout] = useState(false);
  const [alertName, setAlertName] = useState({
    name: "",
    id: "",
  });

  const [selectedAI, setselectedAI] = useState({
    name: "",
    id: "",
  });
  const [AIOption, setAIOption] = useState([
    "string",
    "string",
    "string",
    "string",
    "string",
  ]);
  const [streamLink, setstreamLink] = useState(null);
  const [cameraName, setCameraName] = useState({
    name: "",
    id: "",
  });
  const [alertOptions, setAlertOptions] = useState([
    "string",
    "string",
    "string",
    "string",
    "string",
  ]);
  const [cameraOptions, setCameraOptions] = useState([
    "Australia",
    "Brazil",
    "China",
    "Denmark",
    "Egypt",
  ]);

  const escKey = (e) => {
    if (e.key === "Escape") {
      if (modalOpen) {
        document.addEventListener("keydown", escKey, false);
        close();
      }
    }
  };

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

  const clearQuery = () => {
    var url = new URL(window.location.href);
    const params = new URLSearchParams(window.location.search);
    params.delete("ticket_no");
    var url = window.location.pathname + "?" + params.toString();
    window.history.pushState(null, null, url);
  };
  const getAlertName = () => {
    axiosApiInstance
      .get("service/?type=Usecase&all=true")
      .then((res) => {
        let resData = res.data.detail;
        alertCamData.alertData = resData;
        const _alertData = resData.map((item) => {
          // appData[item].Service_name.replaceAll("_", " ")
          return {
            name: item.Service_name.replaceAll("_", " "),
            id: item.Service_id,
          };
        });
        setAlertOptions(_alertData);
      })
      .catch(() => {
        setAlertOptions([]);
      });
  };

  const getAI = () => {
    setLoadingScreen(true);
    axiosApiInstance
      .get("service/?all=true&type=AI")
      .then((res) => {
        console.log(res.data);
        let _detail = res.data.detail;
        const _alertData = _detail.filter((item) => {
          if (item.Status === "active") {
            return {
              name: item.Service_name.replaceAll("_", " "),
              id: item.Service_id,
            };
          }
        });

        if (_alertData.length > 0) {
          let res = _alertData.map((item) => {
            return {
              name: item.Service_name.replaceAll("_", " "),
              id: item.Service_id,
            };
          });
          setAIOption(res);
        } else {
          setAIOption([]);
        }
      })
      .catch(() => {
        setAIOption([]);
      })
      .finally(() => {
        setLoadingScreen(false);
      });
  };

  const ddOption = (type, name) => {
    if (type === "alert") {
      const res = alertCamData.alertData.filter((item) => {
        if (item.Service_name.replaceAll("_", " ") === name.name) {
          return item.Service_id;
        }
      });
      return res[0].Service_name;
    } else {
      const res = alertCamData.camData.filter((item) => {
        if (item.Camera_name.replaceAll("_", " ") === name.name) {
          return item.Camera_id;
        }
      });
      return res[0].Camera_id;
    }
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

  const getCameraName = () => {
    let ldata = encryptStorage.getItem("UID");
    userType = ldata.role;
    axiosApiInstance.get("camera").then((res) => {
      let resData = res.data.Data;
      alertCamData.camData = resData;
      const _camData = resData.map((item) => {
        return { name: item.Camera_name, id: item.Camera_id };
      });
      setCameraOptions(_camData);
    });
  };

  const setIntialTime = () => {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yy = today.getFullYear();
    var hrs = today.getHours();
    var mnt = today.getMinutes();
    if (today.getMinutes() < 10) {
      mnt = "0" + today.getMinutes();
    }
    if (hrs === 0) {
      hrs = "00";
    }

    setstartDate(yy + "-" + mm + "-" + dd + "T" + "00:00");
    setendtDate(yy + "-" + mm + "-" + dd + "T" + hrs + ":" + mnt);
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

  const getUnfilteredData = (page = 1, per_page = 10) => {
    loading();
    const authResult = new URLSearchParams(window.location.search);
    t_no = authResult.get("ticket_no");

    isAllSelected = false;
    let url = "base/alert?all=true";
    url += "&page_no=" + page + "&page_len=" + per_page;
    if (t_no) {
      url = "base/alert?ticket_no=" + t_no;
    }
    axiosApiInstance
      .get(url)
      .then((res) => {
        loadingFinished();
        total_data = res.data.total_data;
        let _totalPages = Math.ceil(res.data.total_data / per_page);
        setData(res.data.data);
        setTotalPages(_totalPages);
        setselectedRow([]);
        if (childRef.current) {
          childRef.current.myRef.current.scrollToTop();
        }
        // if (res.data.data.length > 0) {
        //   setDisableButtons(false);
        // } else {
        //   setDisableButtons(true);
        // }
      })
      .catch((err) => {
        setselectedRow([]);
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Error while Fetching alerts.",
          type: "alert",
          header: "Error",
        }));
        resetModal();
        loadingFinished();
        setData([]);
      });
  };

  const postFilter = (page = 1, per_page = 10) => {
    loading();
    const authResult = new URLSearchParams(window.location.search);
    t_no = authResult.get("ticket_no");
    let url = "base/alert?all=false";
    url += "&start_timestamp=" + convertUTCTime(startDate);
    url += "&end_timestamp=" + convertUTCTime(endtDate);
    if (Object.values(cameraName)[0]?.length) {
      url += "&camera_id=" + ddOption("camera", cameraName);
    }
    if (Object.values(alertName)[0]?.length) {
      url += "&service_id=" + ddOption("alert", alertName);
    }
    if (search) {
      url = "";
      url = "base/alert?text=" + search;
    }

    url += "&page_no=" + page + "&page_len=" + per_page;
    if (t_no) {
      url = "base/alert?ticket_no=" + t_no;
    }
    isAllSelected = false;
    axiosApiInstance
      .get(url)
      .then((res) => {
        loadingFinished();
        total_data = res.data.total_data;
        let _totalPages = Math.ceil(res.data.total_data / per_page);
        setData(res.data.data);
        setTotalPages(_totalPages);
        setselectedRow([]);
        if (childRef.current) {
          childRef.current.myRef.current.scrollToTop();
        }
        if (res.data.data.length > 0) {
          setDisableButtons(false);
        } else {
          setDisableButtons(true);
        }
      })
      .catch((err) => {
        setselectedRow([]);
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Error while Fetching alerts.",
          type: "alert",
          header: "Error",
        }));
        resetModal();
        loadingFinished();
        setData([]);
      });
  };
  const handleClear = (omitClear = false) => {
    if (t_no) {
      clearQuery();
    }
    isAllSelected = false;
    type = "all";
    setDisableButtons(true);
    setIntialTime();
    setCameraName("");
    if (!omitClear) {
      setSearch("");
    }
    setAlertName("");
    setselectedRow([]);
    getCameraName();
    setCurrentPage(1);
    setPerPage(10);
    getUnfilteredData(1, 10);
  };

  const deleteAlert = () => {
    if (selectedRow.length) {
      let url = "";
      selectedRow.map((item, index) => {
        if (selectedRow.length === index + 1) {
          url = url + "ticket_numbers=" + item;
        } else {
          url = url + "ticket_numbers=" + item + "&";
        }
      });
      axiosApiInstance
        .delete("base/alert?" + url)
        .then((res) => {
          isAllSelected = false;
          setCurrentPage(1);
          setselectedRow([]);
          if (type === "all") {
            getUnfilteredData();
          } else {
            postFilter();
          }
        })
        .catch((err) => {
          setshowErrorModal((prevState) => ({
            ...prevState,
            showPop: true,
            msg: "Error while deleting error!",
            type: "alert",
            header: "Error",
          }));
          resetModal();
        })
        .finally(() => {
          setIsConfirm(false);
        });
    } else {
      let url =
        "base/alert?start_timestamp=" +
        convertUTCTime(startDate) +
        "&end_timestamp=" +
        convertUTCTime(endtDate);

      if (Object.values(cameraName)[0]?.length) {
        url += "&camera_id=" + ddOption("camera", cameraName);
      }
      if (Object.values(alertName)[0]?.length) {
        url += "&service_id=" + ddOption("alert", alertName);
      }
      if (search) {
        url = "";
        url += "&text=" + search;
      }

      axiosApiInstance
        .delete(url)
        .then((res) => {
          isAllSelected = false;
          if (type === "all") {
            setCurrentPage(1);
            setPerPage(10);
            // getUnfilteredData();
            handleClear();
          } else {
            setCurrentPage(1);
            setPerPage(10);
            handleClear();

            // postFilter();
          }
          // setCurrentPage(1);
          // setselectedRow([]);
          // setReload(!reload);
        })
        .catch((err) => {
          setshowErrorModal((prevState) => ({
            ...prevState,
            showPop: true,
            msg: "Error while deleting error!",
            type: "alert",
            header: "Error",
          }));
          resetModal();
        })
        .finally(() => {
          setIsConfirm(false);
        });
    }
  };

  const downloadStatusHandler = () => {
    socket = socketio(SOCKET_URL);
    socket.on("download_complete", (data) => {
      var link = document.createElement("a");
      link.download = "Searched_Alerts";
      link.href = SOCKET_URL + data.data;
      link.click();
      socket.close();
      isAllSelected = false;
      setselectedRow([]);
      handleClear();
    });
  };

  const downloadButtonHandler = (isAll = false) => {
    let _row = selectedRow.length > 0 ? true : false;
    let url = "base/alert/download?all=" + _row;
    if (!isAll) {
      url += "&start_timestamp=" + convertUTCTime(startDate);
      url += "&end_timestamp=" + convertUTCTime(endtDate);
      if (Object.values(cameraName)[0]?.length) {
        url += "&camera_id=" + ddOption("camera", cameraName);
      }
      if (Object.values(alertName)[0]?.length) {
        url += "&service_id=" + ddOption("alert", alertName);
      }
    }
    if (search) {
      url = "";
      url = "base/alert/download?text=" + search;
    }
    let body = {};
    if (selectedRow.length > 0) {
      body.ticket_nos = selectedRow;
    }

    axiosApiInstance
      .post(url, body)
      .then((res) => {
        isAllSelected = false;
        setselectedRow([]);
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "File will download automatically once ready!",
          type: "success",
          header: "Success",
        }));
        resetModal();
        downloadStatusHandler();
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Error while downloading file.",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

  const fetchNotification = () => {
    axiosApiInstance
      .get("base/notifications")
      .then((resp) => {
        setNotificationArray(resp.data.detail);
        // setNotificationUnreadLength(resp.data.detail.length);
      })
      .catch((err) => {
        //console.log(err.response);
      })
      .finally(() => {
        // setResLoading((prevState) => ({
        //   ...prevState,
        //   notification: false,
        // }));
      });
  };

  const postLiveStart = () => {
    setLoadingScreen(true);
    axiosApiInstance
      .get("service/live/start?serviceId=" + selectedAI.id + "&link=" + resLink)
      .then((res) => {
        stop = false;
        setstreamLink(res.data.link);
        _link = res.data.link;
        _copyLink = res.data.link;
        setCounter(streamTimeout);
        _interval = setInterval(() => {
          //
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
  const getJetpack = () => {
    let ldata = encryptStorage.getItem("UID");
    if (ldata.layout) {
      setshowLayout(true);
    } else {
      setshowLayout(false);
    }
  };
  useEffect(() => {
    getUnfilteredData();
    getJetpack();
  }, []);

  useEffect(() => {
    document.title = "Alerts";
    setIntialTime();
    getCameraName();
    getAlertName();
    return () => {
      clearInterval(_interval);
      axiosApiInstance.delete("service/live/stop");
    };
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.addEventListener("keydown", escKey, false);
    }
    return () => {
      document.removeEventListener("keydown", escKey, false);
    };
  }, [modalOpen]);

  useEffect(() => {
    if (Layout === "Live Feed") {
      getAI();
      fetchNotification();
    } else {
      if (streamLink) {
        setLoadingScreen(true);
        axiosApiInstance.delete("service/live/stop").finally(() => {
          setLoadingScreen(false);
        });
        setstreamLink(null);
        setselectedAI({
          name: "",
          id: "",
        });
      } else {
        setstreamLink(null);
      }
    }
  }, [Layout]);

  const renderTableHeader = () => {
    return header.map((item, index) => {
      if (item === "")
        return (
          <th key={item} style={{ paddingLeft: "1.1vw" }}>
            <Radio
              // style={{ paddingLeft: "0.5vw" }}
              // name="getAlertName"
              id="checkbox_001"
              key={"index_" + index}
              checked={isAllSelected}
              onClick={() => {
                isAllSelected = !isAllSelected;
                if (isAllSelected) {
                  let _selected = [...selectedRow];
                  _selected.length = 0;
                  const _id = data.map((item) => item.Ticket_number);
                  _selected = [..._id];
                  setselectedRow([..._selected]);
                  setDisableButtons(false);
                } else {
                  setselectedRow([]);
                  setDisableButtons(true);
                }
              }}
            />
          </th>
        );
      return <th key={item + index + "_"}>{item}</th>;
    });
  };
  const renderTableData = () => {
    return data.map((item, index) => {
      return (
        <tr key={item.Ticket_number}>
          <td>
            <Radio
              checked={selectedRow.includes(item.Ticket_number) ? true : false}
              id={"checkbox_" + index}
              onClick={() => {
                isAllSelected = false;
                let _selected = [...selectedRow];
                if (_selected.includes(item.Ticket_number)) {
                  let index = _selected.indexOf(item.Ticket_number);
                  _selected.splice(index, 1);
                } else {
                  _selected.push(item.Ticket_number);
                }
                setselectedRow([..._selected]);
              }}
            />
          </td>
          {/* <td>{item.Ticket_number}</td> */}
          <td>{total_data - (index + (CurrentPage - 1) * perPage)}</td>
          <td style={{ textTransform: "capitalize" }}>
            {item?.Camera_name?.replace(/_/g, " ")}
          </td>
          <td style={{ textTransform: "capitalize" }}>{item.Location}</td>
          <td>{item.Alert}</td>
          <td>{item.Date}</td>
          <td>{item.Time}</td>
          {item.Image_path?.length === 0 ? (
            <td
              className="td-image-row"
              onClick={() => {
                open();
                setSlides([...Slides, logo]);
                // setSlides([...dummyImage])
              }}
            >
              <img
                draggable="false"
                id={"img_" + 0}
                src={logo}
                className="td_image"
                onError={(e) => {
                  e.target.src = logo;
                }}
              />
            </td>
          ) : (
            <td
              className="td-image-row"
              onClick={() => {
                open();
                let tempList = [...item.Image_path];
                tempList = tempList.map((elem) => {
                  return SOCKET_URL + elem;
                });
                setSlides([...tempList]);
              }}
            >
              {item.Image_path?.map((imageItem, index) => {
                if (index < 3) {
                  return (
                    <img
                      draggable="false"
                      key={imageItem + 2}
                      id={"img_" + index}
                      src={SOCKET_URL + imageItem}
                      className="td_image"
                      onError={(e) => {
                        e.target.src = logo;
                      }}
                    />
                  );
                }
                return null;
              })}
            </td>
          )}

          <td style={{ zIndex: 0 }}>
            {item.Sync_status ? (
              <i className="material-icons" style={{ color: "#42C539" }}>
                cloud_done
              </i>
            ) : (
              <i className="material-icons" style={{ color: "red" }}>
                cloud_off
              </i>
            )}
          </td>
          <div className="hoverData">
            <div className="shadow" />
            {/* <i className="material-icons adj_icon">warning</i> */}
            {userType !== "Operator" && (
              <i
                className="material-icons adj_icon"
                onClick={() => {
                  isAllSelected = false;
                  let _selected = [...selectedRow];
                  if (_selected.includes(item.Ticket_number)) {
                    let index = _selected.indexOf(item.Ticket_number);
                    _selected.splice(index, 1);
                  } else {
                    _selected.push(item.Ticket_number);
                  }
                  setselectedRow([..._selected]);
                  setIsConfirm(true);
                }}
              >
                delete
              </i>
            )}
          </div>
        </tr>
      );
    });
  };

  const HLSPlayer = React.memo(() => {
    return (
      <ReactHlsPlayer
        src={SOCKET_URL + streamLink}
        onLoadStart={() => {}}
        onLoadedData={(e) => {
          stop = true;
          clearInterval(_interval);
          setLoadingScreen(false);
          setCounter(1);
        }}
        // src="http://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8"
        controls={false}
        hlsConfig={{
          enableWorker: false,
        }}
        width="100%"
        className="hls-player_"
        autoPlay
        muted={true}
        id="hls"
      />
    );
  }, []);

  useEffect(() => {
    if (!stop) {
      counter > 0 &&
        setTimeout(() => {
          setCounter(counter - 1);
        }, 1000);
      if (counter === 0) {
        setLoadingScreen(true);
        axiosApiInstance.delete("service/live/stop").finally(() => {
          setLoadingScreen(false);
          notify({
            type: "alert",
            msg: "Unable to fetch live stream. Please try again later!",
          });
        });
        clearInterval(_interval);
        setCounter(-1);
        console.log("Stop api call with error");
      }
    }
  }, [counter]);

  return (
    <div className="__alerts_wrapper__">
      <Prompt
        when={streamLink}
        message={(location) =>
          // `Are you sure you want to go to ${location.pathname}`
          `Do you want to stop streaming?`
        }
      />
      {/* <RouterPrompt
        // when={showPrompt}
        when={streamLink}
        title="Leave this page"
        cancelText="Cancel"
        okText="Confirm"
        onOK={() => true}
        onCancel={() => false}
      /> */}
      <Navbar
        navName="Alerts"
        searchValue={search}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        onKeyDown={() => {
          if (search) {
            type = "search";
            handleClear(true);
            postFilter(1, 10);
          }
        }}
        ref={childRef}
        handleNotification={(data) => {
          setNotificationArray((prevState) => {
            prevState.unshift(data);
            prevState.length >= 10 && prevState.pop();
            return prevState;
          });
          // setNotificationUnreadLength((prevState) => {
          //   return prevState + 1;
          // });
        }}
      >
        <div style={{ display: "flex" }}>
          <div className="_filter_list_">
            <div className="fixed_activity">
              <Scrollbars autoHeight autoHeightMin={100} autoHeightMax="89vh">
                <React.Fragment>
                  <h2 className="title_">Layout</h2>
                  <div
                    className="view_switch"
                    style={{
                      color: Layout === "List" ? "#fff" : "#000",
                      backgroundColor: !showLayout
                        ? "rgba(0, 0, 0, 0.45)"
                        : null,
                    }}
                    data-tip={
                      !showLayout
                        ? "Your platform does not support this feature."
                        : null
                    }
                  >
                    <p
                      style={{
                        color: Layout === "List" ? "#fff" : "#000",
                      }}
                      onClick={() => {
                        if (showLayout) {
                          setLayout("List");
                        }
                      }}
                    >
                      List
                    </p>
                    <p
                      style={{
                        color: Layout === "Live Feed" ? "#fff" : "#000",
                      }}
                      onClick={() => {
                        if (showLayout) {
                          setLayout("Live Feed");
                        }
                      }}
                    >
                      Live Feed
                    </p>
                    <div
                      className="active_view"
                      style={{
                        left: Layout === "List" ? "0%" : "50%",
                        color: Layout === "List" ? "#fff" : "#000",
                      }}
                    ></div>
                  </div>
                </React.Fragment>

                {Layout === "List" && (
                  <div style={{ position: "relative" }}>
                    <h2 className="title_">Actions</h2>
                    <Button
                      style={{
                        width: "8vw",
                        fontSize: "0.8vw",
                        marginBottom: "1.2vw",
                        marginTop: "1.2vw",
                      }}
                      type="gradient"
                      name="Refresh Page"
                      onClick={() => handleClear()}
                    />
                    <Button
                      style={{
                        width: "8vw",
                        fontSize: "0.8vw",
                        marginBottom: "1.2vw",
                      }}
                      type="gradient"
                      name="Download"
                      disabled={selectedRow.length === 0 && disableButtons}
                      onClick={() => downloadButtonHandler()}
                    />
                    {userType !== "Operator" && (
                      <Button
                        style={{
                          width: "8vw",
                          fontSize: "0.8vw",
                          marginBottom: "1.2vw",
                        }}
                        onClick={() => setIsConfirm(true)}
                        type="gradient"
                        name="Delete"
                        disabled={selectedRow.length === 0 && disableButtons}
                      />
                    )}

                    <h2 className="title_">Filters</h2>
                    <div className="date_time">
                      <p className="time-label">Start Date and Time</p>
                      <input
                        id="startDate"
                        type="datetime-local"
                        className=""
                        style={{ fontWeight: "bold", width: "92%" }}
                        value={startDate}
                        onChange={(e) => {
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
                        min={minDate}
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
                      />
                    </div>
                    <Dropdown
                      className="adjust_dd"
                      optionsList={alertOptions}
                      handleOption={(name, id) => {
                        setAlertName({
                          name,
                          id,
                        });
                      }}
                      defaultText={alertName.name}
                      label="Alert Name"
                      isObject
                    />
                    <Dropdown
                      className={
                        cameraOptions.length > 2
                          ? "adjust_dd adjust_dd_2"
                          : "adjust_dd"
                      }
                      optionsList={cameraOptions}
                      handleOption={(name, id) => {
                        setCameraName({
                          name,
                          id,
                        });
                      }}
                      defaultText={cameraName.name}
                      label="Camera Name"
                      isObject
                    />

                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        marginTop: "1vw",
                        marginBottom: "3vw",
                      }}
                    >
                      <Button
                        style={{ width: "7vw" }}
                        name="Apply"
                        onClick={() => {
                          if (t_no) {
                            clearQuery();
                          }
                          type = "filter";
                          isAllSelected = false;
                          setselectedRow([]);
                          setCurrentPage(1);
                          setPerPage(10);
                          postFilter(1, 10);
                        }}
                        // disabled={isLoading}
                      />
                      <Button
                        style={{ width: "7vw" }}
                        onClick={() => handleClear()}
                        type="gradient"
                        name="Clear"
                      />
                    </div>
                  </div>
                )}

                {Layout === "Live Feed" && (
                  <div style={{ position: "relative" }}>
                    <h2 className="title_">Filters</h2>
                    <Dropdown
                      className="adjust_dd"
                      optionsList={AIOption}
                      handleOption={(name, id) => {
                        if (streamLink) {
                          setLoadingScreen(true);
                          axiosApiInstance
                            .delete("service/live/stop")
                            .then((res) => {
                              setstreamLink(null);
                              setselectedAI({
                                name,
                                id,
                              });
                            })
                            .catch((err) => {
                              notify({
                                type: "alert",
                                msg: "Failed to stop streaming!",
                              });
                            })
                            .finally(() => {
                              setLoadingScreen(false);
                            });
                        } else {
                          setselectedAI({
                            name,
                            id,
                          });
                        }
                      }}
                      defaultText={selectedAI.name}
                      label="A.I. Model"
                      isObject
                    />
                    <div
                      style={{
                        // position: "absolute",
                        // bottom: "-4vw",
                        // left: "-0.9vw",
                        width: "100%",
                        display: "flex",
                        marginTop: "1vw",
                        marginBottom: "3vw",
                        // justifyContent: "space-evenly",
                      }}
                    >
                      <Button
                        style={{ width: "7vw" }}
                        name="Apply"
                        onClick={() => {
                          if (streamLink) {
                            setLoadingScreen(true);
                            axiosApiInstance
                              .delete("service/live/stop")
                              .then((res) => {
                                axiosApiInstance
                                  .get(
                                    "service/live/details?serviceId=" +
                                      selectedAI.id
                                  )
                                  .then((res) => {
                                    resLink = res.data.detail;
                                    postLiveStart();
                                  })
                                  .catch((err) => {
                                    setLoadingScreen(false);
                                    notify({
                                      type: "alert",
                                      msg: "Live view cant be fetched!",
                                    });
                                  });
                              });
                          } else {
                            setLoadingScreen(true);
                            axiosApiInstance
                              .get(
                                "service/live/details?serviceId=" +
                                  selectedAI.id
                              )
                              .then((res) => {
                                resLink = res.data.detail;
                                postLiveStart();
                              })
                              .catch((err) => {
                                setLoadingScreen(false);
                                notify({
                                  type: "alert",
                                  msg: "Live view cant be fetched!",
                                });
                              });
                          }
                        }}
                        disabled={selectedAI.name === ""}
                      />
                      <Button
                        style={{ width: "7vw" }}
                        onClick={() => {
                          if (streamLink) {
                            setLoadingScreen(true);
                            axiosApiInstance
                              .delete("service/live/stop")
                              .then((res) => {
                                setselectedAI({
                                  name: "",
                                  id: "",
                                });
                                resLink = null;
                                setstreamLink(null);
                              })
                              .finally(() => {
                                setLoadingScreen(false);
                              });
                          } else {
                            setselectedAI({
                              name: "",
                              id: "",
                            });
                            resLink = null;
                            setstreamLink(null);
                          }
                        }}
                        type="gradient"
                        name="Clear"

                        // onClick={() => history.push("/alerts")}
                        // disabled={isLoading}
                      />
                    </div>
                  </div>
                )}
              </Scrollbars>
            </div>
          </div>

          <div className="_grid_">
            {Layout === "List" && (
              <BoxCard
                isLoading={isLoading}
                className="_table_wrapper_"
                id="_table_wrapper_card_"
              >
                {data.length === 0 && (
                  <div
                    style={{
                      display: "grid",
                      height: "36vw",
                      placeItems: "center",
                      fontWeight: "bold",
                      fontSize: "2vw",
                    }}
                  >
                    NO DATA FOUND
                  </div>
                )}
                {data.length !== 0 && (
                  <Table>
                    <tr className="adjust-th">{renderTableHeader()}</tr>
                    {renderTableData()}
                  </Table>
                )}

                {data.length !== 0 && (
                  <Pagination
                    style={{ position: "absolute", bottom: "1vw" }}
                    totPages={TotalPages}
                    currentPage={CurrentPage}
                    rowCount={perPage}
                    // totPages={20}
                    // currentPage={1}
                    pageInput={(row_, count_, page) => {
                      isAllSelected = false;
                      setCurrentPage(Number(page));
                      setselectedRow([]);
                      if (type === "all") {
                        getUnfilteredData(page, row_);
                      }
                      if (type === "filter" || type === "search") {
                        postFilter(page, row_);
                      }
                    }}
                    pageClicked={(ele, count_) => {
                      isAllSelected = false;
                      setselectedRow([]);
                      setCurrentPage(ele);
                      if (type === "all") {
                        getUnfilteredData(ele, count_);
                      }
                      if (type === "filter" || type === "search") {
                        postFilter(ele, count_);
                      }
                    }}
                    handleSelect={(curr, ele) => {
                      isAllSelected = false;
                      setselectedRow([]);
                      setPerPage(ele);
                      setCurrentPage(1);
                      if (type === "all") {
                        getUnfilteredData(1, ele);
                      }
                      if (type === "filter" || type === "search") {
                        postFilter(1, ele);
                      }
                    }}
                  />
                )}
              </BoxCard>
            )}
            {Layout === "Live Feed" && (
              <BoxCard
                id="_table_wrapper2_card_"
                isLoading={isLoading}
                className="_table_wrapper_2"
              >
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{ duration: 0.5 }}
                  className="feed_wrapper"
                >
                  <div className="video_container">
                    <div className="video_wrapper_">
                      {!streamLink && (
                        <div className="select_ai">
                          Please Select an A.I. Model to Stream
                        </div>
                      )}
                      {/* {streamLink && <HLSPlayer />} */}
                      {streamLink && (
                        <ReactHlsPlayer
                          src={SOCKET_URL + streamLink}
                          onLoadStart={() => {}}
                          onLoadedData={(e) => {
                            stop = true;
                            clearInterval(_interval);
                            setLoadingScreen(false);
                            setCounter(-1);
                          }}
                          // src="http://192.168.1.194/static_server/live/person_detector/index.m3u8"
                          controls={false}
                          hlsConfig={{
                            enableWorker: false,
                          }}
                          width="100%"
                          className="hls-player_"
                          autoPlay
                          muted={true}
                          id="hls"
                        />
                      )}

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
                    <BoxCard className={"model_info"}>
                      <div className="divider_" />
                      <h2>Model Details</h2>
                      <Scrollbars autoHeight autoHeightMax="12vh">
                        <div style={{ marginBottom: "0.8vw" }}>
                          <div className="model_name">Model Validity</div>
                          <div className="model_desc">20/10/2022 10:23:00</div>
                        </div>
                        <div>
                          <div className="model_name">Description</div>
                          <div className="model_desc">
                            {"Invite fellow developers to your team or project to  drive improved collaboration on your code, or create backlog items and bugs for tracking status. Stakeholders can check on a project's status and give feedback for free".substring(
                              0,
                              120
                            )}
                          </div>
                        </div>
                      </Scrollbars>
                    </BoxCard>
                  </div>
                  <BoxCard className={"alert_noti"}>
                    <div style={{ marginTop: "0.5vw", marginLeft: "1vw" }}>
                      <div className="divider_" />
                      <h2>Live Alerts</h2>
                    </div>
                    <Scrollbars
                      autoHeight
                      autoHeightMin={100}
                      autoHeightMax="67.5vh"
                    >
                      {notificationArray.map((item) => {
                        return (
                          <NotificationCard
                            key={item["ticket_no"]}
                            title={item["title"]}
                            message={item["message"]}
                            ticket_no={item["ticket_no"]}
                            image={item["image"]}
                            created={item["created"]}
                            // history={history}
                            onClick={() => {
                              selecteNotification = item.image[0];
                              open();
                            }}
                          />
                        );
                      })}
                    </Scrollbars>
                  </BoxCard>
                </motion.div>
              </BoxCard>
            )}
            {modalOpen && Layout === "List" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.4,
                }}
                className="alert_slider_modal"
                onClick={() => {
                  close();
                  setcurrentSlide(0);
                }}
              >
                <div
                  className="alert_slider_wrapper"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="slide_count_">
                    {currentSlide + 1} / {Slides.length}
                  </div>
                  <Slider {...settings}>
                    {Slides.map((item, index) => (
                      <div key={item}>
                        <div className="slider_img">
                          <img
                            src={item}
                            onError={(e) => {
                              e.target.src = logo;
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </Navbar>
      {modalOpen && Layout === "Live Feed" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.4,
          }}
          className="alert_slider_modal"
          onClick={close}
        >
          <div
            className="alert_slider_wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <i className={"material-icons close_"} onClick={close}>
              close
            </i>
            <img
              className="_img"
              alt="alert-image"
              src={SOCKET_URL + selecteNotification}
            />
          </div>
        </motion.div>
      )}
      {isConfirm && (
        <Modal
          onConfirm={deleteAlert}
          handleClose={() => {
            isAllSelected = false;
            setIsConfirm(false);
            setselectedRow([]);
          }}
          type="confirm"
          errorHeader="Warning"
          errorText="Are you sure you want to delete the alert?"
        />
      )}
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
      {loadingScreen && <Loading type={"transparent"} text={"Loading"} />}
    </div>
  );
}
// const deleteAlert = () => {
//   console.log(selectedRow);
//   if (selectedRow.length) {
//     let url = "";
//     selectedRow.map((item, index) => {
//       if (selectedRow.length === index + 1) {
//         url = url + "ticket_numbers=" + item;
//       } else {
//         url = url + "ticket_numbers=" + item + "&";
//       }
//     });
//     axiosApiInstance
//       .delete("base/alert?" + url)
//       .then((res) => {
//         isAllSelected = false;
//         setCurrentPage(1);
//         setselectedRow([]);
//         setReload(!reload);
//       })
//       .catch((err) => {
//         setshowErrorModal((prevState) => ({
//           ...prevState,
//           showPop: true,
//           msg: "Error while deleting error!",
//           type: "alert",
//           header: "Error",
//         }));
//         resetModal();
//       })
//       .finally(() => {
//         setIsConfirm(false);
//       });

//     console.log(url);
//   } else {
//     let url =
//       "base/alert?start_timestamp=" +
//       convertUTCTime(startDate) +
//       "&end_timestamp=" +
//       convertUTCTime(endtDate);
//     console.log(search);
//     if (search) {
//       url += "&text=" + search;
//     }
//     if (Object.values(cameraName)[0]?.length) {
//       url += "&camera_id=" + ddOption("camera", cameraName);
//     }
//     if (Object.values(alertName)[0]?.length) {
//       url += "&service_id=" + ddOption("alert", alertName);
//     }
//     console.log(url);

//     axiosApiInstance
//       .delete(url)
//       .then((res) => {
//         isAllSelected = false;
//         setCurrentPage(1);
//         setselectedRow([]);
//         setReload(!reload);
//       })
//       .catch((err) => {
//         setshowErrorModal((prevState) => ({
//           ...prevState,
//           showPop: true,
//           msg: "Error while deleting error!",
//           type: "alert",
//           header: "Error",
//         }));
//         resetModal();
//       })
//       .finally(() => {
//         setIsConfirm(false);
//       });
//   }
// };

// import { Modal } from "antd";

export function RouterPrompt(props) {
  const { when, onOK, onCancel, title, okText, cancelText } = props;

  const history = useHistory();

  const [showPrompt, setShowPrompt] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    if (when) {
      history.block((prompt) => {
        setCurrentPath(prompt.pathname);
        setShowPrompt(true);
        return true;
        // return "eeeee";
      });
    } else {
      history.block(() => {});
    }

    return () => {
      history.block(() => {});
    };
  }, [history, when]);

  const handleOK = useCallback(async () => {
    if (onOK) {
      const canRoute = await Promise.resolve(onOK());
      if (canRoute) {
        history.block(() => {});
        history.push(currentPath);
      }
    }
  }, [currentPath, history, onOK]);

  const handleCancel = useCallback(async () => {
    if (onCancel) {
      const canRoute = await Promise.resolve(onCancel());
      if (canRoute) {
        history.block(() => {});
        history.push(currentPath);
      }
    }
    setShowPrompt(false);
  }, [currentPath, history, onCancel]);

  return showPrompt ? (
    // return true ? (
    <Modal
      className="adjust_modal"
      onConfirm={handleOK}
      handleClose={handleCancel}
      type="confirm"
      errorHeader="Confirmation"
      errorText="Do You Want to stop streaming?"
    />
  ) : // <Modal
  //   title={title}
  //   visible={showPrompt}
  //   onOk={handleOK}
  //   okText={okText}
  //   onCancel={handleCancel}
  //   cancelText={cancelText}
  //   closable={true}
  // >
  //   There are unsaved changes. Are you sure want to leave this page ?
  // </Modal>
  null;
}
