import React, { useEffect, useState } from "react";
import { BoxCard, Card } from "../../../components/card/Card";
import DeviceLimitation from "../../../components/DeviceLimitation/DeviceLimitation";
import Navbar from "../../../components/Navbar/Navbar";
import Power from "../../../components/Power/Power";
import Timezone from "../../../components/Timezone/Timezone";
import WelcomeUser from "../../../components/WelcomeUser/WelcomeUser";
import { Responsive, WidthProvider } from "react-grid-layout";
import "./home.scss";
import socketio from "socket.io-client";
import {
  axiosApiInstance,
  randomID,
  SOCKET_URL,
} from "../../../helper/request";
import Scrollbars from "react-custom-scrollbars";
import Logo from "../../../assets/images/Logo.jpg";
import { useHistory } from "react-router-dom";
import useModal from "../../../helper/useModal";
import { motion } from "framer-motion";
import {
  container,
  homeMotion,
  homeMotion2,
  item,
} from "../../../helper/motions";
import { encryptStorage } from "../../../helper/storage";
import Statistics from "../../../components/Statistics/Statisics";
import StatusCard, { statusData } from "../../../components/Status/StatusCard";

import ReactTooltip from "react-tooltip";
// const ENDPOINT = "http://182.70.113.98:5000";
let lData = localStorage.getItem("showAnimation");
const socket = socketio(SOCKET_URL);
const socket2 = socketio(SOCKET_URL);
const socket3 = socketio(SOCKET_URL);
const socket4 = socketio(SOCKET_URL);
const socket5 = socketio(SOCKET_URL);
let selectedAlert = "";
const GridLayout = WidthProvider(Responsive);
const defaultProps = {
  cols: { lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 },
  className: "layout",
  rowHeight: 50,
  isResizable: false,
  isDraggable: false,
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
};

