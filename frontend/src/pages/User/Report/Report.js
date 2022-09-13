import React, { useState, useEffect } from "react";
import { BoxCard } from "../../../components/card/Card";
import { motion } from "framer-motion";
import Navbar from "../../../components/Navbar/Navbar";
import Table from "../../../components/Table/Table";
import logo from "../../../assets/images/Logo.jpg";
import { axiosApiInstance, SOCKET_URL } from "../../../helper/request";
import useLoading from "../../../helper/useLoading";
import useModal from "../../../helper/useModal";
import "./report.scss";
import Pagination from "../../../components/Pagination/Pagination";
import Button from "../../../components/Button/Button";
import socketio from "socket.io-client";
import { Radio } from "../../../components/Radio/Radio";
import Dropdown from "../../../components/Dropdown/Dropdown";
import { notify } from "../Setting/Appearance/AppearanceSetting";
let total_data = 0;
let selectedImage = null;
let isNumPlate = null;
let isAllSelected = false;
let maxDate = null;
let minDate = null;
let type = "all";
let socket = null;
let todaysAlert = "";

export default function Report() {
  const [data, setData] = useState([]);
  const [Header, setHeader] = useState([]);
  const [currentSlide, setcurrentSlide] = useState(0);
  const [disableButtons, setDisableButtons] = useState(true);
  const [TotalPages, setTotalPages] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [CurrentPage, setCurrentPage] = useState(1);
  const [selectedRow, setselectedRow] = useState([]);
  const [loadingScreen, setLoadingScreen] = useState(false);
  const { isLoading, loadingFinished, loading } = useLoading();
  const [Slides, setSlides] = useState([]);
  const { modalOpen, close, open } = useModal();
  const [startDate, setstartDate] = useState("");
  const [endtDate, setendtDate] = useState("");
  const handleAfterChange = (index) => {
    setcurrentSlide(index);
  };
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    accessibility: true,
    afterChange: handleAfterChange,
  };
  const ANPRHeader = [
    "",
    "Sr. No.",
    "Record ID",
    "Vehicle Number",
    // "Company ID",
    "Type",
    "Direction",
    "Date",
    "Time",
    "Vehicle",
    "Number Plate",
  ];
  const BaygateHeader = [
    "",
    "Sr. No.",
    "Bay Name",
    "Activity",
    "Start Time",
    "End Time",
    "Vehicle Count",
    // "Company ID",
    "People Count",
    "Vehicle Idling",
    "Forklift",
    "Pallette",
    "Media",
  ];
  const [Layout, setLayout] = useState("ANPR");

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

  const getUnfilteredReport = (
    link = "base/anpr/reports/details",
    page = 1,
    per_page = 10
  ) => {
    loading();
    link = link + "?all=true&page_no=" + page + "&page_len=" + per_page;

    const authResult = new URLSearchParams(window.location.search);
    todaysAlert = authResult.get("today");
    // isAllSelected = false;
    if (todaysAlert) {
      const start = authResult.get("start");
      const end = authResult.get("end");
      const type = authResult.get("type");
      console.log(start, end, type);
      if (type === "ANPR") {
        link =
          "base/anpr/reports/details?all=false&start_timestamp=" +
          start +
          "&end_timestamp=" +
          end +
          "&page_no=" +
          page +
          "&page_len=" +
          per_page;
      } else if (type === "Baygate Activity") {
        console.log("first");
        // setLayout(type);
        link =
          "base/baygate/reports/details?all=false&start_timestamp=" +
          start +
          "&end_timestamp=" +
          end +
          "&page_no=" +
          page +
          "&page_len=" +
          per_page;
      }
    }

    axiosApiInstance
      .get(link)
      .then((res) => {
        console.log(res.data);
        total_data = res.data.total_data;
        let _totalPages = Math.ceil(res.data.total_data / per_page);
        setData(res.data.data);
        setTotalPages(_totalPages);
      })
      .finally(() => {
        loadingFinished();
      });
  };

  const getFilteredReport = (
    link = "base/anpr/reports/details",
    page = 1,
    per_page = 10
  ) => {
    loading();
    let url = "?all=false";
    url += "&start_timestamp=" + convertUTCTime(startDate);
    url += "&end_timestamp=" + convertUTCTime(endtDate);
    url += "&page_no=" + page + "&page_len=" + per_page;
    console.log(url);
    axiosApiInstance
      .get(link + url)
      .then((res) => {
        total_data = res.data.total_data;
        let _totalPages = Math.ceil(res.data.total_data / per_page);
        setData(res.data.data);
        setTotalPages(_totalPages);
        setselectedRow([]);
        if (res.data.data.length > 0) {
          setDisableButtons(false);
        } else {
          setDisableButtons(true);
        }
      })
      .catch((err) => {
        setselectedRow([]);
        setData([]);
      })
      .finally(() => {
        loadingFinished();
      });
  };
  const downloadStatusHandler = () => {
    socket = socketio(SOCKET_URL);
    socket.on("reports_download", (data) => {
      console.log(data);
      var link = document.createElement("a");
      link.download = "Reports";
      link.href = SOCKET_URL + data;
      link.click();
      socket.close();
      isAllSelected = false;
      setselectedRow([]);
    });
  };
  const deleteAlert = (url = "base/anpr/reports/details") => {
    selectedRow.map((item, index) => {
      if (selectedRow.length === index + 1) {
        url = url + "ticket_numbers=" + item;
      } else {
        url = url + "ticket_numbers=" + item + "&";
      }
    });
    axiosApiInstance
      .delete(url)
      .then((res) => {
        isAllSelected = false;
        setCurrentPage(1);
        setselectedRow([]);
        if (type === "all") {
          getUnfilteredReport();
        } else {
          // postFilter();
        }
      })
      .catch((err) => {
        // setshowErrorModal((prevState) => ({
        //   ...prevState,
        //   showPop: true,
        //   msg: "Error while deleting error!",
        //   type: "alert",
        //   header: "Error",
        // }));
        // resetModal();
      })
      .finally(() => {
        // setIsConfirm(false);
      });
  };

  const postDownload = () => {
    let url = "";
    if (Layout === "ANPR") {
      url = "base/anpr/reports/download";
    }
    let body = {};
    if (selectedRow.length > 0) {
      body.record_ids = selectedRow;
    }
    axiosApiInstance
      .post(url, body)
      .then((res) => {
        isAllSelected = false;
        setselectedRow([]);
        notify({
          type: "success",
          msg: "File will download automatically once ready!",
        });

        downloadStatusHandler();
      })
      .catch((err) => {
        notify({
          type: "alert",
          msg: "Error while downloading file.",
        });
      });
  };
  const clearQuery = () => {
    var url = new URL(window.location.href);
    const params = new URLSearchParams(window.location.search);
    params.delete("today");
    params.delete("type");
    params.delete("start");
    params.delete("end");
    var url = window.location.pathname + "?" + params.toString();
    window.history.pushState(null, null, url);
  };
  const renderANPRData = () => {
    return data.map((item, index) => (
      <tr key={item.record_id}>
        <td>
          <Radio
            checked={selectedRow.includes(item.record_id) ? true : false}
            id={"checkbox_" + index}
            onClick={() => {
              isAllSelected = false;
              let _selected = [...selectedRow];
              if (_selected.includes(item.record_id)) {
                let index = _selected.indexOf(item.record_id);
                _selected.splice(index, 1);
              } else {
                _selected.push(item.record_id);
              }
              setselectedRow([..._selected]);
            }}
          />
        </td>
        <td>{total_data - (index + (CurrentPage - 1) * perPage)}</td>
        <td>{item.record_id}</td>
        <td>{item.vehicle_number}</td>
        <td>{item.type}</td>
        <td>{item.direction}</td>
        <td>{item.visited_date}</td>
        <td>{item.visited_time}</td>
        <td>
          <img
            draggable="false"
            id={"image_" + index}
            src={SOCKET_URL + item.images[0]}
            className="td_image"
            onError={(e) => {
              e.target.src = logo;
            }}
            onClick={() => {
              isNumPlate = false;
              selectedImage = SOCKET_URL + item.images[0];
              open();
            }}
          />
        </td>
        <td>
          <img
            draggable="false"
            id={"imgg_" + index}
            src={SOCKET_URL + item.images[1]}
            className="td_image_number"
            onError={(e) => {
              e.target.src = logo;
            }}
            onClick={() => {
              isNumPlate = true;
              selectedImage = SOCKET_URL + item.images[1];
              open();
            }}
          />
        </td>
        {/* <td
          className="td-image-row"
          onClick={() => {
            open();
            let tempList = [...item.images];
            tempList = tempList.map((elem) => {
              return SOCKET_URL + elem;
            });
            setSlides([...tempList]);
          }}
        >
          {item.images?.map((imageItem, index) => {
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
          })}
        </td> */}
      </tr>
    ));
  };

  const handleClear = () => {
    if (todaysAlert) {
      clearQuery();
    }
    isAllSelected = false;
    type = "all";
    setDisableButtons(true);
    setIntialTime();
    setselectedRow([]);
    setCurrentPage(1);
    setPerPage(10);
    setLayout("ANPR");
    // if (Layout === "ANPR") {
    getUnfilteredReport("base/anpr/reports/details", 1, 10);
    // }
  };

  useEffect(() => {
    setIntialTime();
  }, []);

  useEffect(() => {
    const authResult = new URLSearchParams(window.location.search);
    todaysAlert = authResult.get("today");
    const type = authResult.get("type");
    console.log(Layout === "Baygate Activity" && type === "Baygate Activity");
    if (todaysAlert) {
      console.log("TYPE");
      setLayout(type);
    }
    // if (!todaysAlert) {
    //   if (todaysAlert) {
    //     clearQuery();
    //   }
    // }

    if (Layout === "ANPR") {
      if (type) {
        if (type != "ANPR") {
          return;
        }
      }

      setHeader([...ANPRHeader]);
      getUnfilteredReport("base/anpr/reports/details", 1, 10);
    } else if (Layout === "Baygate Activity" && type === "Baygate Activity") {
      console.log("first...........");
      getUnfilteredReport("base/baygate/reports/details", 1, 10);
      setHeader([...BaygateHeader]);
    }
  }, [Layout]);

  return (
    <div className="__report_wrapper__">
      <Navbar
        navName="Report"
        // searchValue={search}
        // onChange={(e) => {
        //   setSearch(e.target.value);
        // }}
        // onKeyDown={() => {
        //   if (search) {
        //     type = "search";
        //     handleClear(true);
        //     postFilter(1, 10);
        //   }
        // }}
        // ref={childRef}
        // handleNotification={(data) => {
        //   setNotificationArray((prevState) => {
        //     prevState.unshift(data);
        //     prevState.length >= 10 && prevState.pop();
        //     return prevState;
        //   });
        //   setNotificationUnreadLength((prevState) => {
        //     return prevState + 1;
        //   });
        // }}
      >
        <div style={{ display: "flex" }}>
          <div className="_filter_list_">
            <div className="fixed_activity">
              <h2 className="title_">Type</h2>
              <Dropdown
                className="adjust_dd"
                optionsList={["ANPR", "Baygate Activity"]}
                handleOption={(data) => {
                  setLayout(data);
                }}
                defaultText={Layout}
                label=""
              />
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
                  onClick={getUnfilteredReport}
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
                  onClick={postDownload}
                />
                <Button
                  style={{
                    width: "8vw",
                    fontSize: "0.8vw",
                    marginBottom: "1.2vw",
                  }}
                  type="gradient"
                  name="Delete"
                  disabled={selectedRow.length === 0 && disableButtons}
                  onClick={deleteAlert}
                />
              </div>
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
                      // setSearch("");
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
                      // setSearch("");
                    }
                  }}
                  value={endtDate}
                  max={maxDate}
                  min={startDate}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "4vw",
                  left: "0vw",
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-evenly",
                }}
              >
                <Button
                  style={{ width: "7vw" }}
                  name="Apply"
                  onClick={() => {
                    type = "filter";
                    isAllSelected = false;
                    setCurrentPage(1);
                    setPerPage(10);
                    if (Layout === "ANPR") {
                      getFilteredReport("base/anpr/reports/details", 1, 10);
                    }
                    // if (t_no) {
                    //   clearQuery();
                    // }
                    // type = "filter";
                    // isAllSelected = false;
                    // setselectedRow([]);
                    // setCurrentPage(1);
                    // setPerPage(10);
                    // postFilter(1, 10);
                  }}
                  // disabled={isLoading}
                />
                <Button
                  style={{ width: "7vw" }}
                  onClick={() => handleClear()}
                  type="gradient"
                  name="Clear"
                  // disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <div className="_grid_">
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
                  <tr className="adjust-th">
                    {Header.map((item, index) => {
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
                                  const _id = data.map(
                                    (item) => item.record_id
                                  );
                                  _selected = [..._id];
                                  setselectedRow([..._selected]);
                                  // setDisableButtons(false);
                                } else {
                                  setselectedRow([]);
                                  // setDisableButtons(true);
                                }
                              }}
                            />
                          </th>
                        );
                      return <th key={item}>{item}</th>;
                    })}
                  </tr>
                  {renderANPRData()}
                </Table>
              )}
              {data.length !== 0 && (
                <Pagination
                  style={{ position: "absolute", bottom: "1vw" }}
                  totPages={TotalPages}
                  currentPage={CurrentPage}
                  rowCount={perPage}
                  pageInput={(row_, count_, page) => {
                    setCurrentPage(Number(page));
                    if (type === "all") {
                      if (Layout === "ANPR") {
                        getUnfilteredReport(
                          "base/anpr/reports/details",
                          page,
                          row_
                        );
                      }
                    } else if (type === "filter") {
                      getFilteredReport(
                        "base/anpr/reports/details",
                        page,
                        row_
                      );
                    }
                  }}
                  pageClicked={(ele, count_) => {
                    setCurrentPage(ele);
                    if (type === "all") {
                      if (Layout === "ANPR") {
                        getUnfilteredReport(
                          "base/anpr/reports/details",
                          ele,
                          count_
                        );
                      }
                    } else if (type === "filter") {
                      getFilteredReport(
                        "base/anpr/reports/details",
                        ele,
                        count_
                      );
                    }
                  }}
                  handleSelect={(curr, ele) => {
                    setPerPage(ele);
                    setCurrentPage(1);
                    if (type === "all") {
                      if (Layout === "ANPR") {
                        getUnfilteredReport(
                          "base/anpr/reports/details",
                          1,
                          ele
                        );
                      }
                    } else if (type === "filter") {
                      getFilteredReport("base/anpr/reports/details", 1, ele);
                    }
                  }}
                />
              )}
            </BoxCard>
          </div>
        </div>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.4,
            }}
            className="report_slider_modal"
            onClick={() => {
              close();
              setcurrentSlide(0);
            }}
          >
            <div
              className="alert_slider_wrapper"
              onClick={(e) => e.stopPropagation()}
              style={{ width: isNumPlate ? "20vw" : "55vw" }}
            >
              <img
                src={selectedImage}
                onError={(e) => {
                  e.target.src = logo;
                }}
              />
              {/* <div className="slide_count_">
                {currentSlide + 1} / {Slides.length}
              </div>
              <Slider {...settings}>
                {Slides.map((item) => (
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
              </Slider> */}
            </div>
          </motion.div>
        )}
      </Navbar>
    </div>
  );
}
