import React, { Component } from "react";
import "./Navbar.scss";
import Theme from "../../assets/images/light.png";
import DarkTheme from "../../assets/images/dark.png";
import Notification from "../../assets/images/bell.png";
import Notification_active from "../../assets/images/active.png";
import Shutdown from "../../assets/images/shutdown.png";
import Expand from "../../assets/images/expand.png";
import { NavLink, withRouter } from "react-router-dom";
import Scrollbars from "react-custom-scrollbars";
import { encryptStorage } from "../../helper/storage";
import Modal from "../Modal/Modal";
import { API_URL, axiosApiInstance } from "../../helper/request";
import ReactTooltip from "react-tooltip";
import { SOCKET_URL } from "../../helper/request";
import socketio from "socket.io-client";
import axios from "axios";
import Loading from "../Loading/Loading";
import SwitchBox from "../SwitchBox/SwitchBox";

let interval = null;
let timeout = null;
let ldata = {
  role: "admin",
};
class Navbar extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.socket = socketio(SOCKET_URL);
    this.downloadSocket = socketio(SOCKET_URL);
  }
  state = {
    disableNav: false,
    userType: null,
    isLoginOpen: false,
    isNotificationOpen: false,
    sound: true,
    isShutdown: false,
    isRestart: false,
    theme: "Light",
    username: "",
    logoutPop: false,
    themeTooltip: "Dark Theme",
    isshutDownClicked: false,
    showUpdateSettingModal: false,
    isRestarting: false,
    notificationsArray: [],
    links: {
      superadmin: [
        {
          page: "/home",
          icon: "home",
          name: "HOME",
        },
        {
          page: "/camera",
          icon: "camera",
          name: "CAMERA",
        },
        {
          page: "/alerts",
          icon: "report",
          name: "ALERTS",
        },
        {
          page: "/report",
          icon: "assessment",
          name: "REPORT",
        },
        {
          page: "/settings",
          icon: "settings",
          name: "SETTINGS",
        },
        {
          page: "/users",
          icon: "people",
          name: "USERS",
        },
        {
          page: "/apps",
          icon: "widgets",
          name: "APPS",
        },
      ],
      operator: [
        {
          page: "/home",
          icon: "home",
          name: "HOME",
        },
        {
          page: "/camera",
          icon: "camera",
          name: "CAMERA",
        },
        {
          page: "/alerts",
          icon: "report",
          name: "ALERTS",
        },
      ],
      admin: [
        {
          page: "/home",
          icon: "home",
          name: "HOME",
        },
        {
          page: "/camera",
          icon: "camera",
          name: "CAMERA",
        },
        {
          page: "/alerts",
          icon: "report",
          name: "ALERTS",
        },

        {
          page: "/users",
          icon: "people",
          name: "USERS",
        },
      ],
      manufacturer: [
        {
          page: "/home",
          icon: "home",
          name: "HOME",
        },
        {
          page: "/settings",
          icon: "settings",
          name: "SETTINGS",
        },
      ],
    },
    showUpdateModal: {
      showPop: false,
      msg: "",
      type: "alert",
      header: "",
    },
    themeData: {},
    isThemeLoading: true,
  };

  resetModal = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      this.setState({
        showUpdateModal: {
          showPop: false,
          msg: "",
          type: "alert",
          header: "Error",
        },
      });
    }, 3000);
  };

  setModal = (msg, type) => {
    let _set = { ...this.state.showUpdateModal };
    _set.showPop = true;
    _set.msg = msg;
    _set.type = type;
    // showUpdateModal: {
    //   ...this.state.showUpdateModal,
    //   showPop: true,
    //   msg,
    //   type,
    //   header: "Error",
    // },
    this.setState({
      ..._set,
    });
    this.resetModal();
  };
  updateNotification = () => {
    this.socket.on("notification", (message) => {
      console.log("NOTIFICATION DATA", message);
      let ele = document.getElementById("notification");
      if (ele) {
        ele.play();
      }
      this.props.handleNotification && this.props.handleNotification(message);
      this.setState({
        notificationsArray: [message, ...this.state.notificationsArray],
      });
    });
  };
  getTheme = async () => {
    let res = await fetch("http://" + window.location.host + "/Theme.json");
    let jsonData = await res.json();
    this.setState({ isThemeLoading: false });
    this.setState({ themeData: { ...jsonData } });
  };
  componentDidMount() {
    this.getTheme();
    // console.log(window.location.href.includes("camera/add"));
    // console.log(window.location.href.search.length);
    // if (
    //   window.location.href.includes("camera/update") ||
    //   (window.location.href.includes("camera/add") &&
    //     window.location.href.search.length > 1)
    // ) {
    //   console.log("DISABLE the nav");
    //   this.setState({ disableNav: true });
    // } else {
    //   console.log("Enable the nav");
    //   this.setState({ disableNav: false });
    // }
    // let dataa = encryptStorage.getItem("UID");
    ldata = encryptStorage.getItem("UID");
    this.setState({
      username: ldata.username,
      userType: ldata.role,
      sound: ldata.notificationSound,
    });
    if (ldata.role !== "Manufacturer") {
      this.updateNotification();
    }

    const html = document.querySelector("html");
    if (!localStorage.getItem("theme")) {
      localStorage.setItem("theme", "Light");
      this.setState({ theme: "Light" });
      html.classList.add("light-theme");
      html.classList.remove("dark-theme");
    } else {
      this.setState({ theme: localStorage.getItem("theme") }, () => {
        if (this.state.theme === "Dark") {
          html.classList.add("dark-theme");
          html.classList.remove("light-theme");
        } else {
          html.classList.add("light-theme");
          html.classList.remove("dark-theme");
        }
      });
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps.systemUpdateData !== this.props.systemUpdateData) {
      let ele = document.querySelector(".t_modal");
      if (ele) {
        ele.style.display = "none";
      }
      if (this.props.systemUpdateData.open) {
        this.setState({
          showUpdateModal: {
            ...this.state.showUpdateModal,
            showPop: true,
            msg: this.props.systemUpdateData.msg,
            type: this.props.systemUpdateData.type,
            header: "",
          },
        });

        setTimeout(() => {
          this.setState({
            showUpdateModal: {
              ...this.state.showUpdateModal,
              showPop: false,
              msg: "",
              type: "alert",
              header: "",
            },
          });
        }, 5000);
      }
    }

    if (prevState.theme !== this.state.theme) {
      // ReactTooltip.hide(this.fooRef);
      ReactTooltip.rebuild();
    }
    if (prevState.isNotificationOpen !== this.state.isNotificationOpen) {
      let lData = encryptStorage.getItem("UID");
      this.setState({ sound: lData.notificationSound });
    }
  }
  componentWillUnmount() {
    clearInterval(interval);
    // this.socket.close();
  }
  postSound = (param) => {
    let lData = encryptStorage.getItem("UID");
    axiosApiInstance
      .post("host/notification/sound?status=" + param)
      .then((res) => {
        lData.notificationSound = param;
        encryptStorage.setItem("UID", lData);
      })
      .catch((err) => {
        console.debug("FAILED TO SAVE SOUND SETTING");
      });
  };

  changeTheme = () => {
    const html = document.querySelector("html");
    if (this.state.theme === "Dark") {
      localStorage.setItem("theme", "Light");
      this.setState({ theme: "Light" }, () => {
        this.props.handleThemeChange &&
          this.props.handleThemeChange(this.state.theme);
      });
      html.classList.add("light-theme");
      html.classList.remove("dark-theme");
      this.setState({ themeTooltip: "Dark Theme" });
    } else {
      this.setState({ theme: "Dark" }, () => {
        this.props.handleThemeChange &&
          this.props.handleThemeChange(this.state.theme);
      });
      localStorage.setItem("theme", "Dark");
      html.classList.add("dark-theme");
      html.classList.remove("light-theme");
      this.setState({ themeTooltip: "Light Theme" });
    }
    // var bodyStyles = document.body.style;
    // bodyStyles.setProperty("--background", "red");
    // bodyStyles.setProperty("--background-color", "black");
  };

  systemStartup = () => {
    axios
      .get(API_URL + "host/systemstartup")
      .then((res) => {})
      .catch((err) => {
        clearInterval(interval);
        // this.props.history.push("/restart");
        this.props.history.push({
          pathname: "/restart",
          state: {
            redirect: false,
          },
        });
      });
  };

  restart = () => {
    axios.get(API_URL + "host/restart");
    this.setState({ isRestarting: true });
    this.systemStartup();
    interval = setInterval(async () => {
      this.systemStartup();
    }, 2000);
  };

  shutdown = () => {
    this.props.history.push("/shutdown");
    // axios.get(API_URL + "host/shutdown");
  };

  logout = () => {
    axiosApiInstance
      .get("user/logout")
      .then((res) => {
        if (res.status === 200) {
          window.location.href = "/auth/login";
          encryptStorage.removeItem("UID");
          localStorage.clear();
        }
      })
      .catch((err) => {
        window.location.href = "/auth/login";
        encryptStorage.removeItem("UID");
        localStorage.clear();
      });
  };

  render() {
    if (this.state.isRestarting) {
      return <Loading text={"Restarting"} />;
    }
    return (
      <Scrollbars
        // style={{ zIndex: 5 }}
        autoHeight
        autoHeightMin={100}
        autoHeightMax="100vh"
        style={{ zIndex: "10" }}
        ref={this.myRef}
      >
        <ReactTooltip delayShow={200} />
        {this.state.sound && (
          <audio
            src="https://notificationsounds.com/storage/sounds/file-sounds-1148-juntos.mp3"
            id="notification"
            style={{ display: "none" }}
          />
        )}

        <div
          className={"navbar_root"}
          onClick={() => {
            if (this.state.isLoginOpen) {
              this.setState({ isLoginOpen: false });
            }
            if (this.state.isShutdown) {
              this.setState({ isShutdown: false });
            }
            if (this.state.isNotificationOpen) {
              this.setState({ isNotificationOpen: false });
            }
          }}
        >
          <div className="nav_header">
            <header className="navbar_horizontal">
              <div className="navbar_logo">
                <NavLink
                  onClick={(e) => {
                    if (this.props.disableNav) {
                      e.preventDefault();
                      return;
                    }
                  }}
                  to={"/home"}
                >
                  {!this.state.isThemeLoading && (
                    <img
                      className="navbar_logo_img"
                      src={
                        localStorage.getItem("theme") === "Dark"
                          ? SOCKET_URL + this.state.themeData?.logo_black_theme
                          : SOCKET_URL + this.state.themeData?.logo_white_theme
                      }
                      alt="brandlogo"
                    />
                  )}
                </NavLink>
              </div>
              <div className="navbar_name">
                {this.props.navName.toUpperCase()}
              </div>
              <div
                className="navbar_actions"
                data-tip={this.props.isDownloadTheme && "Download Theme"}
              >
                {this.props.isDownloadTheme && (
                  <div
                    data-tip="Download Theme"
                    onClick={this.props.downloadTheme}
                  >
                    <svg
                      width="28px"
                      height="28px"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        margin: "0 1vw",
                        cursor: "pointer",
                        filter: "var(--icon-color-invert)",
                      }}
                    >
                      <path
                        fillRule="evenodd"
                        clip-rule="evenodd"
                        d="M2.76923 12.2581C3.19407 12.2581 3.53846 12.6047 3.53846 13.0323V16.795C3.53846 17.46 4.03556 18.0049 4.68081 18.0597C6.63373 18.2255 9.7196 18.4516 12 18.4516C14.2804 18.4516 17.3663 18.2255 19.3192 18.0597C19.9644 18.0049 20.4615 17.46 20.4615 16.795V13.0323C20.4615 12.6047 20.8059 12.2581 21.2308 12.2581C21.6556 12.2581 22 12.6047 22 13.0323V16.795C22 18.2514 20.9036 19.479 19.4485 19.6026C17.494 19.7685 14.3512 20 12 20C9.64875 20 6.50602 19.7685 4.55147 19.6026C3.09638 19.479 2 18.2514 2 16.795V13.0323C2 12.6047 2.3444 12.2581 2.76923 12.2581Z"
                        fill="#030D45"
                      />
                      <path
                        fillRule="evenodd"
                        clip-rule="evenodd"
                        d="M11.4561 13.5797C11.7565 13.882 12.2435 13.882 12.5439 13.5797L15.6209 10.4829C15.9213 10.1806 15.9213 9.69039 15.6209 9.38805C15.3204 9.0857 14.8334 9.0857 14.533 9.38805L12.7692 11.1632V4.77419C12.7692 4.34662 12.4248 4 12 4C11.5752 4 11.2308 4.34662 11.2308 4.77419V11.1632L9.46701 9.38805C9.1666 9.0857 8.67955 9.0857 8.37915 9.38805C8.07875 9.69039 8.07875 10.1806 8.37915 10.4829L11.4561 13.5797Z"
                        fill="#030D45"
                      />
                    </svg>
                  </div>
                )}
                {this.props.onChange && (
                  <div
                    className="searchBox"
                    onMouseEnter={() => {
                      var ele = document.querySelector(".searchInput");
                      ele.classList.add("onhover");
                    }}
                    onMouseLeave={() => {
                      if (!this.props.searchValue) {
                        var ele = document.querySelector(".searchInput");
                        ele.classList.remove("onhover");
                      }
                    }}
                  >
                    <input
                      className="searchInput"
                      type="search"
                      name=""
                      autoComplete="false"
                      placeholder="Search"
                      onChange={this.props.onChange}
                      value={this.props.searchValue}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          this.props.onKeyDown();
                          // props.pageInput(pageNumber);
                        }
                      }}
                    />
                    <button className="searchButton">
                      <i className="material-icons s_icon">search</i>
                    </button>
                  </div>
                )}

                <div className="navbar_actions_buttons">
                  {this.state.theme === "Light" ? (
                    <img
                      className="navbar_actionbtn_img"
                      src={DarkTheme}
                      alt="theme"
                      onClick={this.changeTheme}
                      data-tip="Dark Theme"
                      // ref={(ref) => (this.fooRef = ref)}
                    />
                  ) : (
                    <img
                      className="navbar_actionbtn_img"
                      src={Theme}
                      alt="theme"
                      onClick={this.changeTheme}
                      data-tip="Light Theme"
                      // ref={(ref) => (this.fooRef = ref)}
                    />
                  )}
                  {this.state.userType !== "Manufacturer" && (
                    <div className="notification_Wrapper_">
                      <img
                        className="navbar_actionbtn_img"
                        src={
                          this.state.notificationsArray.length > 0
                            ? Notification_active
                            : Notification
                        }
                        alt="notification"
                        data-tip="Notification"
                        onClick={() => {
                          if (!this.props.disableNav) {
                            this.setState({
                              isNotificationOpen:
                                !this.state.isNotificationOpen,
                            });
                          }
                        }}
                      />
                      {this.state.isNotificationOpen && (
                        <div className="noti_pop">
                          {this.state.userType !== "Manufacturer" && (
                            <React.Fragment>
                              <NavLink to="/home">
                                <div className="user_popup_span">View All</div>
                              </NavLink>

                              <div className="popup_div" />
                            </React.Fragment>
                          )}

                          <div
                            className="user_popup_span"
                            style={{ alignSelf: "normal" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SwitchBox
                              label="Notification Sound"
                              value={this.state.sound}
                              onChange={() => {
                                this.setState({ sound: !this.state.sound });
                                this.postSound(!this.state.sound);
                              }}
                              // onChange={() => setTimezoneAutomatically(!TimezoneAutomatically)}
                            />
                          </div>

                          {/* <div
                        className="user_popup_span"
                        onClick={() => this.setState({ logoutPop: true })}
                      >
                        Logout
                      </div> */}
                        </div>
                      )}
                    </div>
                  )}

                  {(this.state.userType === "Superadmin" ||
                    this.state.userType === "Admin" ||
                    this.state.userType === "Manufacturer") && (
                    <div className="shut_wrapper_">
                      <img
                        className="navbar_actionbtn_img"
                        src={Shutdown}
                        alt="shutdown"
                        data-tip={
                          !this.state.isShutdown ? "Shutdown/Restart" : ""
                        }
                        onClick={() => {
                          if (!this.props.disableNav) {
                            this.setState(
                              { isShutdown: !this.state.isShutdown },
                              () => {
                                this.setState({ isLoginOpen: false });
                              }
                            );
                          }
                        }}
                      />
                      {this.state.isShutdown && (
                        <div className="shutdown_popup">
                          <div
                            className="shutdown_popup_span"
                            onClick={(e) =>
                              this.setState({
                                isRestart: !this.state.isRestart,
                              })
                            }
                          >
                            Restart
                          </div>
                          <div className="popup_div" />
                          <div
                            className="shutdown_popup_span"
                            onClick={(e) =>
                              this.setState({
                                isshutDownClicked:
                                  !this.state.isshutDownClicked,
                              })
                            }
                          >
                            Shutdown
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="navbar_actions_div" />
                <div className="navbar_actions_profile">
                  <div
                    className="navbar_profile_name"
                    onClick={() => {
                      if (!this.props.disableNav) {
                        this.setState(
                          { isLoginOpen: !this.state.isLoginOpen },
                          () => {
                            this.setState({ isShutdown: false });
                          }
                        );
                      }
                    }}
                  >
                    <div className="navbar_pf_name">{this.state.username}</div>
                    <img
                      className={
                        this.state.isLoginOpen
                          ? "navbar_pf_img navbar_invert"
                          : "navbar_pf_img"
                      }
                      src={Expand}
                      alt="expand"
                    />
                  </div>
                  {this.state.isLoginOpen && (
                    <div className="user_popup">
                      {this.state.userType !== "Manufacturer" && (
                        <React.Fragment>
                          <NavLink to="/profile">
                            <div className="user_popup_span">Profile</div>
                          </NavLink>
                          <div className="popup_div" />
                        </React.Fragment>
                      )}

                      {ldata.role.toLowerCase() !== "operator" && (
                        <React.Fragment>
                          <NavLink to="/device">
                            <div className="user_popup_span">Device Info</div>
                          </NavLink>
                          <div className="popup_div" />
                        </React.Fragment>
                      )}

                      <div
                        className="user_popup_span"
                        onClick={() => this.setState({ logoutPop: true })}
                      >
                        Logout
                      </div>
                    </div>
                  )}
                  <div className="navbar_profile_image">
                    <i className="material-icons navbar_profile_img">
                      account_circle
                    </i>
                    {/* <img
                      className="navbar_profile_img"
                      src={Profile}
                      alt="profile"
                    /> */}
                  </div>
                </div>
              </div>
            </header>
          </div>
          <div className="__wrapper__">
            <div className="side_nav_">
              <div
                className="navbar_verticle"
                style={{
                  backgroundColor:
                    this.state.theme === "Light" ? "var(--primary)" : "#181d23",
                }}
              >
                {this.state.links[ldata.role.toLowerCase()]?.map((item) => (
                  <NavLink
                    onClick={(e) => {
                      if (this.props.disableNav) {
                        e.preventDefault();
                        return;
                      }
                    }}
                    key={item.name}
                    to={item.page}
                    activeClassName="activated_tab"
                  >
                    <div className="navbar_verticle_tab">
                      <i className="material-icons">{item.icon}</i>
                      <span className="navbar_verticle_name">{item.name}</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
            {!this.props.sidenav && <div className="side_notification_"></div>}
            <div className="body_section">{this.props.children}</div>
          </div>
        </div>
        {this.state.logoutPop && (
          <Modal
            onConfirm={this.logout}
            handleClose={() => {
              this.setState({ logoutPop: false });
            }}
            type="confirm"
            errorHeader="Logout"
            errorText="Are you sure?"
          />
        )}
        {this.state.isRestart && (
          <Modal
            onConfirm={this.restart}
            handleClose={() => {
              this.setState({ isRestart: false });
            }}
            type="confirm"
            errorHeader="Device will reboot"
            errorText="Are you sure?"
          />
        )}

        {this.state.isshutDownClicked && (
          <Modal
            onConfirm={this.shutdown}
            handleClose={() => {
              this.setState({ isshutDownClicked: false });
            }}
            type="confirm"
            errorHeader="Device will shutdown"
            errorText="Are you sure?"
          />
        )}
        {this.state.showUpdateModal.showPop && (
          <Modal
            className={"transparent_modal"}
            handleClose={() => {
              this.setState({
                showUpdateModal: {
                  ...this.state.showUpdateModal,
                  showPop: false,
                  msg: "",
                  type: "alert",
                  header: "",
                },
              });
            }}
            type={
              this.state.showUpdateModal.type
                ? this.state.showUpdateModal.type
                : "alert"
            }
            errorHeader={
              this.state.showUpdateModal.type === "alert" ? "Error" : "Success"
            }
            errorText={this.state.showUpdateModal.msg}
          />
        )}
      </Scrollbars>
    );
  }
}

export default withRouter(Navbar);