export default function Home() {
  let history = useHistory();
  const [response, setResponse] = useState("");
  // const [NetworkSpeed, setNetworkSpeed] = useState({
  //   upload: "0 MBPS",
  //   download: "0 MBPS",
  //   datetime: "",
  //   latency: "0 Sec",
  //   packetLoss: 0,
  //   jitter: 0,
  //   byteSent: "0 MB",
  //   byteReceived: "0 MB",
  // });
  const [NetworkSpeed, setNetworkSpeed] = useState({
    upload: "0 MBPS",
    download: "0 MBPS",
    latency: "0 Sec",
    packetLoss: 0,
    jitter: 0,
    byteSent: "0 MB",
    byteReceived: "0 MB",
  });
  // const [resLoading, setResLoading] = useState({
  //   deviceStats: true,
  //   notification: true,
  //   networkStat: false,
  //   speedStat: false,
  // });
  const [resLoading, setResLoading] = useState({
    deviceStats: true,
    notification: true,
    vehicle_card_stat: true,
    vehicle_count_stat: true,
    networkStat: false,
    speedStat: false,
  });
  const [Role, setRole] = useState(null);

  const [VehicleData, setVehicleData] = useState({
    per_hr_avg: 0,
    vehicle_count: 0,
    vehicle_today_count: 0,
  });

  const [notificationArray, setNotificationArray] = useState([]);
  const [notificationUnreadLength, setNotificationUnreadLength] = useState(0);
  const { modalOpen, close, open } = useModal();

  const [layout, setLayout] = useState({ ..._storedLayouts });
  const [activeTab, setActiveTab] = useState("Notifications");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "Light");
  const [BayGateModal, setBayGateModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [StatData, setStatData] = useState({});

  useEffect(() => {
    // ReactTooltip.rebuild();
  }, [NetworkSpeed]);

  useEffect(() => {
    let dataa = encryptStorage.getItem("UID");
    setRole(dataa.role);
    if (localStorage.getItem("showAnimation")) {
      setTimeout(() => {
        localStorage.removeItem("showAnimation");
      }, 1500);
    }
    console.log("calling")
    fetchSocketData();
    fetchNetworkData();
    fetchVehicleData();
    fetchVehicleCount();

    getLatpack();
    fetchSpeedData();
    if (dataa.role != "Manufacturer") {
      fetchNotification();
    }
    document.title = "Home";
    return () => {
      socket.off("device_stats");
      socket2.off("speed_test");
      socket3.off("network_statistics");
      socket4.off("get_count_avg");
      socket5.off("alerts_count");
    };
  }, []);

  const fetchVehicleData = () => {
    console.log("fetchVehicleData")
    axiosApiInstance.get("base/anpr/count/avg").then((res) => {
      socket4.on("get_count_avg", (data) => {
        console.log(data);
        setResLoading((prevState) => ({
          ...prevState,
          vehicle_card_stat: false,
        }));
        setVehicleData(data);
        // setResponse(data);
      });
    });
  };

  const fetchVehicleCount = () => {
    axiosApiInstance.get("base/anpr/alerts/count").then((res) => {
      console.log('fetchVehicleCount')
      socket5.on("alerts_count", (data) => {
        console.log(data, "hello");
        setResLoading((prevState) => ({
          ...prevState,
          vehicle_count_stat: false,
        }));
        // setVehicleData(data);

        setVehicleData((prevState) => ({
          ...prevState,
          vehicle_today_count: data,
        }));
      });
    });
  };

  const fetchSpeedData = () => {
    setResLoading((prevState) => ({
      ...prevState,
      speedStat: true,
    }));
    axiosApiInstance
      .get("host/network/statistics/speed")
      .then((res) => {
        socket2.on("speed_test", (data) => {
          console.log("data", data);
          setNetworkSpeed((prevState) => ({
            ...prevState,
            upload: data["upload"],
            download: data["download"],
            datetime: data["datetime"],
          }));
          setResLoading((prevState) => ({
            ...prevState,
            speedStat: false,
          }));
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchNetworkData = () => {
    socket3.on("network_statistics", (data) => {
      console.log(data);
      setNetworkSpeed((prevState) => ({
        ...prevState,
        latency: data["avg_latency"],
        packetLoss: data["packet_loss"],
        byteSent: data["bytes_sent"],
        byteReceived: data["bytes_received"],
        jitter: data["jitter"],
      }));
    });
  };

  const fetchSocketData = () => {
    //console.log("fetchSocketData");
    socket.on("device_stats", (data) => {
      setResLoading((prevState) => ({
        ...prevState,
        deviceStats: false,
      }));
      setResponse(data);
    });
  };
  const fetchNotification = () => {
    axiosApiInstance
      .get("base/notifications")
      .then((resp) => {
        setNotificationArray(resp.data.detail);
        setNotificationUnreadLength(resp.data.detail.length);
      })
      .catch((err) => {
        //console.log(err.response);
      })
      .finally(() => {
        setResLoading((prevState) => ({
          ...prevState,
          notification: false,
        }));
      });
  };

  const onBreakpointChange = (breakpoint) => {
    console.log(breakpoint);
  };

  const getLatpack = () => {
    setResLoading((prevState) => ({
      ...prevState,
      networkStat: true,
    }));
    axiosApiInstance
      .get("host/network/statistics/latpack")
      .then((res) => {
        console.log(res.data);
        setNetworkSpeed((prevState) => ({
          ...prevState,
          latency: res.data.detail["avg_latency"],
          packetLoss: res.data.detail["packet_loss"],
          byteSent: res.data.detail["bytes_sent"],
          byteReceived: res.data.detail["bytes_received"],
          jitter: res.data.detail["jitter"],
        }));
        fetchNetworkData();
      })
      .finally(() => {
        setResLoading((prevState) => ({
          ...prevState,
          networkStat: false,
        }));
      });
  };

  return (
    <motion.div
      className="__user_home__"
      variants={
        localStorage.getItem("showAnimation") ? homeMotion : homeMotion2
      }
      initial="hidden"
      animate="visible"
    >
      <Navbar
        navName="Home"
        handleNotification={(data) => {
          setNotificationArray((prevState) => {
            prevState.unshift(data);
            prevState.length >= 10 && prevState.pop();
            return prevState;
          });
          setNotificationUnreadLength((prevState) => {
            return prevState + 1;
          });
        }}
        handleThemeChange={(data) => {
          setTheme(data);
        }}
      >
        <div style={{ display: "flex" }}>
          <div className="_activity_">
            <div className="fixed_activity">
              {Role != "Manufacturer" && (
                <React.Fragment>
                  <div className="_flex fadeIn">
                    <div
                      className="active_line"
                      id={
                        activeTab === "Activity" ? "activity_" : "notification_"
                      }
                    />
                    <p
                      style={{
                        color:
                          activeTab === "Notifications"
                            ? "var(--text)"
                            : "#8E929D",
                      }}
                      onClick={() => setActiveTab("Notifications")}
                    >
                      Notifications
                      <span>{notificationUnreadLength}</span>
                    </p>
                    {/* <p
                  style={{
                    color: activeTab === "Activity" ? "var(--text)" : "#8E929D",
                    paddingRight: "1vw",
                  }}
                  onClick={() => setActiveTab("Activity")}
                >
                  Activity
                </p> */}
                  </div>
                  {activeTab === "Activity" ? (
                    <div className="activity_wrapper">Activities</div>
                  ) : (
                    <motion.div
                      className="notification_wrapper fadeIn"
                      variants={container}
                      // exit="exit"
                      initial="hidden"
                      animate="visible"
                    >
                      <Scrollbars
                        autoHeight
                        autoHeightMin={100}
                        autoHeightMax="80vh"
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
                              history={history}
                              onClick={() => {
                                selectedAlert = item.image[0];
                                open();
                              }}
                            />
                          );
                        })}
                      </Scrollbars>
                    </motion.div>
                  )}
                </React.Fragment>
              )}
            </div>
          </div>

          <div className="_grid_">
            <GridLayout
              {...defaultProps}
              // layouts={layout}
              layouts={layout}
              onLayoutChange={
                (layout, layouts) => {
                  // //console.log(layout, layouts)
                }
                // this.onLayoutChange(layout, layouts)
              }
              onBreakpointChange={onBreakpointChange}
            >
              <div key="attendance" className="box">
                <WelcomeUser theme={theme} Role={Role} />
              </div>
              <div key="notifications" className="box">
                <Card
                  isLoading={resLoading.deviceStats}
                  stat_name="RAM USAGE"
                  stat_usage={
                    response.ram_usage !== undefined &&
                    ((response.ram_usage * response.ram_size) / 100000)
                      .toString()
                      .substring(0, 3) +
                      " GB" +
                      " / " +
                      Math.round(response.ram_size / 1024).toString() +
                      // response.ram_size?.toString().substring(0, 1) +
                      " GB"
                  }
                  // stat_img={ram}
                  stat_icon={"fa-memory"}
                  iconType="fa"
                />
              </div>
              <div key="notifications2" className="box">
                <Card
                  isLoading={resLoading.deviceStats}
                  stat_name="CPU USAGE"
                  stat_usage={
                    response.cpu_usage && response.cpu_usage + " / 100 %"
                  }
                  stat_icon="memory"
                />
              </div>
              <div key="notifications3" className="box">
                <Card
                  isLoading={resLoading.deviceStats}
                  stat_name="GPU USAGE"
                  stat_usage={
                    response.gpu_percent &&
                    response.gpu_percent + " / " + "100 %"
                  }
                  stat_icon={"mdi-expansion-card"}
                  iconType="mdi"
                  // stat_icon=""
                />
              </div>
              <div key="notifications4" className="box">
                <Card
                  isLoading={resLoading.deviceStats}
                  stat_name="STORAGE"
                  stat_usage={
                    response.storage_used &&
                    response.storage_used +
                      " GB" +
                      " / " +
                      response.storage_total +
                      " GB"
                  }
                  stat_icon="sd_card"
                />
              </div>
              <div key="timeZone" className="box">
                <Timezone onClick={() => history.push("/settings")} />
              </div>
              <div key="powerOn" className="box">
                <Power type={"on"} />
              </div>
              <div key="powerOff" className="box">
                <Power />
              </div>
              <div key="deviceLimitation" className="box">
                <DeviceLimitation />
              </div>
              <div key="network_speed" className="box">
                <BoxCard
                  style={{
                    padding: "0.4vw",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    // alignItems: "center",
                    justifyContent: "center",
                  }}
                  id="network_speed_"
                  isLoading={resLoading.speedStat}
                >
                  <ReactTooltip multiline={true} />
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <p className="last_update">Last Updated on </p>
                    <p className="last_update">{NetworkSpeed.datetime}</p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-around",
                      marginTop: "0.7vw",
                    }}
                  >
                    <div className="speed_wrapper">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i
                          className="material-icons"
                          style={{
                            color: "var(--primary)",
                            fontSize: "0.9vw",
                            alignSelf: "flex-start",
                            borderRadius: "50%",
                            padding: "4px",
                            border: "1px solid var(--primary)",
                            filter: "var(--icon-color)",
                          }}
                        >
                          file_download
                        </i>
                        <p className="net_header">DOWNLOAD</p>
                        {/* <p className="net_sub_header">Mbps</p> */}
                      </div>
                      <div className="net_speed">
                        {NetworkSpeed.download} Mbps
                      </div>
                    </div>
                    <div className="speed_wrapper">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i
                          className="material-icons"
                          style={{
                            color: "var(--primary)",
                            fontSize: "0.9vw",
                            alignSelf: "flex-start",
                            borderRadius: "50%",
                            padding: "4px",
                            border: "1px solid var(--primary)",
                            filter: "var(--icon-color)",
                          }}
                        >
                          file_upload
                        </i>
                        <p className="net_header">UPLOAD</p>
                        {/* <p className="net_sub_header">Mbps</p> */}
                      </div>
                      <div className="net_speed">
                        {NetworkSpeed.upload} Mbps
                      </div>
                    </div>
                  </div>
                  <p className="last_update">
                    <i
                      class="material-icons refresh_"
                      onClick={() => {
                        if (!resLoading.speedStat) {
                          fetchSpeedData();
                        }
                      }}
                      data-tip="Click to refresh"
                    >
                      refresh
                    </i>
                  </p>
                </BoxCard>
              </div>
              {/* <div key="upload" className="box">
                <BoxCard
                  // isLoading={resLoading.speedStat}
                  style={{
                    padding: "0.8vw",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  id="file_upload"
                >
                  <i
                    className="material-icons"
                    style={{
                      color: "var(--primary)",
                      fontSize: "2.5vw",
                      backgroundColor: "var(--sidebar)",
                      borderRadius: "50%",
                      padding: "00.3vw",
                    }}
                  >
                    file_upload
                  </i>
                  <p className="card__title">{NetworkSpeed.upload}</p>
                </BoxCard>
              </div> */}
              {/* <div key="download" className="box">
                <BoxCard
                  // isLoading={resLoading.speedStat}
                  style={{
                    padding: "0.8vw",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  id="file_download"
                >
                  <i
                    className="material-icons"
                    style={{
                      color: "var(--primary)",
                      fontSize: "2.5vw",
                      backgroundColor: "var(--sidebar)",
                      borderRadius: "50%",
                      padding: "00.3vw",
                    }}
                  >
                    file_download
                  </i>
                  <p className="card__title">{NetworkSpeed.download}</p>
                </BoxCard>
              </div> */}
              <div key="todays_vehicle" className="box">
                <Card
                  // isLoading={resLoading.vehicle_card_stat}
                  stat_name="Today's Vehicle"
                  stat_usage={VehicleData.vehicle_count}
                  stat_icon="mdi-car-estate"
                  iconType={"mdi"}
                  onClick={() => {
                    var today = new Date();
                    var dd = String(today.getDate()).padStart(2, "0");
                    var mm = String(today.getMonth() + 1).padStart(2, "0");
                    var yy = today.getFullYear();
                    var hrs = today.getHours();
                    var mnt = today.getMinutes();
                    if (today.getMinutes() < 10) {
                      mnt = "0" + today.getMinutes();
                    }
                    if (hrs === 0) {
                      hrs = "00";
                    }
                    let dates = {
                      start: yy + "-" + mm + "-" + dd + "T" + "00:00",
                      end: yy + "-" + mm + "-" + dd + "T" + hrs + ":" + mnt,
                    };

                    history.push(
                      "report?today=true&type=ANPR&start=" +
                        dates.start +
                        "&end=" +
                        dates.end
                    );
                  }}
                />
              </div>
              <div key="avg_vehicle" className="box">
                <Card
                  // isLoading={resLoading.vehicle_card_stat}
                  stat_name="Avg. Vehicle Per Hour"
                  stat_usage={VehicleData.per_hr_avg}
                  stat_icon="mdi-car-multiple"
                  iconType={"mdi"}
                />
              </div>
              <div key="bay_activity_today" className="box">
                <Card
                  stat_name="Bay Activity Today"
                  stat_usage={3}
                  stat_icon="mdi-door-sliding-open"
                  iconType={"mdi"}
                  onClick={() => {
                    var today = new Date();
                    var dd = String(today.getDate()).padStart(2, "0");
                    var mm = String(today.getMonth() + 1).padStart(2, "0");
                    var yy = today.getFullYear();
                    var hrs = today.getHours();
                    var mnt = today.getMinutes();
                    if (today.getMinutes() < 10) {
                      mnt = "0" + today.getMinutes();
                    }
                    if (hrs === 0) {
                      hrs = "00";
                    }
                    let dates = {
                      start: yy + "-" + mm + "-" + dd + "T" + "00:00",
                      end: yy + "-" + mm + "-" + dd + "T" + hrs + ":" + mnt,
                    };

                    history.push(
                      "report?today=true&type=Baygate Activity&start=" +
                        dates.start +
                        "&end=" +
                        dates.end
                    );
                  }}
                />
              </div>
              <div key="baygate_status" className="box">
                <StatusCard
                  name="Baygate Activity Status"
                  iconClick={() => {
                    setBayGateModal(true);
                  }}
                />
              </div>
              <div key="security" className="box">
                <Card
                  onClick={() => {
                    var today = new Date();
                    var dd = String(today.getDate()).padStart(2, "0");
                    var mm = String(today.getMonth() + 1).padStart(2, "0");
                    var yy = today.getFullYear();
                    var hrs = today.getHours();
                    var mnt = today.getMinutes();
                    if (today.getMinutes() < 10) {
                      mnt = "0" + today.getMinutes();
                    }
                    if (hrs === 0) {
                      hrs = "00";
                    }
                    let dates = {
                      start: yy + "-" + mm + "-" + dd + "T" + "00:00",
                      end: yy + "-" + mm + "-" + dd + "T" + hrs + ":" + mnt,
                    };

                    history.push(
                      "alerts?today=true&start=" +
                        dates.start +
                        "&end=" +
                        dates.end
                    );
                  }}
                  isLoading={false}
                  stat_name="Critical/Security Alerts"
                  stat_usage={VehicleData.vehicle_today_count}
                  stat_icon="mdi-shield-lock-outline"
                  iconType={"mdi"}
                />
              </div>
              <div key="loaded" className="box">
                <Card
                  stat_name="Loaded"
                  stat_usage={"0"}
                  stat_icon="mdi-truck-check"
                  iconType={"mdi"}
                />
              </div>
              <div key="unloaded" className="box">
                <Card
                  stat_name="Unloaded"
                  stat_usage={22}
                  stat_icon="mdi-truck-minus"
                  iconType={"mdi"}
                />
              </div>
              <div key="vehicle_count" className="box">
                <BoxCard
                  className="vehicle_count"
                  // isLoading={resLoading.networkStat}
                  style={{
                    padding: "5px 25px",
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  id="networkStat"
                >
                  <Statistics
                    theme={theme}
                    type="bar"
                    title="Vehicle Count"
                    id="vehicle__count"
                    link="base/anpr/statistics"
                    filters={[
                      {
                        name: "Day",
                        id: "hrs_wise",
                      },
                      {
                        name: "Week",
                        id: "week_wise",
                      },
                      {
                        name: "Month",
                        id: "month_wise",
                      },
                    ]}
                    iconClick={(props) => {
                      setIsModalOpen(true);
                      setStatData({
                        ...props,
                        id: "modal_statistics",
                        expand: true,
                      });
                    }}
                  />
                </BoxCard>
              </div>
              <div key="bay_activity" className="box">
                <BoxCard
                  className="bay_activity"
                  // isLoading={resLoading.networkStat}
                  style={{
                    padding: "5px 25px",
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  id="bayActivityStat"
                >
                  <Statistics
                    theme={theme}
                    type="bar"
                    id="bay__activity"
                    title="Bay Activity"
                    link="base/anpr/statistics"
                    filters={[
                      {
                        name: "Day",
                        id: "hrs_wise",
                      },
                      {
                        name: "Week",
                        id: "week_wise",
                      },
                    ]}
                    iconClick={(props) => {
                      setIsModalOpen(true);
                      setStatData({
                        ...props,
                        id: "modal_statistics",
                        expand: true,
                      });
                    }}
                  />
                </BoxCard>
              </div>
              <div key="network" className="box">
                <BoxCard
                  className="networkCard__"
                  // isLoading={resLoading.networkStat}
                  style={{
                    padding: "10px 25px",
                    height: "100%",
                  }}
                  id="networkStat"
                >
                  <h2>Network Statistics</h2>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "40%",
                    }}
                  >
                    <div className="_flex">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <svg
                          width="30px"
                          height="30px"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M10.25 0a.75.75 0 000 1.5h1v1.278a9.955 9.955 0 00-5.635 2.276L4.28 3.72a.75.75 0 00-1.06 1.06l1.315 1.316A9.962 9.962 0 002 12.75c0 5.523 4.477 10 10 10s10-4.477 10-10a9.962 9.962 0 00-2.535-6.654L20.78 4.78a.75.75 0 00-1.06-1.06l-1.334 1.334a9.955 9.955 0 00-5.636-2.276V1.5h1a.75.75 0 000-1.5h-3.5zM12 21.25a8.5 8.5 0 100-17 8.5 8.5 0 000 17zm4.03-12.53a.75.75 0 010 1.06l-2.381 2.382a1.75 1.75 0 11-1.06-1.06l2.38-2.382a.75.75 0 011.061 0z"
                          />
                        </svg>
                        <p
                          className="card__title"
                          data-tip="Latency is the time it takes for data to be transferred between its original source and its destination."
                          data-class="r_tt_adjustt"
                        >
                          Latency
                        </p>
                      </div>
                      <p className="card__title">{NetworkSpeed.latency}</p>
                    </div>
                    <div className="_flex">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <svg
                          width="30px"
                          height="30px"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g>
                            <path fill="none" d="M0 0h24v24H0z" />
                            <path d="M16 16v-4l5 5-5 5v-4H4v-2h12zM8 2v3.999L20 6v2H8v4L3 7l5-5z" />
                          </g>
                        </svg>
                        <p
                          className="card__title"
                          data-tip="Jitter is a variance in latency, or the time delay between when a signal is transmitted and when it is received."
                          data-class="r_tt_adjustt"
                        >
                          Jitter
                        </p>
                      </div>
                      <p className="card__title">{NetworkSpeed.jitter}</p>
                    </div>
                    <div className="_flex">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <svg
                          width="30px"
                          height="30px"
                          viewBox="0 0 32 32"
                          id="icon"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <polygon points="22 23 13.83 23 16.41 20.41 15 19 10 24 15 29 16.41 27.59 13.83 25 22 25 22 23" />
                          <polygon points="11 13 19.17 13 16.59 10.41 18 9 23 14 18 19 16.59 17.59 19.17 15 11 15 11 13" />
                          <path
                            d="M24.5,25H24V23h.5a5.4961,5.4961,0,0,0,.377-10.9795l-.8365-.0566-.09-.834a7.9979,7.9979,0,0,0-15.9014,0l-.09.834-.8365.0566A5.4961,5.4961,0,0,0,7.5,23H8v2H7.5A7.4964,7.4964,0,0,1,6.1782,10.124a9.9992,9.9992,0,0,1,19.6436,0A7.4964,7.4964,0,0,1,24.5,25Z"
                            transform="translate(0 0)"
                          />
                          <rect
                            id="_Transparent_Rectangle_"
                            data-name="&lt;Transparent Rectangle&gt;"
                            style={{ fill: "none" }}
                            width="32"
                            height="32"
                          />
                        </svg>

                        <p
                          className="card__title"
                          data-tip="When accessing the internet or any network, small units of data called packets are sent and received. When one or more of these packets fails to reach its intended destination, this is called packet loss."
                          data-class="r_tt_adjustt"
                        >
                          Packet Loss
                        </p>
                      </div>

                      <p className="card__title">{NetworkSpeed.packetLoss}</p>
                    </div>
                    <div className="_flex">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <svg
                          width="30px"
                          height="30px"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M21.6907 4.8866C21.5876 3.54639 20.5567 2.41237 19.1134 2.30928C17.0515 2.10309 14.1649 2 12 2C9.83505 2 6.94845 2.10309 4.8866 2.30928C4.16495 2.30928 3.54639 2.61856 3.13402 3.13402C2.72165 3.64948 2.41237 4.16495 2.30928 4.8866C2.10309 6.94845 2 9.83505 2 12C2 14.1649 2.20619 17.0515 2.30928 19.1134C2.41237 20.4536 3.4433 21.5876 4.8866 21.6907C6.94845 21.8969 9.83505 22 12 22C14.1649 22 17.0515 21.7938 19.1134 21.6907C20.4536 21.5876 21.5876 20.5567 21.6907 19.1134C21.8969 17.0515 22 14.1649 22 12C22 9.83505 21.8969 6.94845 21.6907 4.8866ZM10.1443 12.2062L13.5464 15.6082C13.8557 15.9175 13.8557 16.433 13.5464 16.7423C13.3402 16.8454 13.2371 16.9485 13.0309 16.9485C12.8247 16.9485 12.6186 16.8454 12.5155 16.7423L9.1134 13.3402C8.39175 12.6186 8.39175 11.4845 9.1134 10.7629L12.5155 7.36082C12.8247 7.05155 13.3402 7.05155 13.6495 7.36082C13.9588 7.6701 13.9588 8.18557 13.6495 8.49485L10.2474 11.8969C10.0412 11.8969 10.0412 12.1031 10.1443 12.2062Z"
                            fill="#000"
                          />
                        </svg>

                        <p className="card__title">Byte Sent</p>
                      </div>

                      <p className="card__title">{NetworkSpeed.byteSent}</p>
                    </div>
                    <div className="_flex">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <svg
                          width="30px"
                          height="30px"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ transform: "rotate(180deg)" }}
                        >
                          <path
                            d="M21.6907 4.8866C21.5876 3.54639 20.5567 2.41237 19.1134 2.30928C17.0515 2.10309 14.1649 2 12 2C9.83505 2 6.94845 2.10309 4.8866 2.30928C4.16495 2.30928 3.54639 2.61856 3.13402 3.13402C2.72165 3.64948 2.41237 4.16495 2.30928 4.8866C2.10309 6.94845 2 9.83505 2 12C2 14.1649 2.20619 17.0515 2.30928 19.1134C2.41237 20.4536 3.4433 21.5876 4.8866 21.6907C6.94845 21.8969 9.83505 22 12 22C14.1649 22 17.0515 21.7938 19.1134 21.6907C20.4536 21.5876 21.5876 20.5567 21.6907 19.1134C21.8969 17.0515 22 14.1649 22 12C22 9.83505 21.8969 6.94845 21.6907 4.8866ZM10.1443 12.2062L13.5464 15.6082C13.8557 15.9175 13.8557 16.433 13.5464 16.7423C13.3402 16.8454 13.2371 16.9485 13.0309 16.9485C12.8247 16.9485 12.6186 16.8454 12.5155 16.7423L9.1134 13.3402C8.39175 12.6186 8.39175 11.4845 9.1134 10.7629L12.5155 7.36082C12.8247 7.05155 13.3402 7.05155 13.6495 7.36082C13.9588 7.6701 13.9588 8.18557 13.6495 8.49485L10.2474 11.8969C10.0412 11.8969 10.0412 12.1031 10.1443 12.2062Z"
                            fill="#000"
                          />
                        </svg>

                        <p className="card__title">Byte Received</p>
                      </div>

                      <p className="card__title">{NetworkSpeed.byteReceived}</p>
                    </div>
                  </div>
                </BoxCard>
              </div>
              {/* <div key="schedule" className="box">
                <ScheduleCard />
              </div> */}
              {/* <div key="graph" className="box">
                <LineGraph />
              </div> */}
            </GridLayout>
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
                src={SOCKET_URL + selectedAlert}
              />
            </div>
          </motion.div>
        )}
        {BayGateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.4,
            }}
            className="alert_slider_modal adjust_alert_slider_modal"
            onClick={() => {
              setBayGateModal(false);
            }}
          >
            <BoxCard className="alert_slider_wrapper">
              {/* <i
                className={"material-icons close_"}
                onClick={() => {
                  setBayGateModal(false);
                }}
              >
                close
              </i> */}
              <div className="stat_data">
                <Scrollbars autoHeight autoHeightMax="75vh">
                  <div>
                    {statusData.map((item) => {
                      if (item.status === "Active") {
                        return (
                          <div className="status" key={randomID()}>
                            <p> {item.name}</p>
                            <p
                              className="active__"
                              style={{ backgroundColor: "green" }}
                            >
                              Active
                            </p>
                          </div>
                        );
                      } else if (item.status === "Inactive") {
                        return (
                          <div className="status" key={randomID()}>
                            <p> {item.name}</p>
                            <p
                              className="active__"
                              style={{ backgroundColor: "red" }}
                            >
                              Inactive
                            </p>
                          </div>
                        );
                      } else {
                        return (
                          <div className="status" key={randomID()}>
                            <p> {item.name}</p>
                            <p
                              className="active__"
                              style={{ backgroundColor: "orange" }}
                            >
                              In Operation
                            </p>
                          </div>
                        );
                      }
                    })}
                  </div>
                </Scrollbars>
              </div>
              {/* {statusData.map((item, index) => (
                <div>{item.name}</div>
              ))} */}
            </BoxCard>
            {/* <div
              className="alert_slider_wrapper"
              onClick={(e) => e.stopPropagation()}
            >
            
            </div> */}
          </motion.div>
        )}
        {isModalOpen && (
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
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="alert_slider_wrapper alert_slider_wrapper_adjust"
              onClick={(e) => e.stopPropagation()}
            >
              {/* <i
                className={"material-icons close_"}
                onClick={() => setIsModalOpen(false)}
              >
                close
              </i> */}
              {Object.keys(StatData).length > 0 && <Statistics {...StatData} />}
              {/* */}
            </div>
          </motion.div>
        )}
      </Navbar>
    </motion.div>
  );
}

