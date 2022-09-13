import React, { Component } from "react";
import Button from "../../../components/Button/Button";
import { BoxCard } from "../../../components/card/Card";
import Loading from "../../../components/Loading/Loading";
import Modal from "../../../components/Modal/Modal";
import Navbar from "../../../components/Navbar/Navbar";
import { axiosApiInstance } from "../../../helper/request";
import "./editService.scss";
import toast, { Toaster } from "react-hot-toast";
import Scrollbars from "react-custom-scrollbars";
import { encryptStorage } from "../../../helper/storage";
let Services = "";
let deepStreamLimit = "";
let usecaseLimit = "";
let cameraLimit = "";
let pageTime = 300;
let timeout = null;
let counterTimeout = null;
export default class EditService extends Component {
  state = {
    counter: 0,
    Service: [],
    isLoading: true,
    isLoading2: false,
    time: [
      {
        slot: "0-2",
        local: {},
        cameras: [],
      },
      {
        slot: "2-4",
        cameras: [],
        local: {},
      },
      {
        slot: "4-6",
        cameras: [],
        local: {},
      },
      {
        slot: "6-8",
        cameras: [],
        local: {},
      },
      {
        slot: "8-10",
        cameras: [],
        local: {},
      },
      {
        slot: "10-12",
        cameras: [],
        local: {},
      },
      {
        slot: "12-14",
        cameras: [],
        local: {},
      },
      {
        slot: "14-16",
        cameras: [],
        local: {},
      },
      {
        slot: "16-18",
        cameras: [],
        local: {},
      },
      {
        slot: "18-20",
        cameras: [],
        local: {},
      },
      {
        slot: "20-22",
        cameras: [],
        local: {},
      },
      {
        slot: "22-24",
        cameras: [],
        local: {},
      },
    ],
    StaticTime: [],
    apiData: {},
    Cameras: [],
    mouseState: false,
    editedSlot: [],
    selectedAI: [],
    selectedDependent: [],
    allCameras: [],
    isSuccess: false,
    showErrorModal: {
      showPop: false,
      msg: "",
      type: "alert",
      header: "",
    },
  };
  parentLoop = (arr, callback) => {
    for (let element of arr) {
      callback(element);
    }
  };