const _storedLayouts = {
  lg: [
    { i: "attendance", w: 6, h: 4, x: 0, y: 0 },
    { i: "notifications", w: 3, h: 2, x: 6, y: 0 },
    { i: "notifications2", w: 3, h: 2, x: 9, y: 0 },
    { i: "notifications3", w: 3, h: 2, x: 6, y: 0 },
    { i: "notifications4", w: 3, h: 2, x: 9, y: 0 },
    { i: "timeZone", w: 3, h: 6, x: 0, y: 6 },
    { i: "deviceLimitation", w: 3, h: 6, x: 3, y: 6 },
    { i: "network", w: 3, h: 6, x: 9, y: 6 },
    { i: "powerOn", w: 1.5, h: 3, x: 6, y: 6 },
    { i: "powerOff", w: 1.5, h: 3, x: 7.5, y: 6 },
    { i: "network_speed", w: 3, h: 3, x: 6, y: 9 },
    // { i: "todays_vehicle", w: 3, h: 2, x: 0, y: 4 },
    // { i: "upload", w: 1.5, h: 3, x: 6, y: 6 },
    // { i: "download", w: 1.5, h: 3, x: 7.5, y: 9 },
    // { i: "footfall", w: 3, h: 2, x: 0, y: 4 },
    // { i: "peopleIn", w: 3, h: 2, x: 3, y: 4 },
    // { i: "peopleOut", w: 3, h: 2, x: 6, y: 4 },
    // { i: "male", w: 3, h: 2, x: 9, y: 4 },
    // { i: "female", w: 3, h: 2, x: 9, y: 6 },
    // { i: "child", w: 3, h: 2, x: 0, y: 6 },
    // { i: "adult", w: 3, h: 2, x: 3, y: 6 },
    // { i: "senior", w: 3, h: 2, x: 6, y: 6 },
    // { i: "schedule", w: 3, h: 6, x: 9, y: 3 },
    // { i: "graph", w: 7, h: 8, x: 0, y: 4 },
  ],
  md: [
    { i: "attendance", w: 6, h: 4, x: 0, y: 0 },
    { i: "notifications", w: 3, h: 2, x: 6, y: 0 },
    { i: "notifications2", w: 3, h: 2, x: 9, y: 0 },
    { i: "notifications3", w: 3, h: 2, x: 6, y: 0 },
    { i: "notifications4", w: 3, h: 2, x: 9, y: 0 },
    { i: "timeZone", w: 4, h: 6, x: 0, y: 6 },
    { i: "deviceLimitation", w: 4, h: 6, x: 4, y: 6 },
    { i: "powerOn", w: 2, h: 3, x: 8, y: 6 },
    { i: "powerOff", w: 2, h: 3, x: 10, y: 9 },
    { i: "upload", w: 2, h: 3, x: 8, y: 6 },
    { i: "download", w: 2, h: 3, x: 10, y: 9 },
    { i: "network_speed", w: 4, h: 3, x: 8, y: 9 },

    { i: "todays_vehicle", w: 3, h: 2, x: 0, y: 9 },
    { i: "avg_vehicle", w: 3, h: 2, x: 3, y: 9 },
    { i: "bay_activity_today", w: 3, h: 2, x: 6, y: 9 },
    { i: "baygate_status", w: 3, h: 4, x: 9, y: 9 },
    { i: "security", w: 3, h: 2, x: 0, y: 10 },
    { i: "loaded", w: 3, h: 2, x: 3, y: 10 },
    { i: "unloaded", w: 3, h: 2, x: 6, y: 10 },

    { i: "vehicle_count", w: 6, h: 6, x: 0, y: 11 },
    { i: "bay_activity", w: 6, h: 6, x: 6, y: 11 },

    { i: "network", w: 4, h: 6, x: 0, y: 17 },
    // { i: "schedule", w: 3, h: 6, x: 8, y: 0 },
    // { i: "footfall", w: 3, h: 2, x: 0, y: 4 },
    // { i: "peopleIn", w: 3, h: 2, x: 3, y: 4 },
    // { i: "peopleOut", w: 3, h: 2, x: 6, y: 4 },
    // { i: "male", w: 3, h: 2, x: 9, y: 4 },
    // { i: "female", w: 3, h: 2, x: 9, y: 6 },
    // { i: "child", w: 3, h: 2, x: 0, y: 6 },
    // { i: "adult", w: 3, h: 2, x: 3, y: 6 },
    // { i: "senior", w: 3, h: 2, x: 6, y: 6 },
    // { i: "schedule", w: 3, h: 6, x: 8, y: 0 },
    // { i: "graph", w: 8, h: 8, x: 0, y: 0 },
  ],
  sm: [
    { i: "attendance", w: 6, h: 4, x: 0, y: 0 },
    { i: "notifications", w: 3, h: 2, x: 4, y: 0 },
    { i: "notifications2", w: 3, h: 2, x: 3, y: 0 },
    { i: "notifications3", w: 3, h: 2, x: 0, y: 2 },
    { i: "notifications4", w: 3, h: 2, x: 3, y: 2 },
    { i: "powerOn", w: 3, h: 3, x: 0, y: 0 },
    { i: "powerOff", w: 3, h: 3, x: 3, y: 0 },
    { i: "timeZone", w: 3, h: 6, x: 0, y: 0 },
    { i: "deviceLimitation", w: 3, h: 6, x: 3, y: 0 },
    { i: "upload", w: 3, h: 3, x: 8, y: 6 },
    { i: "download", w: 3, h: 3, x: 10, y: 9 },
    { i: "network", w: 3, h: 6, x: 0, y: 9 },

    // { i: "schedule", w: 3, h: 6, x: 3, y: 0 },
    // { i: "graph", w: 8, h: 8, x: 0, y: 0 },
  ],
  // sm: [
  //   { i: "attendance", w: 6, h: 6, x: 0, y: 0 },
  //   { i: "notifications", w: 2, h: 6, x: 0, y: 3 },
  //   { i: "timeZone", w: 2, h: 6, x: 4, y: 3 },
  //   { i: "deviceLimitation", w: 2, h: 3, x: 2, y: 3 },
  //   { i: "powerOn", w: 2, h: 3, x: 2, y: 6 },
  // ],
  // xs: [
  //   { i: "attendance", w: 4, h: 6, x: 0, y: 0 },
  //   { i: "notifications", w: 1, h: 6, x: 0, y: 3 },
  //   { i: "timeZone", w: 1, h: 6, x: 4, y: 3 },
  //   { i: "deviceLimitation", w: 2, h: 3, x: 1, y: 3 },
  //   { i: "powerOn", w: 2, h: 3, x: 1, y: 6 },
  // ],
  // xxs: [
  //   { i: "attendance", w: 2, h: 6, x: 0, y: 0 },
  //   { i: "notifications", w: 1, h: 6, x: 0, y: 3 },
  //   { i: "timeZone", w: 1, h: 6, x: 1, y: 3 },
  //   { i: "deviceLimitation", w: 2, h: 3, x: 0, y: 6 },
  //   { i: "powerOn", w: 2, h: 3, x: 0, y: 9 },
  // ],
};

export const NotificationCard = ({
  title,
  message,
  ticket_no,
  image,
  created,
  history,
  onClick,
}) => {
  const [isError, setisError] = useState(false);
  // let t_no = ticket_no ? ticket_no.split("_")[1] : null;
  return (
    <motion.div variants={item}>
      <div className="inline_noti_card">
        <img
          src={image ? SOCKET_URL + image[0] : Logo}
          className="m_adjust"
          onClick={() => {
            if (!isError) {
              onClick();
            }
          }}
          onError={(e) => {
            setisError(true);
            e.target.src = Logo;
          }}
          alt={message}
        />

        <div
          className="info"
          onClick={() => {
            if (ticket_no) {
              history.push("alerts?ticket_no=" + ticket_no);
            }
          }}
        >
          <h1>{message}</h1>
          {/* <h1>{title.replaceAll("_", " ")}</h1> */}
          {/* <p>{getDateTime(created)}</p> */}
          <p>{created}</p>
        </div>
      </div>
    </motion.div>
  );
};
// <Scrollbars autoHeight autoHeightMin="100%" autoHeightMax="100%">

// const _storedLayouts = {
//   lg: [
//     { i: "attendance", w: 6, h: 4, x: 0, y: 0 },
//     { i: "notifications", w: 3, h: 2, x: 6, y: 0 },
//     { i: "notifications2", w: 3, h: 2, x: 9, y: 0 },
//     { i: "notifications3", w: 3, h: 2, x: 6, y: 0 },
//     { i: "notifications4", w: 3, h: 2, x: 9, y: 0 },
//     { i: "timeZone", w: 3, h: 6, x: 0, y: 0 },
//     { i: "deviceLimitation", w: 3, h: 6, x: 3, y: 0 },
//     { i: "powerOn", w: 3, h: 3, x: 6, y: 0 },
//     { i: "powerOff", w: 3, h: 3, x: 6, y: 3 },
//     { i: "footfall", w: 3, h: 2, x: 0, y: 4 },
//     // { i: "schedule", w: 3, h: 6, x: 9, y: 3 },
//     // { i: "graph", w: 7, h: 8, x: 0, y: 4 },
//   ],
//   md: [
//     { i: "attendance", w: 6, h: 4, x: 0, y: 0 },
//     { i: "notifications", w: 2, h: 2, x: 6, y: 0 },
//     { i: "notifications2", w: 2, h: 2, x: 8, y: 0 },
//     { i: "notifications3", w: 2, h: 2, x: 6, y: 2 },
//     { i: "notifications4", w: 2, h: 2, x: 8, y: 2 },
//     { i: "timeZone", w: 3, h: 6, x: 0, y: 0 },
//     { i: "deviceLimitation", w: 3, h: 6, x: 3, y: 0 },
//     { i: "powerOn", w: 2, h: 3, x: 6, y: 0 },
//     { i: "powerOff", w: 2, h: 3, x: 8, y: 0 },
//     { i: "footfall", w: 3, h: 2, x: 0, y: 4 },