  notify = (data) => {
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

  resetModal = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      this.setState({
        showErrorModal: {
          ...this.state.showErrorModal,
          showPop: false,
          msg: "",
          type: "alert",
          header: "",
        },
      });
    }, 3000);
  };

  cameraMouseDown = (camera_item, camera_index, api_key, api_index) => {
    let _service_name = this.props.match.params.id;
    let _apiData = { ...this.state.apiData };
    let selectedAI = this.state.selectedAI;
    let globalAI = [..._apiData[api_key].global.AI];

    //to enable/disable slot
    if (globalAI.length > 0) {
      const intersection = selectedAI.filter(
        (element) => !globalAI.includes(element)
      );
      let add = globalAI.length + intersection.length;
      if (deepStreamLimit < add) {
        return;
      }
    } else {
      if (selectedAI.length > deepStreamLimit) {
        return;
      }
    }
    //end
    // if(Object.keys(_apiData[api_key].local).length > 0){
    if (this.checkIsCamera(Object.keys(_apiData[api_key].local), camera_item)) {
      if (
        _apiData[api_key].local[camera_item].Usecases.includes(_service_name)
      ) {
        let ucArr = [..._apiData[api_key].local[camera_item].Usecases];

        // removing UC
        let indexx = ucArr.indexOf(_service_name);
        ucArr.splice(indexx, 1);
        _apiData[api_key].local[camera_item].Usecases = [...ucArr];

        //removing AI
        let aiArr = [..._apiData[api_key].local[camera_item].AI];
        let dArr = [..._apiData[api_key].local[camera_item].Dependent];
        this.parentLoop(Services, (ser_ele) => {
          if (ser_ele.Service_id === _service_name) {
            this.parentLoop(ser_ele.Dependent_services.AI, (ai_ele) => {
              if (aiArr.includes(ai_ele)) {
                let aiIndex = aiArr.indexOf(ai_ele);
                aiArr.splice(aiIndex, 1);
              }
            });
            if (ser_ele.Category === "Analytics") {
              //removing dependent
              this.parentLoop(ser_ele.Dependent_services.Usecase, (ai_ele) => {
                if (dArr.includes(ai_ele)) {
                  let dIndex = dArr.indexOf(ai_ele);
                  dArr.splice(dIndex, 1);
                }
              });
            }
          }
        });
        _apiData[api_key].local[camera_item].AI = [...aiArr];
        _apiData[api_key].local[camera_item].Dependent = [...dArr];
      } else {
        if (_apiData[api_key].local[camera_item]?.Usecases) {
          if (_apiData[api_key].global.Usecases.includes(_service_name)) {
            _apiData[api_key].local[camera_item].Usecases.push(_service_name);
            Array.prototype.push.apply(
              _apiData[api_key].local[camera_item].AI,
              this.state.selectedAI
            );
            Array.prototype.push.apply(
              _apiData[api_key].local[camera_item].Dependent,
              this.state.selectedDependent
            );
          }
        } else {
          let obj = {
            Usecases: [],
            Dependent: [],
            AI: [],
          };
          _apiData[api_key].local[camera_item] = { ...obj };
          _apiData[api_key].local[camera_item].Usecases.push(_service_name);
          Array.prototype.push.apply(
            _apiData[api_key].local[camera_item].AI,
            this.state.selectedAI
          );
        }
      }
    }
    this.setState({ apiData: { ..._apiData }, mouseState: true });
  };

  onLoad = () => {
    let _apiData = { ...this.state.apiData };
    let _service_name = this.props.match.params.id;
    let Cameras = [];
    for (let [key, value] of Object.entries(this.state.apiData)) {
      let localval = Object.keys(value.local);
      localval.map((uc, ucind) => {
        value.local[uc]["Usecases"].map((localuc, localucind) => {
          if (localuc == _service_name) {
            Cameras.push(uc);
          }
        });
      });

      this.parentLoop(value.global.Cameras, (cam_ele) => {
        value.local[cam_ele].AI.length = 0;
        this.parentLoop(this.state.Service, (ser_ele) => {
          this.parentLoop(value.local[cam_ele].Usecases, (uc_ele) => {
            if (ser_ele.Service_id === uc_ele) {
              // value.local[cam_ele].AI.push(...ser_ele.Dependent_services.AI);
              Array.prototype.push.apply(
                value.local[cam_ele].AI,
                ser_ele.Dependent_services.AI
              );
            }

            if (ser_ele.Service_id === _service_name) {
              this.setState({
                selectedAI: [...ser_ele.Dependent_services.AI],
                selectedDependent: [...ser_ele.Dependent_services.Usecase],
              });
            }
          });
        });
      });
    }
    Cameras = [...new Set(Cameras)];
    this.setState({
      Cameras: [...Cameras],
      counter: pageTime,
      isLoading: false,
      apiData: { ..._apiData },
    });
  };
  componentDidMount() {
    this.getCameraLimit();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.counter !== this.state.counter) {
      if (this.state.Cameras.length > 0) {
        counterTimeout = setTimeout(() => {
          this.setState({ counter: this.state.counter - 1 }, () => {
            let ele = document.getElementById("s_timer");
            if (this.state.counter < 60) {
              ele.style.animation = "blink 1s linear infinite";
            }
            if (this.state.counter <= 0) {
              clearTimeout(counterTimeout);
              sessionStorage.removeItem("timer");
              this.setState({ isLoading2: true });
              axiosApiInstance
                .get("camera/finish_configure")
                .then((res) => {
                  this.props.history.push("/apps");
                })
                .catch((err) => {
                  this.setState({ isLoading2: false });
                  this.notify({
                    type: "alert",
                    msg: "Something went wrong in configuring service!",
                  });
                });
              return;
            }
          });
          // setCounter(counter - 1);
          sessionStorage.setItem("timer", this.state.counter - 1);
        }, 1000);
      }
    }
  }

  componentWillUnmount() {
    encryptStorage.removeItem("LIM");
  }

  renderClassName = (camera_item, camera_index, api_key, api_index) => {
    let _service_name = this.props.match.params.id;
    let _apiData = { ...this.state.apiData };
    if (_apiData[api_key].local[camera_item]) {
      if (_apiData[api_key].local[camera_item].Usecases) {
        if (
          _apiData[api_key].local[camera_item].Usecases.includes(_service_name)
        ) {
          return "child activeslot";
        } else {
          return "child";
        }
      }
    }

    return "child";
  };

  renderStyle = (camera_item, camera_index, api_key, api_index) => {
    let selectedAI = [...this.state.selectedAI];
    let _service_name = this.props.match.params.id;
    let _apiData = { ...this.state.apiData };
    let globalAI = [..._apiData[api_key].global.AI];

    if (globalAI.length > 0) {
      const intersection = selectedAI.filter(
        (element) => !globalAI.includes(element)
      );

      let add = globalAI.length + intersection.length;
      if (deepStreamLimit < add) {
        return "gray";
      } else {
        let staticUC = [..._apiData[api_key].global.Usecases];
        Array.prototype.push.apply(
          staticUC,
          _apiData[api_key].global.Dependent
        );
        Array.prototype.push.apply(staticUC, this.state.selectedDependent);

        staticUC.push(_service_name);
        staticUC = [...new Set(staticUC)];

        if (usecaseLimit < staticUC.length) {
          return "gray";
        } else {
          return "";
        }
      }
    } else {
      if (selectedAI.length > deepStreamLimit) {
        return "gray";
      }
      return "";
    }
  };

  findCameraName = (id) => {
    let cameraName = "";
    this.state.allCameras.map((item, index) => {
      if (item.Camera_id == id) {
        cameraName = item.Camera_name;
      }
    });

    return cameraName;
  };

  getCameras = async (id) => {
    axiosApiInstance
      .get("camera?Layout=list")
      .then((res) => {
        if (res.status == 200) {
          this.setState({ allCameras: res.data.Data });
        }
      })
      .catch((err) => {
        this.setState({
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong in fetching Camera Data!",
            type: "alert",
            header: "",
          },
        });
        this.resetModal();
        setTimeout(() => {
          this.props.history.push("/apps");
        }, 3000);
      });
  };

  getCameraLimit = async () => {
    let _lData = encryptStorage.getItem("LIM");
    if (_lData) {
      usecaseLimit = _lData.usecaseLimit;
      deepStreamLimit = _lData.deepStreamLimit;
      cameraLimit = _lData.cameraLimit;
      this.getServices();
      this.getCameras();
    } else {
      encryptStorage.removeItem("LIM");
      this.props.history.push("/apps");
    }
    // axiosApiInstance
    //   .get("base/device")
    //   .then((res) => {
    //     this.getCameras();
    //     this.getServices();
    //     usecaseLimit = res.data.Limitations.Usecase;
    //     deepStreamLimit = res.data.Limitations.Deepstream;
    //     cameraLimit = res.data.Limitations.Camera;
    //   })
    //   .catch((err) => {
    //     this.setState({
    //       showErrorModal: {
    //         ...this.state.showErrorModal,
    //         showPop: true,
    //         msg: "Something Went Wrong in fetching Camera Limits!",
    //         type: "alert",
    //         header: "",
    //       },
    //     });

    //     setTimeout(() => {
    //       this.props.history.push("/apps");
    //     }, 3000);
    //     this.resetModal();
    //   });
  };

  getServices = async () => {
    axiosApiInstance
      .get("service/?type=Usecase&packagedData=true&all=true")
      .then((res) => {
        this.getCameraSlots();
        this.setState({ Service: res.data.detail });
      })
      .catch((err) => {
        setTimeout(() => {
          this.props.history.push("/apps");
        }, 3000);
        this.setState({
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong in fetching Services!",
            type: "alert",
            header: "",
          },
        });
        this.resetModal();
      });
  };

  getCameraSlots = async () => {
    axiosApiInstance
      .get("camera/get_all_slots")
      .then((res) => {
        this.setState({ apiData: res.data }, () => {
          this.onLoad();
        });
      })
      .catch((err) => {
        setTimeout(() => {
          this.props.history.push("/apps");
        }, 3000);
        this.setState({
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong in fetching Camera Slots Data!",
            type: "alert",
            header: "",
          },
        });
        this.resetModal();
      });
  };

  submitEditService = async () => {
    let _apiData = { ...this.state.apiData };
    for (let [key, value] of Object.entries(_apiData)) {
      this.parentLoop(value.global.Cameras, (cam_ele) => {
        if (value.local[cam_ele].Usecases) {
          if (value.local[cam_ele].Usecases.length > 0) {
          } else {
            _apiData[key]["local"][cam_ele] = {};
          }
        }
      });
    }
    this.setState({ apiData: _apiData });

    let apikeys = Object.keys(this.state.apiData);
    let apiDatas = {};
    apikeys.map((items, ind) => {
      apiDatas[items] = {
        local: this.state.apiData[items]["local"],
      };
    });
    let body = {
      Timeslots: apiDatas,
      ServiceId: this.props.match.params.id,
    };
    this.setState({ isLoading: true });
    clearTimeout(counterTimeout);
    axiosApiInstance
      .post("camera/edit/usecase", body)
      .then((res) => {
        this.finishServices();
      })
      .catch((err) => {
        this.setState({
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong. Please Try again later!",
            type: "alert",
            header: "",
          },
        });
        setTimeout(() => {
          clearTimeout(counterTimeout);
          sessionStorage.removeItem("timer");
          encryptStorage.removeItem("LIM");
          this.props.history.push("/apps");
        }, 3000);
      });
  };

  finishServices = async () => {
    axiosApiInstance
      .get("camera/finish_configure")
      .then((res) => {
        if (res.status == 200) {
          this.setState({
            showErrorModal: {
              ...this.state.showErrorModal,
              showPop: true,
              msg: "Updated Successfully!",
              type: "success",
              header: "Success",
            },
          });
          setTimeout(() => {
            clearTimeout(counterTimeout);
            sessionStorage.removeItem("timer");
            encryptStorage.removeItem("LIM");
            this.props.history.push("/apps");
          }, 3000);
        }
      })
      .catch((err) => {
        this.setState({
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong. Please Try again later!",
            type: "alert",
            header: "",
          },
        });
        setTimeout(() => {
          clearTimeout(counterTimeout);
          sessionStorage.removeItem("timer");
          encryptStorage.removeItem("LIM");
          this.props.history.push("/apps");
        }, 3000);
      });
  };

  checkIsCamera = (arr, camid) => {
    let iscam = false;
    if (arr.length == 0) {
      iscam = false;
    } else {
      arr.map((items, index) => {
        if (items == camid) {
          iscam = true;
        }
      });
    }
    return iscam;
  };

  render() {
    const { apiData } = this.state;
    return (
      <div className="_edit_app_schduler_camera_">
        <Navbar sidenav navName="Edit Service">
          {this.state.Cameras.length > 0 && (
            <p className="scheduler_counter">
              Time Remaining:
              <span id="s_timer">
                {"0" +
                  Math.floor(this.state.counter / 60) +
                  ":" +
                  (this.state.counter % 60
                    ? this.state.counter % 60 > 9
                      ? this.state.counter % 60
                      : "0" + (this.state.counter % 60)
                    : "00")}
              </span>
            </p>
          )}

          <BoxCard
            className={"edit_service_card"}
            isLoading={this.state.isLoading}
            id="edit_service_card_"
            style={{
              paddingBottom: this.state.Cameras.length === 0 ? "1vw" : null,
              height: this.state.Cameras.length === 0 ? "20vh" : null,
            }}
          >
            {this.state.Cameras.length > 0 && !this.state.isLoading ? (
              <div>
                <div>
                  <span style={{ textTransform: "capitalize" }}>
                    {this.props.match.params.id.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="container">
                  <div className="timeline-header">
                    <p className="h">Time (24 Hrs)</p>
                    <div className="timeline">
                      <div className="time">
                        <p>0</p>
                      </div>
                      <div className="time">
                        <p>2</p>
                      </div>
                      <div className="time">
                        <p>4</p>
                      </div>
                      <div className="time">
                        <p>6</p>
                      </div>
                      <div className="time">
                        <p>8</p>
                      </div>
                      <div className="time">
                        <p>10</p>
                      </div>
                      <div className="time">
                        <p>12</p>
                      </div>
                      <div className="time">
                        <p>14</p>
                      </div>
                      <div className="time">
                        <p>16</p>
                      </div>
                      <div className="time">
                        <p>18</p>
                      </div>
                      <div className="time">
                        <p>20</p>
                      </div>
                      <div className="time">
                        <p>22</p>
                      </div>
                      <div className="time">
                        <span>24</span>
                      </div>
                    </div>
                  </div>
                  <div className="timeline_info">
                    {/* <p className="select_text">Select All</p> */}
                    <p className="drag_text">Drag & Select Time Range</p>
                    {/* <p className="configure_text">Configure</p> */}
                  </div>

                  <div className="data-container">
                    <div className="flex">
                      <h1>Cameras</h1>
                      <div className="dummy" />
                    </div>
                    <Scrollbars autoHeight autoHeightMax="42vh">
                      <div className="app_fixed">
                        {this.state.Cameras.map((camera_item, camera_index) => (
                          <div className="flex" key={camera_item}>
                            <span className="name">
                              {this.findCameraName(camera_item)}
                            </span>

                            <div
                              className="dummy"
                              onMouseLeave={() =>
                                this.setState({ mouseState: false })
                              }
                              onMouseEnter={() =>
                                this.setState({ mouseState: false })
                              }
                            >
                              {Object.keys(apiData).map(
                                (api_key, api_index) => (
                                  <div
                                    key={api_key}
                                    className={this.renderClassName(
                                      camera_item,
                                      camera_index,
                                      api_key,
                                      api_index
                                    )}
                                    style={{
                                      backgroundColor: this.renderStyle(
                                        camera_item,
                                        camera_index,
                                        api_key,
                                        api_index
                                      ),
                                    }}
                                    onMouseDown={() => {
                                      this.cameraMouseDown(
                                        camera_item,
                                        camera_index,
                                        api_key,
                                        api_index
                                      );
                                    }}
                                    onMouseEnter={() => {
                                      if (this.state.mouseState) {
                                        this.cameraMouseDown(
                                          camera_item,
                                          camera_index,
                                          api_key,
                                          api_index
                                        );
                                      }
                                    }}
                                    onMouseUp={() =>
                                      this.setState({ mouseState: false })
                                    }
                                  >
                                    <div className="circle" />
                                  </div>
                                )
                              )}
                              <div className="circle2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Scrollbars>
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    bottom: "1vw",
                    display: "flex",
                    justifyContent: "center",
                    padding: "0 35vw",
                    width: "100%",
                  }}
                >
                  <Button
                    style={{ width: "6vw", margin: "0 2vw" }}
                    onClick={() => {
                      this.setState({ isLoading2: true });
                      axiosApiInstance
                        .get("camera/finish_configure")
                        .then((res) => {
                          this.props.history.push("/apps");
                        })
                        .catch((err) => {
                          this.setState({ isLoading2: false });
                          this.notify({
                            type: "alert",
                            msg: "Something went wrong in configuring service!",
                          });
                        });
                    }}
                    name="Back"
                  />
                  <Button
                    style={{ width: "6vw", margin: "0 2vw" }}
                    onClick={this.submitEditService}
                    type="gradient"
                    name="Submit"
                  />
                </div>
              </div>
            ) : (
              <div className="noData">
                <p>
                  NO CAMERA IS RUNNING{" "}
                  <span>{this.props.match.params.id.replaceAll("_", " ")}</span>
                </p>
                <Button
                  style={{ width: "6vw", margin: "0 2vw" }}
                  onClick={() => {
                    this.setState({ isLoading2: true });
                    axiosApiInstance
                      .get("camera/finish_configure")
                      .then((res) => {
                        this.props.history.push("/apps");
                      })
                      .catch((err) => {
                        this.setState({ isLoading2: false });
                        this.notify({
                          type: "alert",
                          msg: "Something went wrong in configuring service!",
                        });
                      });
                  }}
                  name="Back"
                />
              </div>
            )}
          </BoxCard>
        </Navbar>
        {this.state.showErrorModal.showPop && (
          <Modal
            className={"transparent_modal"}
            handleClose={() => {
              this.setState({
                showErrorModal: {
                  ...this.state.showErrorModal,
                  showPop: false,
                  msg: "",
                  type: "alert",
                  header: "",
                },
              });
            }}
            type={this.state.showErrorModal.type}
            errorHeader={
              this.state.showErrorModal.header
                ? this.state.showErrorModal.header
                : "Error"
            }
            errorText={this.state.showErrorModal.msg}
          />
        )}
        {this.state.isLoading2 && (
          <Loading type={"transparent"} text={"Loading"} />
        )}
      </div>
    );
  }
}