//     // { i: "schedule", w: 3, h: 6, x: 8, y: 0 },
//     // { i: "graph", w: 8, h: 8, x: 0, y: 0 },
//   ],
//   sm: [
//     { i: "attendance", w: 6, h: 4, x: 0, y: 0 },
//     { i: "notifications", w: 3, h: 2, x: 0, y: 0 },
//     { i: "notifications2", w: 3, h: 2, x: 3, y: 0 },
//     { i: "notifications3", w: 3, h: 2, x: 0, y: 2 },
//     { i: "notifications4", w: 3, h: 2, x: 3, y: 2 },
//     { i: "powerOn", w: 3, h: 3, x: 0, y: 0 },
//     { i: "powerOff", w: 3, h: 3, x: 3, y: 0 },
//     { i: "timeZone", w: 3, h: 6, x: 0, y: 0 },
//     { i: "deviceLimitation", w: 3, h: 6, x: 3, y: 0 },
//     // { i: "schedule", w: 3, h: 6, x: 3, y: 0 },
//     // { i: "graph", w: 8, h: 8, x: 0, y: 0 },
//   ],
//   // sm: [
//   //   { i: "attendance", w: 6, h: 6, x: 0, y: 0 },
//   //   { i: "notifications", w: 2, h: 6, x: 0, y: 3 },
//   //   { i: "timeZone", w: 2, h: 6, x: 4, y: 3 },
//   //   { i: "deviceLimitation", w: 2, h: 3, x: 2, y: 3 },
//   //   { i: "powerOn", w: 2, h: 3, x: 2, y: 6 },
//   // ],
//   // xs: [
//   //   { i: "attendance", w: 4, h: 6, x: 0, y: 0 },
//   //   { i: "notifications", w: 1, h: 6, x: 0, y: 3 },
//   //   { i: "timeZone", w: 1, h: 6, x: 4, y: 3 },
//   //   { i: "deviceLimitation", w: 2, h: 3, x: 1, y: 3 },
//   //   { i: "powerOn", w: 2, h: 3, x: 1, y: 6 },
//   // ],
//   // xxs: [
//   //   { i: "attendance", w: 2, h: 6, x: 0, y: 0 },
//   //   { i: "notifications", w: 1, h: 6, x: 0, y: 3 },
//   //   { i: "timeZone", w: 1, h: 6, x: 1, y: 3 },
//   //   { i: "deviceLimitation", w: 2, h: 3, x: 0, y: 6 },
//   //   { i: "powerOn", w: 2, h: 3, x: 0, y: 9 },
//   // ],
// };
