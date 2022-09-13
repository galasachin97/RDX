import React, { Children, Component } from "react";
import limits from "./limits.json";
import servicess from "./services.json";
import { motion } from "framer-motion";
import "./appscheduler.scss";
import { xMotion } from "../../../../helper/motions";
import { BoxCard } from "../../../../components/card/Card";
import { axiosApiInstance } from "../../../../helper/request";
import Button from "../../../../components/Button/Button";
import { withRouter } from "react-router";
import Modal from "../../../../components/Modal/Modal";
import AppConfiguration from "../AppConfiguration/AppConfiguration";
import Loading from "../../../../components/Loading/Loading";
import _ from "lodash";
import Scrollbars from "react-custom-scrollbars";
let Services = servicess["Services"];
let Limits = limits["details"]["Limitations"];
let deepStreamLimit = Limits["Deepstream"];
let usecaseLimit = Limits["Usecase"];
let cameraLimit = null;
let isAllTimeSelected = false;
let isAllUCSelected = [];
let disabledServices = [];
let camID = null;
let timeout = null;
let uploadCount = 1;
let counterTimeout = null;
let pageTime = 300;
class AppScheduler extends Component {
  state = {
    counter: 0,
    isLoading: true,
    isLoadingScreen: false,
    ActiveTab: "Scheduler",
    selectedService: "",
    DisabledTS: [],
    time: [
      "0-2",
      "2-4",
      "4-6",
      "6-8",
      "8-10",
      "10-12",
      "12-14",
      "14-16",
      "16-18",
      "18-20",
      "20-22",
      "22-24",
    ],
    mouseState: false,
    arr: [],
    isCamerPresent: false,
    Service: Services,
    // Service: [],
    selectedTimeSlot: [],
    staticDS: [],
    staticUC: [],
    staticDependent: [],
    configData: [],
    data: [
      {
        slot: "0-2",
        Usecases: [],
        AI: [],
        staticAI: [],
        staticUC: [],
        staticDependent: [],
        disabledService: [],
        Dependent: [],
      },
      {
        slot: "2-4",
        Usecases: [],
        AI: [],
        staticAI: [],
        staticUC: [],
        staticDependent: [],
        disabledService: [],
        Dependent: [],
      },
      {
        slot: "4-6",
        Usecases: [],
        AI: [],
        staticAI: [],
        staticUC: [],
        staticDependent: [],
        disabledService: [],
        Dependent: [],
      },
      {
        slot: "6-8",
        Usecases: [],
        AI: [],
        staticAI: [],
        staticUC: [],
        staticDependent: [],
        disabledService: [],
        Dependent: [],
      },
      {
        slot: "8-10",
        Usecases: [],
        AI: [],
        staticAI: [],
        staticUC: [],
        staticDependent: [],
        disabledService: [],
        Dependent: [],
      },
      {
        slot: "10-12",
        Usecases: [],
        AI: [],
        staticAI: [],
        staticUC: [],
        staticDependent: [],
        disabledService: [],
        Dependent: [],
      },
      {
        slot: "12-14",
        Usecases: [],
        AI: [],
        staticAI: [],
        staticUC: [],
        staticDependent: [],
        disabledService: [],
        Dependent: [],
      },
      {
        slot: "14-16",
        Usecases: [],
        AI: [],
        staticAI: [],
        staticUC: [],
        staticDependent: [],
        disabledService: [],
        Dependent: [],
      },
      {
        slot: "16-18",
        Usecases: [],
        AI: [],
        staticAI: [],
        staticUC: [],
        staticDependent: [],
        disabledService: [],
        Dependent: [],
      },
      {
        slot: "18-20",
        Usecases: [],
        AI: [],
        staticAI: [],
        staticUC: [],
        staticDependent: [],
        disabledService: [],
        Dependent: [],
      },
      {
        slot: "20-22",
        Usecases: [],
        AI: [],
        staticAI: [],
        staticUC: [],
        staticDependent: [],
        disabledService: [],
        Dependent: [],
      },
      {
        slot: "22-24",
        Usecases: [],
        AI: [],
        staticAI: [],
        staticUC: [],
        staticDependent: [],
        disabledService: [],
        Dependent: [],
      },
    ],
    apiData: {
      "0-2": {
        global: {
          Cameras: ["1"],
          Usecases: ["Weapon_Detection"],
          Dependent: [],
          AI: ["Weapon_Detection_AI"],
        },
        local: {
          1: {
            Usecases: ["Weapon_Detection"],
            AI: ["Weapon_Detection_AI"],
            Dependent: [],
          },
        },
      },
      "2-4": {
        global: {
          Cameras: [],
          Usecases: [],
          Dependent: [],
          AI: [],
        },
        local: {},
      },
      "4-6": {
        global: {
          Cameras: [],
          Usecases: [],
          Dependent: [],
          AI: [],
        },
        local: {},
      },
      "6-8": {
        global: {
          Cameras: [],
          Usecases: [],
          Dependent: [],
          AI: [],
        },
        local: {},
      },
      "8-10": {
        global: {
          Cameras: [],
          Usecases: [],
          Dependent: [],
          AI: [],
        },
        local: {},
      },
      "10-12": {
        global: {
          Cameras: [],
          Usecases: [],
          Dependent: [],
          AI: [],
        },
        local: {},
      },
      "12-14": {
        global: {
          Cameras: [],
          Usecases: [],
          Dependent: [],
          AI: [],
        },
        local: {},
      },
      "14-16": {
        global: {
          Cameras: [],
          Usecases: [],
          Dependent: [],
          AI: [],
        },
        local: {},
      },
      "16-18": {
        global: {
          Cameras: [],
          Usecases: [],
          Dependent: [],
          AI: [],
        },
        local: {},
      },
      "18-20": {
        global: {
          Cameras: [],
          Usecases: [],
          Dependent: [],
          AI: [],
        },
        local: {},
      },
      "20-22": {
        global: {
          Cameras: [],
          Usecases: [],
          Dependent: [],
          AI: [],
        },
        local: {},
      },
      "22-24": {
        global: {
          Cameras: [],
          Usecases: [],
          Dependent: [],
          AI: [],
        },
        local: {},
      },
    },
    activeUsecases: [],
    activeDS: [],
    activeDependent: [],
    isSuccess: false,
    showErrorModal: {
      showPop: false,
      msg: "",
      type: "alert",
      header: "",
    },
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

  parentLoop = (arr, callback) => {
    for (let element of arr) {
      callback(element);
    }
  };
  toggleUsecase = (service_id, type) => {
    //console.log("toggleUsecase()");
    let _data = [...this.state.data];
    if (type === "push") {
      this.parentLoop(_data, (ele) => {
        ele.disabledService.push(service_id);
        ele.disabledService = [...new Set(ele.disabledService)];
      });
    } else {
      this.parentLoop(_data, (ele) => {
        if (ele.disabledService.includes(service_id)) {
          var filterArr = ele.disabledService.filter(
            (item) => item != service_id
          );
          ele.disabledService = [...filterArr];
          ele.disabledService = [...new Set(ele.disabledService)];
          // var index = ele.disabledService.indexOf(service_id);
          // ele.disabledService.splice(index, 1);
        }
        // else ele.Usecases.push(service_id);
      });
    }
    this.setState({ data: _data });
  };

  timeslotMouseDown = async (i) => {
    let _selectedTimeSlot = [...this.state.selectedTimeSlot];
    let _service = [...this.state.Service];
    let _data = [...this.state.data];
    let isPresent = false;
    if (_selectedTimeSlot.includes(i)) {
      var index = _selectedTimeSlot.indexOf(i);
      _selectedTimeSlot.splice(index, 1);
      this.parentLoop(_data, (data_ele) => {
        this.parentLoop(_service, (_service_ele) => {
          if (data_ele.slot === i) {
            data_ele.disabledService.push(_service_ele.Service_id);
            data_ele.AI.length = 0;
            data_ele.Dependent.length = 0;
            data_ele.Usecases.length = 0;
          }
        });
      });
      isPresent = true;
    } else {
      _selectedTimeSlot.push(i);
      this.parentLoop(_data, (ele) => {
        if (ele.slot === i) {
          ele.disabledService.length = 0;
        }
      });
    }

    this.parentLoop(_service, (serv_item) => {
      if (serv_item.Dependent_services.AI.length <= deepStreamLimit) {
        if (serv_item.Category === "Analytics") {
          // console.log("object..........");
          // console.log(serv_item.Service_id);
        }
      } else {
        // console.log(serv_item.Service_id);
        disabledServices.push(serv_item.Service_id);
        disabledServices = [...new Set(disabledServices)];

        this.parentLoop(_data, (data_ele) => {
          if (data_ele.slot === i) {
            data_ele.disabledService.push(serv_item.Service_id);
            data_ele.disabledService = [...new Set(data_ele.disabledService)];
          }
        });
      }
    });
    await this.setState(
      {
        selectedTimeSlot: _selectedTimeSlot,
        data: _data,
        mouseState: true,
      },
      () => {
        // console.log(this.state.selectedTimeSlot);
        if (this.state.isCamerPresent) {
          if (!isPresent) {
            this.cameraPresent(i);
          }
        }
      }
    );
  };

  _UCLimitReached = (data_item, service_index, service_item, data_index) => {
    //console.log("_UCLimitReached");
    let _Service = [...this.state.Service];
    let _data = [...this.state.data];
    let _usecases = [..._data[data_index].Usecases];
    Array.prototype.push.apply(_usecases, data_item.Dependent);
    _usecases = [...new Set(_usecases)];
    //console.log(_usecases);
    this.parentLoop(_Service, (ele) => {
      if (!_usecases.includes(ele.Service_id)) {
        _data[data_index].disabledService.push(ele.Service_id);
      }
    });
    _data[data_index].disabledService = [
      ...new Set(_data[data_index].disabledService),
    ];
    this.setState({ data: _data });
  };
  _UCLimitReached2 = (data_item, service_index, service_item, data_index) => {
    //console.log("_UCLimitReached");
    let _Service = [...this.state.Service];
    let _data = [...this.state.data];
    let _usecases = [..._data[data_index].Usecases];
    Array.prototype.push.apply(_usecases, data_item.staticUC);
    Array.prototype.push.apply(_usecases, data_item.staticDependent);
    Array.prototype.push.apply(_usecases, data_item.Dependent);
    _usecases = [...new Set(_usecases)];
    this.parentLoop(_Service, (ele) => {
      if (!_usecases.includes(ele.Service_id)) {
        _data[data_index].disabledService.push(ele.Service_id);
      }
    });
    _data[data_index].disabledService = [
      ...new Set(_data[data_index].disabledService),
    ];
    this.setState({ data: _data });
  };
  _DSLimitReached = (data_item, service_index, service_item, data_index) => {
    //console.log("_DSLimitReached()");
    //console.log(this.state);
    let _data = [...this.state.data];
    let _Service = [...this.state.Service];
    let _usecases = _data[data_index].Usecases;
    let _AI = _data[data_index].AI;
    let _Dependent = _data[data_index].Dependent;
    let uniqueUC = [..._usecases];
    Array.prototype.push.apply(uniqueUC, _Dependent);
    uniqueUC = [...new Set(uniqueUC)];
    _AI = [...new Set(_AI)]; //extra

    this.parentLoop(_Service, (serv_ele) => {
      let result = [];
      if (serv_ele.Dependent_services.AI.length <= deepStreamLimit) {
        this.parentLoop(_usecases, (uc_ele) => {
          if (uc_ele === serv_ele.Service_id) result.push(true);
          else result.push(false);
        });
        // //console.log(serv_ele.Service_id, result);
        if (result.includes(true)) {
          //console.log("IF " + serv_ele.Service_id);
        } else {
          const intersection = serv_ele.Dependent_services.AI.filter(
            (value) => !_AI.includes(value)
          );
          //console.log(intersection);
          let add = _AI.length + intersection.length;
          if (deepStreamLimit < add) {
            //console.log("disabled DS: " + serv_ele.Service_id);
            _data[data_index].disabledService.push(serv_ele.Service_id);
            _data[data_index].disabledService = [
              ...new Set(_data[data_index].disabledService),
            ];
          } else {
            if (
              _data[data_index].disabledService.includes(serv_ele.Service_id)
            ) {
              var index = _data[data_index].disabledService.indexOf(
                serv_ele.Service_id
              );
              _data[data_index].disabledService.splice(index, 1);
              _data[data_index].disabledService = [
                ...new Set(_data[data_index].disabledService),
              ];
            }
          }
        }
      } else {
        //extra

        _data[data_index].disabledService.push(serv_ele.Service_id);
        _data[data_index].disabledService = [
          ...new Set(_data[data_index].disabledService),
        ];
      }
    });

    this.setState({ data: _data });
  };

  _DSLimitReached2 = (data_item, service_index, service_item, data_index) => {
    //console.log("_DSLimitReached()");
    //console.log(this.state);
    let _data = [...this.state.data];
    let _Service = [...this.state.Service];
    let _usecases = _data[data_index].Usecases;
    let _AI = [..._data[data_index].AI];
    _AI = [...new Set(_AI)];
    let _Dependent = _data[data_index].Dependent;
    let uniqueUC = [..._usecases];
    Array.prototype.push.apply(uniqueUC, _Dependent);
    uniqueUC = [...new Set(uniqueUC)];
    // console.log(_usecases);
    // console.log(uniqueUC);
    // console.log(_AI);
    this.parentLoop(_Service, (serv_ele) => {
      let result = [];
      if (serv_ele.Dependent_services.AI.length <= deepStreamLimit) {
        // console.log(serv_ele.Service_id);
        this.parentLoop(_usecases, (uc_ele) => {
          // console.log(uc_ele);
          if (uc_ele === serv_ele.Service_id) result.push(true);
          else result.push(false);
        });
        // console.log(serv_ele.Service_id, result);
        if (result.includes(true)) {
          //console.log("IF " + serv_ele.Service_id);
        } else {
          const intersection = serv_ele.Dependent_services.AI.filter(
            (value) => !_AI.includes(value)
          );
          // console.log(intersection);
          let add = _AI.length + intersection.length;
          // console.log(deepStreamLimit + "<" + add);
          if (deepStreamLimit < add) {
            _data[data_index].disabledService.push(serv_ele.Service_id);
            _data[data_index].disabledService = [
              ...new Set(_data[data_index].disabledService),
            ];
          } else {
            if (
              _data[data_index].disabledService.includes(serv_ele.Service_id)
            ) {
              var index = _data[data_index].disabledService.indexOf(
                serv_ele.Service_id
              );
              // console.log(index, serv_ele.Service_id);
              _data[data_index].disabledService.splice(index, 1);
              _data[data_index].disabledService = [
                ...new Set(_data[data_index].disabledService),
              ];
            }
          }
        }
      } else {
        //extra

        _data[data_index].disabledService.push(serv_ele.Service_id);
        _data[data_index].disabledService = [
          ...new Set(_data[data_index].disabledService),
        ];
      }
    });

    this.setState({ data: _data });
  };

  toggleAnalytics = (element, data_index) => {
    //console.log("toggleAnalytics()");
    //console.log(element, data_index);
    let _data = [...this.state.data];
    let _Service = [...this.state.Service];
    let _usecases = _data[data_index].Usecases;
    let _AI = _data[data_index].AI;
    let _Dependent = _data[data_index].Dependent;
    let uniqueUC = [..._usecases];
    Array.prototype.push.apply(uniqueUC, _Dependent);
    uniqueUC = [...new Set(uniqueUC)];
    let uniqueAI = [...new Set(_data[data_index].AI)];
    let intersection = element.Dependent_services.AI.filter(
      (x) => !uniqueAI.includes(x)
    );
    //console.log(intersection);
    let add = uniqueAI.length + intersection.length;
    //console.log();
    if (deepStreamLimit < add) {
      _data[data_index].disabledService.push(element.Service_id);
      _data[data_index].disabledService = [
        ...new Set(_data[data_index].disabledService),
      ];
    } else {
      //console.log("below DS range");
      let UCnDependent = [...element.Dependent_services.Usecase];
      UCnDependent.push(element.Service_id);
      //console.log(UCnDependent);
      let UCadd = [...uniqueUC];
      Array.prototype.push.apply(UCadd, UCnDependent);
      UCadd = [...new Set(UCadd)];
      //console.log(UCadd);
      //console.log(usecaseLimit + "<" + UCadd.length);
      if (usecaseLimit < UCadd.length) {
        _data[data_index].disabledService.push(element.Service_id);
        _data[data_index].disabledService = [
          ...new Set(_data[data_index].disabledService),
        ];
      } else {
        //console.log("false");
        var ucIndex = _data[data_index].disabledService.indexOf(
          element.Service_id
        );
        //console.log(ucIndex);
        if (ucIndex >= 0) {
          _data[data_index].disabledService.splice(ucIndex, 1);
          _data[data_index].disabledService = [
            ...new Set(_data[data_index].disabledService),
          ];
        }
      }
    }

    this.setState({ data: _data });
  };
  toggleAnalytics2 = (data_ele, item) => {
    //console.log("toggleAnalytics2()");
    let uniqueUCnD = [...data_ele.staticUC];
    let _data = [...this.state.data];
    Array.prototype.push.apply(uniqueUCnD, data_ele.Usecases);
    Array.prototype.push.apply(uniqueUCnD, data_ele.staticDependent);
    uniqueUCnD = [...new Set(uniqueUCnD)];
    let uniqueAI = [...data_ele.staticAI];
    let intersection = item.Dependent_services.AI.filter(
      (x) => !uniqueAI.includes(x)
    );
    //console.log(intersection);
    let add = uniqueAI.length + intersection.length;
    //console.log(uniqueAI);
    //console.log(add);
    if (deepStreamLimit < add) {
      data_ele.disabledService.push(item.Service_id);
      data_ele.disabledService = [...new Set(data_ele.disabledService)];
    } else {
      //console.log("below DS range");
      let UCnDependent = [...item.Dependent_services.Usecase];
      UCnDependent.push(item.Service_id);
      //console.log(UCnDependent);
      //console.log(uniqueUCnD);
      let UCadd = [...uniqueUCnD];
      Array.prototype.push.apply(UCadd, UCnDependent);
      UCadd = [...new Set(UCadd)];
      //console.log(UCadd);
      //console.log(usecaseLimit + "<" + UCadd.length);
      if (usecaseLimit < UCadd.length) {
        data_ele.disabledService.push(item.Service_id);
        data_ele.disabledService = [...new Set(data_ele.disabledService)];
      } else {
        //console.log("false");
        var ucIndex = data_ele.disabledService.indexOf(item.Service_id);
        //console.log(ucIndex);
        if (ucIndex >= 0) {
          data_ele.disabledService.splice(ucIndex, 1);
          data_ele.disabledService = [...new Set(data_ele.disabledService)];
        }
      }
    }
    this.setState({ data: _data });
  };

  toggleService = (data_item, service_index, service_item, data_index) => {
    //console.log(this.state);
    let _data = [...this.state.data];
    let _Service = [...this.state.Service];
    //console.log("toggleService()");
    let _usecases = _data[data_index].Usecases;
    let _AI = _data[data_index].AI;
    let _Dependent = _data[data_index].Dependent;
    let addArr = [..._usecases];
    Array.prototype.push.apply(addArr, _Dependent);
    addArr = [...new Set(addArr)];
    let uniqueAI = [...new Set(_data[data_index].AI)];
    if (!uniqueAI.length) {
      //console.log("DEFAULT STATE");
      this.parentLoop(_Service, (item) => {
        if (item.Dependent_services.AI.length <= deepStreamLimit) {
          var indexx = _data[data_index].disabledService.indexOf(
            item.Service_id
          );
          if (indexx >= 0) {
            _data[data_index].disabledService.splice(indexx, 1);
            _data[data_index].disabledService = [
              ...new Set(_data[data_index].disabledService),
            ];
          }
        } else {
          const intersection = item.Dependent_services.AI.filter(
            (value) => !uniqueAI.includes(value)
          );
          let add = uniqueAI.length + intersection.length;
          if (deepStreamLimit < add) {
            _data[data_index].disabledService.push(item.Service_id);
            _data[data_index].disabledService = [
              ...new Set(_data[data_index].disabledService),
            ];
          } else {
            //console.log("ELSE...............");
          }
        }
      });
    } else {
      //console.log("toggleService ELSE");
      let arr = [];
      this.parentLoop(_usecases, (ele) => {
        this.parentLoop(_Service, (ele2) => {
          if (ele2.Service_id === ele) {
            Array.prototype.push.apply(arr, ele2.Dependent_services.AI);
            arr = [...new Set(arr)];
          }
        });
      });
      //console.log(arr);
      if (arr.length > 1) {
        //console.log("ARR > 1");
        let filterData = _Service.filter(
          (item) => item.Dependent_services.AI.length <= deepStreamLimit
        );
        //console.log(filterData);
        this.parentLoop(filterData, (element) => {
          let result = [];
          this.parentLoop(arr, (ele) => {
            this.parentLoop(element.Dependent_services.AI, (ele2) => {
              if (ele === ele2) result.push(true);
              else result.push(false);
            });
          });

          if (result.includes(true)) {
            if (element.Category === "Analytics") {
              //console.log("calling analytics " + element.Service_name);
              this.toggleAnalytics(element, data_index);
            } else {
              let intersection = element.Dependent_services.AI.filter(
                (x) => !uniqueAI.includes(x)
              );
              //console.log(intersection);
              let add = uniqueAI.length + intersection.length;
              if (deepStreamLimit < add) {
                //console.log("disable4: " + element.Service_id);
                _data[data_index].disabledService.push(element.Service_id);
                _data[data_index].disabledService = [
                  ...new Set(_data[data_index].disabledService),
                ];
              } else {
                //console.log("enable4: " + element.Service_id);
                let uniqueD = [...new Set(_data[data_index].disabledService)];
                var ucIndex = uniqueD.indexOf(element.Service_id);
                //console.log(ucIndex);
                if (ucIndex >= 0) {
                  uniqueD.splice(ucIndex, 1);
                  _data[data_index].disabledService = [...uniqueD];
                }
              }
            }
          } else {
            if (element.Category === "Analytics") {
              //console.log("calling analytics " + element.Service_name);
              this.toggleAnalytics(element, data_index);
            } else {
              let intersection = element.Dependent_services.AI.filter(
                (x) => !uniqueAI.includes(x)
              );
              //console.log(intersection);
              let add = uniqueAI.length + intersection.length;
              //console.log(uniqueAI, intersection);
              //console.log(deepStreamLimit + "<" + add);
              if (deepStreamLimit < add) {
                //console.log("disable5: " + element.Service_id);
                _data[data_index].disabledService.push(element.Service_id);
                _data[data_index].disabledService = [
                  ...new Set(_data[data_index].disabledService),
                ];
              } else {
                //console.log("enable5: " + element.Service_id);
                let uniqueD = [...new Set(_data[data_index].disabledService)];
                var ucIndex = uniqueD.indexOf(element.Service_id);
                //console.log(ucIndex);
                if (ucIndex >= 0) {
                  uniqueD.splice(ucIndex, 1);
                  _data[data_index].disabledService = [...uniqueD];
                }
              }
            }
          }
        });
      } else {
        //console.log("ARR === 1");
        this.parentLoop(_Service, (element) => {
          if (element.Dependent_services.AI.length <= deepStreamLimit) {
            if (element.Dependent_services.AI.length === 1) {
              let result = [];
              this.parentLoop(arr, (ele) => {
                this.parentLoop(element.Dependent_services.AI, (ele2) => {
                  if (ele === ele2) result.push(true);
                  else result.push(false);
                });
              });

              if (result.includes(true)) {
                if (element.Category === "Analytics") {
                  //console.log("calling analytics " + element.Service_name);
                  this.toggleAnalytics(element, data_index);
                } else {
                  let intersection = element.Dependent_services.AI.filter(
                    (x) => !uniqueAI.includes(x)
                  );
                  let add = uniqueAI.length + intersection.length;
                  //console.log("RESULT");
                  //console.log(intersection);
                  //console.log(deepStreamLimit + "<" + add);
                  if (deepStreamLimit < add) {
                    //console.log("disable: " + element.Service_id);
                    _data[data_index].disabledService.push(element.Service_id);
                    _data[data_index].disabledService = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                  } else {
                    //console.log("enable: " + element.Service_id);
                    let uniqueD = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                    var ucIndex = uniqueD.indexOf(element.Service_id);
                    //console.log(ucIndex);
                    if (ucIndex >= 0) {
                      uniqueD.splice(ucIndex, 1);
                      _data[data_index].disabledService = [...uniqueD];
                    }
                  }
                }
              } else {
                if (element.Category === "Analytics") {
                  //console.log("calling analytics " + element.Service_name);
                  this.toggleAnalytics(element, data_index);
                } else {
                  let intersection = element.Dependent_services.AI.filter(
                    (x) => !uniqueAI.includes(x)
                  );
                  //console.log(intersection);
                  let add = uniqueAI.length + intersection.length;
                  //console.log("RESULT 1");
                  //console.log(intersection);
                  //console.log(deepStreamLimit + "<" + add);
                  if (deepStreamLimit < add) {
                    //console.log("disable1: " + element.Service_id);
                    _data[data_index].disabledService.push(element.Service_id);
                    _data[data_index].disabledService = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                  } else {
                    //console.log("enable1: " + element.Service_id);
                    let uniqueD = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                    var ucIndex = uniqueD.indexOf(element.Service_id);
                    //console.log(ucIndex);
                    if (ucIndex >= 0) {
                      uniqueD.splice(ucIndex, 1);
                      _data[data_index].disabledService = [...uniqueD];
                    }
                  }
                }
              }
            } else {
              let result = [];
              this.parentLoop(arr, (ele) => {
                this.parentLoop(element.Dependent_services.AI, (ele2) => {
                  if (ele === ele2) result.push(true);
                  else result.push(false);
                });
              });

              if (result.includes(true)) {
                if (element.Category === "Analytics") {
                  //console.log("calling analytics " + element.Service_name);
                  this.toggleAnalytics(element, data_index);
                } else {
                  let intersection = element.Dependent_services.AI.filter(
                    (x) => !uniqueAI.includes(x)
                  );
                  //console.log(intersection);
                  let add = uniqueAI.length + intersection.length;
                  //console.log("RESULT 2");
                  //console.log(intersection);
                  //console.log(deepStreamLimit + "<" + add);
                  if (deepStreamLimit < add) {
                    //console.log("disable2: " + element.Service_id);
                    _data[data_index].disabledService.push(element.Service_id);
                    _data[data_index].disabledService = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                  } else {
                    //console.log("enable2: " + element.Service_id);
                    let uniqueD = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                    var ucIndex = uniqueD.indexOf(element.Service_id);
                    //console.log(ucIndex);
                    if (ucIndex >= 0) {
                      uniqueD.splice(ucIndex, 1);
                      _data[data_index].disabledService = [...uniqueD];
                    }
                  }
                }
              } else {
                if (element.Category === "Analytics") {
                  //console.log("calling analytics " + element.Service_name);
                  this.toggleAnalytics(element, data_index);
                } else {
                  let intersection = element.Dependent_services.AI.filter(
                    (x) => !uniqueAI.includes(x)
                  );

                  let add = uniqueAI.length + intersection.length;
                  //console.log("RESULT 3");
                  //console.log(intersection);
                  //console.log(deepStreamLimit + "<" + add);
                  if (deepStreamLimit < add) {
                    //console.log("disable3: " + element.Service_id);
                    _data[data_index].disabledService.push(element.Service_id);
                    _data[data_index].disabledService = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                  } else {
                    //console.log("enable3: " + element.Service_id);
                    let uniqueD = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                    var ucIndex = uniqueD.indexOf(element.Service_id);
                    //console.log(ucIndex);
                    if (ucIndex >= 0) {
                      uniqueD.splice(ucIndex, 1);
                      _data[data_index].disabledService = [...uniqueD];
                    }
                  }
                }
              }
            }
          } else {
            //console.log(element.Service_name);
            _data[data_index].disabledService.push(element.Service_id);
            _data[data_index].disabledService = [
              ...new Set(_data[data_index].disabledService),
            ];
          }
        });
      }
    }
    //console.log(_data);
    this.setState({ data: _data });
  };

  toggleService2 = (data_item, service_index, service_item, data_index) => {
    //console.log("toggleService2()");
    //console.log(this.state);
    let _data = [...this.state.data];
    let _Service = [...this.state.Service];
    let _usecases = _data[data_index].Usecases;
    let _AI = [..._data[data_index].AI];
    Array.prototype.push.apply(_AI, data_item.staticAI);

    let _Dependent = _data[data_index].Dependent;
    let addArr = [..._usecases];
    Array.prototype.push.apply(addArr, data_item.staticUC);
    Array.prototype.push.apply(addArr, data_item.staticDependent);
    Array.prototype.push.apply(addArr, _Dependent);
    addArr = [...new Set(addArr)];
    let uniqueAI = [...new Set(_AI)];
    //console.log(addArr, uniqueAI);
    if (!uniqueAI.length) {
      //console.log("DEFAULT STATE");
      this.parentLoop(_Service, (item) => {
        if (item.Dependent_services.AI.length <= deepStreamLimit) {
          var indexx = _data[data_index].disabledService.indexOf(
            item.Service_id
          );
          if (indexx >= 0) {
            _data[data_index].disabledService.splice(indexx, 1);
            _data[data_index].disabledService = [
              ...new Set(_data[data_index].disabledService),
            ];
          }
        } else {
          const intersection = item.Dependent_services.AI.filter(
            (value) => !uniqueAI.includes(value)
          );
          let add = uniqueAI.length + intersection.length;
          if (deepStreamLimit < add) {
            _data[data_index].disabledService.push(item.Service_id);
            _data[data_index].disabledService = [
              ...new Set(_data[data_index].disabledService),
            ];
          } else {
            //console.log("ELSE...............");
          }
        }
      });
    } else {
      //console.log("toggleService ELSE");
      let arr = [];
      this.parentLoop(_usecases, (ele) => {
        this.parentLoop(_Service, (ele2) => {
          if (ele2.Service_id === ele) {
            Array.prototype.push.apply(arr, ele2.Dependent_services.AI);
            arr = [...new Set(arr)];
          }
        });
      });
      //console.log(arr);
      if (arr.length > 1) {
        //console.log("ARR > 1");
        let filterData = _Service.filter(
          (item) => item.Dependent_services.AI.length <= deepStreamLimit
        );
        //console.log(filterData);
        this.parentLoop(filterData, (element) => {
          let result = [];
          this.parentLoop(arr, (ele) => {
            this.parentLoop(element.Dependent_services.AI, (ele2) => {
              if (ele === ele2) result.push(true);
              else result.push(false);
            });
          });

          if (result.includes(true)) {
            if (element.Category === "Analytics") {
              //console.log("calling analytics " + element.Service_name);
              this.toggleAnalytics2(data_item, element);
            } else {
              let intersection = element.Dependent_services.AI.filter(
                (x) => !uniqueAI.includes(x)
              );
              //console.log(intersection);
              let add = uniqueAI.length + intersection.length;
              if (deepStreamLimit < add) {
                //console.log("disable4: " + element.Service_id);
                _data[data_index].disabledService.push(element.Service_id);
                _data[data_index].disabledService = [
                  ...new Set(_data[data_index].disabledService),
                ];
              } else {
                //console.log("enable4: " + element.Service_id);
                let uniqueD = [...new Set(_data[data_index].disabledService)];
                var ucIndex = uniqueD.indexOf(element.Service_id);
                //console.log(ucIndex);
                if (ucIndex >= 0) {
                  uniqueD.splice(ucIndex, 1);
                  _data[data_index].disabledService = [...uniqueD];
                }
              }
            }
          } else {
            if (element.Category === "Analytics") {
              //console.log("calling analytics " + element.Service_name);
              this.toggleAnalytics2(data_item, element);
            } else {
              let intersection = element.Dependent_services.AI.filter(
                (x) => !uniqueAI.includes(x)
              );
              //console.log(intersection);
              let add = uniqueAI.length + intersection.length;
              //console.log(uniqueAI, intersection);
              //console.log(deepStreamLimit + "<" + add);
              if (deepStreamLimit < add) {
                //console.log("disable5: " + element.Service_id);
                _data[data_index].disabledService.push(element.Service_id);
                _data[data_index].disabledService = [
                  ...new Set(_data[data_index].disabledService),
                ];
              } else {
                //console.log("enable5: " + element.Service_id);
                let uniqueD = [...new Set(_data[data_index].disabledService)];
                var ucIndex = uniqueD.indexOf(element.Service_id);
                //console.log(ucIndex);
                if (ucIndex >= 0) {
                  uniqueD.splice(ucIndex, 1);
                  _data[data_index].disabledService = [...uniqueD];
                }
              }
            }
          }
        });
      } else {
        //console.log("ARR === 1");
        this.parentLoop(_Service, (element) => {
          if (element.Dependent_services.AI.length <= deepStreamLimit) {
            if (element.Dependent_services.AI.length === 1) {
              let result = [];
              this.parentLoop(arr, (ele) => {
                this.parentLoop(element.Dependent_services.AI, (ele2) => {
                  if (ele === ele2) result.push(true);
                  else result.push(false);
                });
              });

              if (result.includes(true)) {
                if (element.Category === "Analytics") {
                  //console.log("calling analytics " + element.Service_name);
                  this.toggleAnalytics2(data_item, element);
                } else {
                  let intersection = element.Dependent_services.AI.filter(
                    (x) => !uniqueAI.includes(x)
                  );
                  let add = uniqueAI.length + intersection.length;
                  //console.log("RESULT");
                  //console.log(intersection);
                  //console.log(deepStreamLimit + "<" + add);
                  if (deepStreamLimit < add) {
                    //console.log("disable: " + element.Service_id);
                    _data[data_index].disabledService.push(element.Service_id);
                    _data[data_index].disabledService = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                  } else {
                    //console.log("enable: " + element.Service_id);
                    let uniqueD = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                    var ucIndex = uniqueD.indexOf(element.Service_id);
                    //console.log(ucIndex);
                    if (ucIndex >= 0) {
                      uniqueD.splice(ucIndex, 1);
                      _data[data_index].disabledService = [...uniqueD];
                    }
                  }
                }
              } else {
                if (element.Category === "Analytics") {
                  //console.log("calling analytics " + element.Service_name);
                  this.toggleAnalytics2(data_item, element);
                } else {
                  let intersection = element.Dependent_services.AI.filter(
                    (x) => !uniqueAI.includes(x)
                  );
                  //console.log(intersection);
                  let add = uniqueAI.length + intersection.length;
                  //console.log("RESULT 1");
                  //console.log(intersection);
                  //console.log(deepStreamLimit + "<" + add);
                  if (deepStreamLimit < add) {
                    //console.log("disable1: " + element.Service_id);
                    _data[data_index].disabledService.push(element.Service_id);
                    _data[data_index].disabledService = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                  } else {
                    //console.log("enable1: " + element.Service_id);
                    let uniqueD = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                    var ucIndex = uniqueD.indexOf(element.Service_id);
                    //console.log(ucIndex);
                    if (ucIndex >= 0) {
                      uniqueD.splice(ucIndex, 1);
                      _data[data_index].disabledService = [...uniqueD];
                    }
                  }
                }
              }
            } else {
              let result = [];
              this.parentLoop(arr, (ele) => {
                this.parentLoop(element.Dependent_services.AI, (ele2) => {
                  if (ele === ele2) result.push(true);
                  else result.push(false);
                });
              });

              if (result.includes(true)) {
                if (element.Category === "Analytics") {
                  //console.log("calling analytics " + element.Service_name);
                  this.toggleAnalytics2(data_item, element);
                } else {
                  let intersection = element.Dependent_services.AI.filter(
                    (x) => !uniqueAI.includes(x)
                  );
                  //console.log(intersection);
                  let add = uniqueAI.length + intersection.length;
                  //console.log("RESULT 2");
                  //console.log(intersection);
                  //console.log(deepStreamLimit + "<" + add);
                  if (deepStreamLimit < add) {
                    //console.log("disable2: " + element.Service_id);
                    _data[data_index].disabledService.push(element.Service_id);
                    _data[data_index].disabledService = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                  } else {
                    //console.log("enable2: " + element.Service_id);
                    let uniqueD = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                    var ucIndex = uniqueD.indexOf(element.Service_id);
                    //console.log(ucIndex);
                    if (ucIndex >= 0) {
                      uniqueD.splice(ucIndex, 1);
                      _data[data_index].disabledService = [...uniqueD];
                    }
                  }
                }
              } else {
                if (element.Category === "Analytics") {
                  //console.log("calling analytics " + element.Service_name);
                  this.toggleAnalytics2(data_item, element);
                } else {
                  let intersection = element.Dependent_services.AI.filter(
                    (x) => !uniqueAI.includes(x)
                  );

                  let add = uniqueAI.length + intersection.length;
                  //console.log("RESULT 3");
                  //console.log(intersection);
                  //console.log(deepStreamLimit + "<" + add);
                  if (deepStreamLimit < add) {
                    //console.log("disable3: " + element.Service_id);
                    _data[data_index].disabledService.push(element.Service_id);
                    _data[data_index].disabledService = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                  } else {
                    //console.log("enable3: " + element.Service_id);
                    let uniqueD = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                    var ucIndex = uniqueD.indexOf(element.Service_id);
                    //console.log(ucIndex);
                    if (ucIndex >= 0) {
                      uniqueD.splice(ucIndex, 1);
                      _data[data_index].disabledService = [...uniqueD];
                    }
                  }
                }
              }
            }
          } else {
            //console.log(element.Service_name);
            _data[data_index].disabledService.push(element.Service_id);
            _data[data_index].disabledService = [
              ...new Set(_data[data_index].disabledService),
            ];
          }
        });
      }
    }
    //console.log(_data);
    this.setState({ data: _data });
  };

  verifyLimits = (data_item, service_index, service_item, data_index) => {
    //console.log(this.state);
    let _data = [...this.state.data];
    let _Service = [...this.state.Service];
    //console.log("verifyLimits()");
    let _usecases = _data[data_index].Usecases;
    let _AI = _data[data_index].AI;
    let _Dependent = _data[data_index].Dependent;
    let addArr = [..._usecases];
    Array.prototype.push.apply(addArr, _Dependent);
    addArr = [...new Set(addArr)];
    let uniqueAI = [...new Set(_data[data_index].AI)];
    if (usecaseLimit === addArr.length) {
      //console.log(addArr);
      //console.log("Usecase limit reached");
      this._UCLimitReached(data_item, service_index, service_item, data_index);
    } else if (uniqueAI === deepStreamLimit) {
      //console.log(uniqueAI);
      //console.log("DS limit reached");
      this._DSLimitReached(data_item, service_index, service_item, data_index);
    } else {
      //console.log("verifyLimits ELSE");
      this.toggleService(data_item, service_index, service_item, data_index);
      // this._unchecked(service_item);
    }
  };

  usecaseMouseDown = (
    data_item,
    service_index,
    service_item,
    data_index,
    isIgnore
  ) => {
    let _activeUsecases = [...this.state.activeUsecases];
    let _activeDS = [...this.state.activeDS];
    let _Service = [...this.state.Service];
    let _data = [...this.state.data];
    let _activeDependent = [...this.state.activeDependent];
    let _usecases = _data[data_index].Usecases;
    let _AI = _data[data_index].AI;
    let _Dependent = _data[data_index].Dependent;
    let activeUC = [..._usecases];
    Array.prototype.push.apply(activeUC, _Dependent);
    // activeUC = [...new Set(activeUC)];
    //console.log(_usecases);
    //checking if usecase is added or not
    if (_usecases.includes(service_item.Service_id)) {
      if (isIgnore) {
        return;
      }
      var ucIndex = _data[data_index].Usecases.indexOf(service_item.Service_id);
      _data[data_index].Usecases.splice(ucIndex, 1);

      //removing DS
      let arr = [];
      //console.log(_usecases);
      this.parentLoop(_usecases, (ele) => {
        this.parentLoop(_Service, (ele2) => {
          if (ele2.Service_id === ele) {
            Array.prototype.push.apply(arr, ele2.Dependent_services.AI);
            // arr = [...new Set(arr)];
          }
        });
      });
      _activeDS = [...arr];
      //console.log(arr);
      _data[data_index].AI = [...arr];
      if (service_item.Category === "Analytics") {
        let dArr = _data[data_index].Dependent;

        this.parentLoop(service_item.Dependent_services.Usecase, (u_ele) => {
          if (dArr.includes(u_ele)) {
            let index = _data[data_index].Dependent.indexOf(u_ele);
            //console.log(index);
            if (index >= 0) {
              _data[data_index].Dependent.splice(index, 1);
            }
          }
        });
      }
    } else {
      //console.log(activeUC);
      //push data in time slot
      _data[data_index].Usecases.push(service_item.Service_id);
      if (service_item.Category === "Analytics") {
        let arr = [];
        arr.push(service_item.Service_id);
        Array.prototype.push.apply(
          arr,
          service_item.Dependent_services.Usecase
        );
        //console.log(arr);
        if (arr <= usecaseLimit) {
          Array.prototype.push.apply(
            _data[data_index].Dependent,
            service_item.Dependent_services.Usecase
          );
        } else {
          //console.log("else");
          Array.prototype.push.apply(
            _data[data_index].Dependent,
            service_item.Dependent_services.Usecase
          );
        }
      }

      Array.prototype.push.apply(
        _data[data_index].AI,
        service_item.Dependent_services.AI
      );
    }

    //console.log(activeUC);
    this.setState(
      {
        mouseState: true,
        data: _data,
        activeUsecases: _activeUsecases,
        activeDS: _activeDS,
        activeDependent: _activeDependent,
      },
      () =>
        this.verifyLimits(data_item, service_index, service_item, data_index)
    );
  };

  verifyLimits2 = (data_item, service_index, service_item, data_index) => {
    // console.log(data_item, service_index, service_item, data_index);
    //console.log(this.state);
    let _data = [...this.state.data];
    let _usecases = [..._data[data_index].Usecases];
    let _AI = [..._data[data_index].AI];
    Array.prototype.push.apply(_AI, data_item.staticAI);
    let _Dependent = _data[data_index].Dependent;
    let addArr = [..._usecases];
    Array.prototype.push.apply(addArr, data_item.staticUC);
    Array.prototype.push.apply(addArr, data_item.staticDependent);
    Array.prototype.push.apply(addArr, _Dependent);
    addArr = [...new Set(addArr)];
    // _AI = [...new Set(_AI)];
    let uniqueAI = [...new Set(_data[data_index].AI)];
    // console.log(uniqueAI);
    // console.log(uniqueAI);
    // console.log(addArr);
    if (usecaseLimit === addArr.length) {
      //console.log(addArr);
      this._UCLimitReached2(data_item, service_index, service_item, data_index);
    } else if (uniqueAI.length === deepStreamLimit) {
      //console.log(uniqueAI);
      this._DSLimitReached2(data_item, service_index, service_item, data_index);
    } else {
      //console.log(addArr);
      //console.log(this.state);
      this.toggleService2(data_item, service_index, service_item, data_index);
    }
  };

  usecaseMouseDown2 = (
    data_item,
    service_index,
    service_item,
    data_index,
    isIgnore
  ) => {
    let _activeUsecases = [...data_item.Usecases];
    let _activeDS = [...data_item.AI];
    let _activeDependent = [...data_item.Dependent];
    let _data = [...this.state.data];
    let _Service = [...this.state.Service];

    let addUC = [...data_item.staticUC];
    Array.prototype.push.apply(addUC, _activeUsecases);
    Array.prototype.push.apply(addUC, _activeDependent);
    // Array.prototype.push.apply(addUC, this.state.staticDependent);
    addUC = [...new Set(addUC)];
    const isUCPresent = _activeUsecases.includes(service_item.Service_id);
    //console.log(isUCPresent);
    //console.log(addUC);
    if (isUCPresent) {
      if (isIgnore) {
        return;
      }
      // console.log("UC PRESENT");
      var ucIndex = _data[data_index].Usecases.indexOf(service_item.Service_id);
      _data[data_index].Usecases.splice(ucIndex, 1);

      //removing DS
      let arr = [];
      //console.log(_data[data_index].Usecases);
      this.parentLoop(_data[data_index].Usecases, (ele) => {
        this.parentLoop(_Service, (ele2) => {
          if (ele2.Service_id === ele) {
            Array.prototype.push.apply(arr, ele2.Dependent_services.AI);
            // arr = [...new Set(arr)];
          }
        });
      });
      _activeDS = [...arr];
      //console.log(arr);
      _data[data_index].AI = [...arr];
      //console.log(_data[data_index].AI);
      if (service_item.Category === "Analytics") {
        //console.log("Analytics: " + service_item.Service_name);
        let dArr = _data[data_index].Dependent;

        this.parentLoop(service_item.Dependent_services.Usecase, (u_ele) => {
          if (dArr.includes(u_ele)) {
            let index = _data[data_index].Dependent.indexOf(u_ele);
            //console.log(index);
            if (index >= 0) {
              _data[data_index].Dependent.splice(index, 1);
            }
          }
        });
      }
    } else {
      // console.log("UC NOT PRESENT");

      //push data in time slot
      _data[data_index].Usecases.push(service_item.Service_id);
      if (service_item.Category === "Analytics") {
        let arr = [];
        arr.push(service_item.Service_id);
        Array.prototype.push.apply(
          arr,
          service_item.Dependent_services.Usecase
        );
        //console.log(arr);
        if (arr <= usecaseLimit) {
          Array.prototype.push.apply(
            _data[data_index].Dependent,
            service_item.Dependent_services.Usecase
          );
        } else {
          //console.log("else");
          Array.prototype.push.apply(
            _data[data_index].Dependent,
            service_item.Dependent_services.Usecase
          );
        }
      }

      Array.prototype.push.apply(
        _data[data_index].AI,
        service_item.Dependent_services.AI
      );
    }

    this.setState(
      {
        mouseState: true,
        data: _data,
      },

      () => {
        //console.log(this.state.data);
        this.verifyLimits2(data_item, service_index, service_item, data_index);
      }
      // //console.log(this.state)
    );
  };

  onLoad = () => {
    let _staticDS = [...this.state.staticDS];
    let _staticDependent = [...this.state.staticDependent];
    let _data = [...this.state.data];
    let staticUC = [...this.state.staticUC];
    let keys = Object.keys(this.state.apiData);
    let cameraLength = 0;
    for (let i = 0; i < keys.length; i++) {
      if (this.state.apiData[keys[i]].global.Cameras.length) {
        cameraLength += 1;
        Array.prototype.push.apply(
          _data[i].staticUC,
          this.state.apiData[keys[i]].global.Usecases
        );
        Array.prototype.push.apply(
          _data[i].staticAI,
          this.state.apiData[keys[i]].global.AI
        );
        Array.prototype.push.apply(
          _data[i].staticDependent,
          this.state.apiData[keys[i]].global.Dependent
        );
      }
    }

    staticUC = [...new Set(staticUC)];
    _staticDS = [...new Set(_staticDS)];
    //console.log(cameraLength);
    this.setState(
      {
        data: _data,
        staticUC: staticUC,
        staticDS: _staticDS,
        staticDependent: _staticDependent,
        isLoading: false,
      },
      () => {
        if (cameraLength) {
          this.setState({ isCamerPresent: true }, () => {
            let _data = [...this.state.data];
            let _service = [...this.state.Service];
            let _DisabledTS = [];
            for (let i = 0; i < keys.length; i++) {
              if (this.state.apiData[keys[i]].global.Cameras.length) {
                if (
                  this.state.apiData[keys[i]].global.Cameras.length >=
                  cameraLimit
                ) {
                  _DisabledTS.push(keys[i]);
                }
              }
            }

            this.parentLoop(_data, (data_ele) => {
              this.parentLoop(_service, (_service_ele) => {
                data_ele.disabledService.push(_service_ele.Service_id);
                data_ele.disabledService = [
                  ...new Set(data_ele.disabledService),
                ];
              });
            });

            this.setState({
              data: _data,
              DisabledTS: _DisabledTS,
            });
          });

          // console.log("CAMERA IS PRESENT");

          // this.setState({ isCamerPresent: true }, () => {
          //   let _data = [...this.state.data];
          //   let _service = [...this.state.Service];

          //   this.parentLoop(_data, (data_ele) => {
          //     this.parentLoop(_service, (_service_ele) => {
          //       data_ele.disabledService.push(_service_ele.Service_id);
          //       data_ele.disabledService = [
          //         ...new Set(data_ele.disabledService),
          //       ];
          //     });
          //   });
          //   this.setState({ data: _data });
          // });
        } else {
          this.setState({ isCamerPresent: false }, () =>
            this.cameraNotPresent()
          );
        }
        //console.log(this.state);
      }
    );
  };

  cameraNotPresent = () => {
    //console.log("cameraNotPresent()");
    let _data = [...this.state.data];
    let _service = [...this.state.Service];
    for (let servEle of _service) {
      isAllUCSelected.push(false);
      disabledServices.push(servEle.Service_id);
    }
    this.parentLoop(_data, (data_ele) => {
      this.parentLoop(_service, (_service_ele) => {
        data_ele.disabledService.push(_service_ele.Service_id);
        data_ele.disabledService = [...new Set(data_ele.disabledService)];
      });
    });
    this.setState({ data: _data });
  };

  cameraPresent = (i) => {
    //console.log("cameraPresent()");
    //console.log(this.state);
    let _data = [...this.state.data];
    // console.log(_data);
    let _service = [...this.state.Service];
    this.parentLoop(_data, (data_ele) => {
      if (data_ele.slot === i) {
        let uniqueUCnD = [...data_ele.staticUC];
        let _activeAI = [...data_ele.staticAI];
        Array.prototype.push.apply(uniqueUCnD, data_ele.staticDependent);
        uniqueUCnD = [...new Set(uniqueUCnD)];
        // //console.log(uniqueUCnD);
        // //console.log(_activeAI);
        //console.log(uniqueUCnD);
        if (uniqueUCnD.length >= usecaseLimit) {
          //console.log("USE CASE LIMIT REACHED: " + uniqueUCnD.length);
          this.parentLoop(_service, (item) => {
            //disable other usecase and DS
            if (!uniqueUCnD.includes(item.Service_id)) {
              // //console.log(item.Service_id);
              data_ele.disabledService.push(item.Service_id);
            }
          });
        } else {
          //console.log("USE CASE LIMIT NOT REACHED: " + uniqueUCnD.length);
          // //console.log(deepStreamLimit + " ===" + _activeAI.length);
          if (deepStreamLimit === _activeAI.length) {
            // //console.log("DS LIMIT REACHED V2");
            this.parentLoop(_service, (item) => {
              if (item.Dependent_services.AI.length <= _activeAI.length) {
                let result = [];

                this.parentLoop(item.Dependent_services.AI, (ele) => {
                  this.parentLoop(_activeAI, (ele2) => {
                    if (ele2 === ele) result.push(true);
                    else result.push(false);
                  });
                });
                if (!result.includes(true)) {
                  // //console.log(item.Service_id);
                  if (item.Category === "Analytics") {
                    // //console.log("CATEGORY IS ANALYTIC " + item.Service_id);
                    this.toggleAnalytics2(data_ele, item);
                  } else {
                    let intersection = item.Dependent_services.AI.filter(
                      (x) => !_activeAI.includes(x)
                    );
                    let add = _activeAI.length + intersection.length;
                    if (deepStreamLimit < add) {
                      // //console.log("disable4: " + item.Service_id);
                      data_ele.disabledService.push(item.Service_id);
                      data_ele.disabledService = [
                        ...new Set(data_ele.disabledService),
                      ];
                    } else {
                      // //console.log("enable4: " + item.Service_id);
                      let uniqueD = [...new Set(data_ele.disabledService)];
                      var ucIndex = uniqueD.indexOf(item.Service_id);
                      // //console.log(ucIndex);
                      if (ucIndex >= 0) {
                        uniqueD.splice(ucIndex, 1);
                        data_ele.disabledService = [...uniqueD];
                      }
                    }
                  }
                } else {
                  if (item.Category === "Analytics") {
                    //console.log("CATEGORY IS ANALYTIC " + item.Service_name);
                    this.toggleAnalytics2(data_ele, item);
                  } else {
                    let intersection = item.Dependent_services.AI.filter(
                      (x) => !_activeAI.includes(x)
                    );
                    let add = _activeAI.length + intersection.length;
                    if (deepStreamLimit < add) {
                      // //console.log("disable7: " + item.Service_id);
                      data_ele.disabledService.push(item.Service_id);
                      data_ele.disabledService = [
                        ...new Set(data_ele.disabledService),
                      ];
                    } else {
                      // //console.log("enable7: " + item.Service_id);
                      let uniqueD = [...new Set(data_ele.disabledService)];
                      var ucIndex = uniqueD.indexOf(item.Service_id);
                      // //console.log(ucIndex);
                      if (ucIndex >= 0) {
                        uniqueD.splice(ucIndex, 1);
                        data_ele.disabledService = [...uniqueD];
                      }
                    }
                  }
                }
              } else {
                data_ele.disabledService.push(item.Service_id);
                data_ele.disabledService = [
                  ...new Set(data_ele.disabledService),
                ];
              }
            });
          } else {
            //console.log("DS LIMIT NOT REACHED V2");
            this.parentLoop(_service, (item) => {
              if (item.Dependent_services.AI.length <= deepStreamLimit) {
                let result = [];

                this.parentLoop(item.Dependent_services.AI, (ele) => {
                  this.parentLoop(_activeAI, (ele2) => {
                    if (ele2 === ele) result.push(true);
                    else result.push(false);
                  });
                });
                // //console.log(item.Service_id);
                // //console.log(result);
                if (!result.includes(true)) {
                  // //console.log(item.Service_id);
                  if (item.Category === "Analytics") {
                    //console.log("CATEGORY IS ANALYTIC " + item.Service_id);
                    this.toggleAnalytics2(data_ele, item);
                  } else {
                    let intersection = item.Dependent_services.AI.filter(
                      (x) => !_activeAI.includes(x)
                    );
                    let add = _activeAI.length + intersection.length;
                    if (deepStreamLimit < add) {
                      // //console.log("disable4: " + item.Service_id);
                      data_ele.disabledService.push(item.Service_id);
                      data_ele.disabledService = [
                        ...new Set(data_ele.disabledService),
                      ];
                    } else {
                      // //console.log("enable4: " + item.Service_id);
                      let uniqueD = [...new Set(data_ele.disabledService)];
                      var ucIndex = uniqueD.indexOf(item.Service_id);
                      // //console.log(ucIndex);
                      if (ucIndex >= 0) {
                        uniqueD.splice(ucIndex, 1);
                        data_ele.disabledService = [...uniqueD];
                      }
                    }
                  }
                } else {
                  if (item.Category === "Analytics") {
                    //console.log("CATEGORY IS ANALYTIC " + item.Service_name);
                    this.toggleAnalytics2(data_ele, item);
                  } else {
                    let intersection = item.Dependent_services.AI.filter(
                      (x) => !_activeAI.includes(x)
                    );
                    let add = _activeAI.length + intersection.length;
                    if (deepStreamLimit < add) {
                      // //console.log("disable7: " + item.Service_id);
                      data_ele.disabledService.push(item.Service_id);
                      data_ele.disabledService = [
                        ...new Set(data_ele.disabledService),
                      ];
                    } else {
                      // //console.log("enable7: " + item.Service_id);
                      let uniqueD = [...new Set(data_ele.disabledService)];
                      var ucIndex = uniqueD.indexOf(item.Service_id);
                      // //console.log(ucIndex);
                      if (ucIndex >= 0) {
                        uniqueD.splice(ucIndex, 1);
                        data_ele.disabledService = [...uniqueD];
                      }
                    }
                  }
                }
              } else {
                data_ele.disabledService.push(item.Service_id);
                data_ele.disabledService = [
                  ...new Set(data_ele.disabledService),
                ];
              }
            });
          }
        }
      }
    });

    // this.parentLoop(_data, (data_ele) => {
    //   this.parentLoop(_service, (_service_ele) => {
    //     data_ele.disabledService.push(_service_ele.Service_id);
    //     data_ele.disabledService = [...new Set(data_ele.disabledService)];
    //   });
    // });
    //console.log(_data);
    this.setState({ data: _data });
  };

  onLoadDisableServices = () => {
    let _data = [...this.state.data];
    let _Service = [...this.state.Service];
    let _activeDS = [...this.state.staticDS];
    let _activeUsecases = [...this.state.staticUC];

    let addArr = [...this.state.staticUC];
    Array.prototype.push.apply(addArr, this.state.staticDependent);
    addArr = [...new Set(addArr)];
    //console.log(addArr);
    if (addArr.length >= usecaseLimit) {
      //console.log("USE CASE LIMIT REACHED: " + addArr.length);
      this.parentLoop(_Service, (item) => {
        //disable other usecase and DS
        if (!_activeUsecases.includes(item.Service_id)) {
          this.parentLoop(_data, (ele) => {
            ele.disabledService.push(item.Service_id);
          });
        }
      });
    } else {
      //console.log("USE CASE LIMIT NOT REACHED: " + addArr.length);
      if (deepStreamLimit === _activeDS.length) {
        //console.log("DS LIMIT REACHED V2");
        this.parentLoop(_Service, (item) => {
          if (item.Dependent_services.AI.length <= _activeDS.length) {
            let result = [];

            this.parentLoop(item.Dependent_services.AI, (ele) => {
              this.parentLoop(_activeDS, (ele2) => {
                if (ele2 === ele) result.push(true);
                else result.push(false);
              });
            });
            if (!result.includes(true)) {
              let intersection = item.Dependent_services.AI.filter(
                (x) => !_activeDS.includes(x)
              );
              let add = _activeDS.length + intersection.length;
              if (deepStreamLimit < add) {
                //console.log("disable: " + item.Service_id);
                this.toggleUsecase(item.Service_id, "push");
              } else {
                //console.log("enable: " + item.Service_id);
                this.toggleUsecase(item.Service_id, "put");
              }
            } else {
              let intersection = item.Dependent_services.AI.filter(
                (x) => !_activeDS.includes(x)
              );
              let add = _activeDS.length + intersection.length;
              if (deepStreamLimit < add) {
                //console.log("disable1: " + item.Service_id);
                this.toggleUsecase(item.Service_id, "push");
              } else {
                //console.log("enable1: " + item.Service_id);
                this.toggleUsecase(item.Service_id, "put");
              }
            }
          } else {
            this.toggleUsecase(item.Service_id, "push");
          }
        });
      } else {
        //console.log("DS LIMIT NOT REACHED V2");
        this.parentLoop(_Service, (item) => {
          if (item.Dependent_services.AI.length <= deepStreamLimit) {
            let result = [];

            this.parentLoop(item.Dependent_services.AI, (ele) => {
              this.parentLoop(_activeDS, (ele2) => {
                if (ele2 === ele) result.push(true);
                else result.push(false);
              });
            });
            // //console.log(item.Service_id);
            // //console.log(result);
            if (!result.includes(true)) {
              //console.log(item.Service_id);
              if (item.Category === "Analytics") {
                //console.log("CATEGORY IS ANALYTIC " + item.Service_id);
                let UCresult = [];
                this.parentLoop(item.Dependent_services.Usecase, (item_ele) => {
                  this.parentLoop(_activeUsecases, (UC_ele) => {
                    //console.log(UC_ele + "===" + item_ele);
                    if (UC_ele === item_ele) UCresult.push(true);
                    else UCresult.push(false);
                  });
                });
                //console.log(UCresult);
                if (!UCresult.includes(true)) {
                  let intersection = item.Dependent_services.AI.filter(
                    (x) => !_activeDS.includes(x)
                  );
                  //console.log(addArr, intersection);
                  let add = _activeUsecases.length + intersection.length;
                  // let add = addArr.length + intersection.length;
                  //console.log(deepStreamLimit + "<" + add);

                  if (deepStreamLimit < add) {
                    //console.log("disable: " + item.Service_id);
                    this.toggleUsecase(item.Service_id, "push");
                  } else {
                    //console.log("enable: " + item.Service_id);
                    this.toggleUsecase(item.Service_id, "put");
                  }
                } else {
                  let intersection = item.Dependent_services.AI.filter(
                    (x) => !_activeDS.includes(x)
                  );
                  let add = _activeDS.length + intersection.length;
                  if (deepStreamLimit < add) {
                    //console.log("disable: " + item.Service_id);
                    this.toggleUsecase(item.Service_id, "push");
                  } else {
                    //console.log("enable: " + item.Service_id);
                    this.toggleUsecase(item.Service_id, "put");
                  }
                }
              } else {
                let intersection = item.Dependent_services.AI.filter(
                  (x) => !_activeDS.includes(x)
                );
                let add = _activeDS.length + intersection.length;
                if (deepStreamLimit < add) {
                  //console.log("disable: " + item.Service_id);
                  this.toggleUsecase(item.Service_id, "push");
                } else {
                  //console.log("enable: " + item.Service_id);
                  this.toggleUsecase(item.Service_id, "put");
                }
              }
            } else {
              let intersection = item.Dependent_services.AI.filter(
                (x) => !_activeDS.includes(x)
              );
              let add = _activeDS.length + intersection.length;
              if (deepStreamLimit < add) {
                //console.log("disable1: " + item.Service_id);
                this.toggleUsecase(item.Service_id, "push");
              } else {
                //console.log("enable1: " + item.Service_id);
                this.toggleUsecase(item.Service_id, "put");
              }
            }
          } else {
            this.toggleUsecase(item.Service_id, "push");
          }
        });
      }
    }
    this.setState({
      data: _data,
    });
  };

  toggleCameraSlot = async () => {
    let _data = [...this.state.data];
    let _service = [...this.state.Service];
    let _selectedTimeSlot = [...this.state.selectedTimeSlot];

    if (this.state.isCamerPresent) {
      if (isAllTimeSelected) {
        isAllUCSelected = [];
        _selectedTimeSlot = [];
        for (let i = 0; i < this.state.time.length; i++) {
          await this.setState({ selectedTimeSlot: _selectedTimeSlot });
          if (!this.state.DisabledTS.includes(this.state.time[i])) {
            this.timeslotMouseDown(this.state.time[i]);
            _selectedTimeSlot.push(this.state.time[i]);
          }
        }
      } else {
        isAllUCSelected = [];
        for (let servEle of _service) {
          isAllUCSelected.push(false);
          disabledServices.push(servEle.Service_id);
        }

        this.parentLoop(_data, (data_ele) => {
          this.parentLoop(_service, (_service_ele) => {
            data_ele.disabledService.push(_service_ele.Service_id);
            data_ele.disabledService = [...new Set(data_ele.disabledService)];
          });
          data_ele.AI.length = 0;
          data_ele.Dependent.length = 0;
          data_ele.Usecases.length = 0;
        });

        this.setState({ selectedTimeSlot: [], data: _data });
      }
    } else {
      if (!isAllTimeSelected) {
        isAllUCSelected = [];
        for (let servEle of _service) {
          isAllUCSelected.push(false);
          disabledServices.push(servEle.Service_id);
        }

        this.parentLoop(_data, (data_ele) => {
          this.parentLoop(_service, (_service_ele) => {
            data_ele.disabledService.push(_service_ele.Service_id);
            data_ele.disabledService = [...new Set(data_ele.disabledService)];
          });
          data_ele.AI.length = 0;
          data_ele.Dependent.length = 0;
          data_ele.Usecases.length = 0;
        });

        this.setState({ selectedTimeSlot: [], data: _data });
      } else {
        isAllUCSelected = [];

        for (let servEle of _service) {
          isAllUCSelected.push(false);
        }
        disabledServices = [];
        for (let timeEle of this.state.time) {
          _selectedTimeSlot.push(timeEle);
          _selectedTimeSlot = [...new Set(_selectedTimeSlot)];
          this.parentLoop(_data, (ele) => {
            if (ele.slot === timeEle) {
              ele.disabledService.length = 0;
            }
          });

          this.parentLoop(_service, (serv_item) => {
            if (serv_item.Dependent_services.AI.length <= deepStreamLimit) {
              if (serv_item.Category === "Analytics") {
              }
            } else {
              disabledServices.push(serv_item.Service_id);
              disabledServices = [...new Set(disabledServices)];

              this.parentLoop(_data, (data_ele) => {
                if (data_ele.slot === timeEle) {
                  data_ele.disabledService.push(serv_item.Service_id);
                  data_ele.disabledService = [
                    ...new Set(data_ele.disabledService),
                  ];
                }
              });
            }
          });
        }
        this.setState({
          selectedTimeSlot: _selectedTimeSlot,
          mouseState: false,
          data: _data,
        });
      }
    }
  };

  toggleUCSlot = (service_item, service_index) => {
    let _data = [...this.state.data];
    let _selectedTimeSlot = [...this.state.selectedTimeSlot];
    for (let i = 0; i < _data.length; i++) {
      for (let j = 0; j < _selectedTimeSlot.length; j++) {
        if (_selectedTimeSlot[j] === _data[i].slot) {
          if (this.state.isCamerPresent) {
            if (this.state.DisabledTS.length > 0) {
              if (this.state.DisabledTS.includes(_selectedTimeSlot[j])) {
                _data[i].disabledService.push(service_item.Service_name);
              } else {
                this.usecaseMouseDown2(
                  _data[i],
                  service_index,
                  service_item,
                  i
                );
              }
            } else {
              if (isAllUCSelected[service_index]) {
                if (_data[i].Usecases.includes(service_item.Service_id)) {
                  if (
                    service_item.Dependent_services.AI.length <= deepStreamLimit
                  ) {
                    this.setState({ data: _data }, () =>
                      this.usecaseMouseDown2(
                        _data[i],
                        service_index,
                        service_item,
                        i,
                        true
                      )
                    );
                  }
                } else {
                  if (
                    !_data[i].disabledService.includes(service_item.Service_id)
                  ) {
                    let indexx = _data[i].disabledService.indexOf(
                      service_item.Service_id
                    );
                    if (indexx >= 0) {
                      _data[i].disabledService.splice(indexx, 1);
                    }
                    this.setState({ data: _data }, () =>
                      this.usecaseMouseDown2(
                        _data[i],
                        service_index,
                        service_item,
                        i,
                        false
                      )
                    );
                  }
                }
              } else {
                if (
                  !_data[i].disabledService.includes(service_item.Service_id)
                ) {
                  this.setState({ data: _data }, () =>
                    this.usecaseMouseDown2(
                      _data[i],
                      service_index,
                      service_item,
                      i,
                      false
                    )
                  );
                } else {
                }
              }

              // this.usecaseMouseDown2(_data[i], service_index, service_item, i);
            }
          } else {
            if (isAllUCSelected[service_index]) {
              if (_data[i].Usecases.includes(service_item.Service_id)) {
                // if (
                //   service_item.Dependent_services.AI.length <= deepStreamLimit
                // ) { // extra added for testing[31/1]
                this.setState({ data: _data }, () =>
                  this.usecaseMouseDown(
                    _data[i],
                    service_index,
                    service_item,
                    i,
                    true
                  )
                );
                // }
              } else {
                if (
                  !_data[i].disabledService.includes(service_item.Service_id)
                ) {
                  let indexx = _data[i].disabledService.indexOf(
                    service_item.Service_id
                  );
                  if (indexx >= 0) {
                    _data[i].disabledService.splice(indexx, 1);
                  }

                  this.setState({ data: [..._data] }, () =>
                    this.usecaseMouseDown(
                      _data[i],
                      service_index,
                      service_item,
                      i,
                      false
                    )
                  );
                }
              }
            } else {
              if (!_data[i].disabledService.includes(service_item.Service_id)) {
                this.setState({ data: _data }, () =>
                  this.usecaseMouseDown(
                    _data[i],
                    service_index,
                    service_item,
                    i,
                    false
                  )
                );
              }
            }
          }
        }
      }
    }
  };

  renderIsAllSelected = () => {
    let _data = [...this.state.data];
    let _service = [...this.state.Service];
    let _selectedTimeSlot = [...this.state.selectedTimeSlot];
    let _DisabledTS = [...this.state.DisabledTS];
    let _add = [];
    Array.prototype.push.apply(_add, _DisabledTS);
    Array.prototype.push.apply(_add, _selectedTimeSlot);
    if (_add.length === 12) {
      isAllTimeSelected = true;
    } else {
      isAllTimeSelected = false;
    }
    let _i = 0;
    for (let servEle of _service) {
      let count = 0;
      let count2 = 0;
      for (let dataEle of _data) {
        if (dataEle.disabledService.includes(servEle.Service_id)) {
          count += 1;
        }
        if (dataEle.Usecases.includes(servEle.Service_id)) {
          count2 += 1;
        }
      }
      if (count2 === 12) {
        isAllUCSelected[_i] = true;
      } else isAllUCSelected[_i] = false;
      if (count === 12) {
        disabledServices.push(servEle.Service_id);
        disabledServices = [...new Set(disabledServices)];
      } else {
        if (count === 0) {
          let indexx = disabledServices.indexOf(servEle.Service_id);
          if (indexx >= 0) {
            disabledServices.splice(indexx, 1);
          }
        } else {
          let _count = 0;
          for (let i = 0; i < _data.length; i++) {
            if (_data[i].disabledService.includes(servEle.Service_id)) {
              _count += 1;
            }
            if (_data[i].Usecases.includes(servEle.Service_id)) {
              _count += 1;
            }
          }
          if (_count === 12) {
            isAllUCSelected[_i] = true;
          } else {
            let indexx = disabledServices.indexOf(servEle.Service_id);
            if (indexx >= 0) {
              disabledServices.splice(indexx, 1);
            }
            isAllUCSelected[_i] = false;
          }
        }
      }
      _i++;
    }

    this.setState({ dummy: "" });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.data !== this.state.data) {
      this.renderIsAllSelected();
    }
    if (prevState.ActiveTab !== this.state.ActiveTab) {
      if (this.state.ActiveTab === "Scheduler") {
        var ele1 = document.querySelector("#App_Scheduler");
        var ele2 = document.querySelector("#App_Configuration");
        ele2.classList.remove("active_stage");
        ele1.classList.add("active_stage");
      } else {
        var ele1 = document.querySelector("#App_Scheduler");
        var ele2 = document.querySelector("#App_Configuration");
        ele1.classList.remove("active_stage");
        ele2.classList.add("active_stage");
      }
    }
    let sStorage = sessionStorage.getItem("timer");
    // if(sStorage){
    //   this.setState({ counter: sStorage });
    // }
    if (prevState.counter !== this.state.counter) {
      counterTimeout = setTimeout(() => {
        this.setState({ counter: this.state.counter - 1 }, () => {
          let ele = document.getElementById("s_timer");
          if (this.state.counter < 60) {
            ele.style.animation = "blink 1s linear infinite";
          }
          if (this.state.counter <= 0) {
            clearTimeout(counterTimeout);
            sessionStorage.removeItem("timer");
            this.props.history.push("/camera");
            return;
          }
        });
        // setCounter(counter - 1);
        sessionStorage.setItem("timer", this.state.counter - 1);
      }, 1000);
    }

    if (prevState.isLoading != this.state.isLoading) {
      this.props.handleLoading(this.state.isLoading);
    }
    if (prevState.ActiveTab != this.state.ActiveTab) {
      this.props.ActiveTab(this.state.ActiveTab);
    }
  }

  componentDidMount() {
    this.setState({ counter: pageTime });
    const authResult = new URLSearchParams(window.location.search);
    camID = authResult.get("cameraID");
    if (!camID) {
      this.props.history.push("/home");
    } else {
      this.getCameraLimit();
    }
    this.props.handleSubmit(this.postCameraSlot);
    // this.onLoad();
  }
  componentWillUnmount() {
    isAllTimeSelected = false;
    clearTimeout(counterTimeout);
    sessionStorage.removeItem("timer");
  }

  getCameraLimit = async () => {
    this.setState({ isLoading: true });
    axiosApiInstance
      .get("/base/device?limits=True")
      .then((res) => {
        this.getServices();

        usecaseLimit = res.data.Limitations.Usecase;
        deepStreamLimit = res.data.Limitations.Deepstream;
        cameraLimit = res.data.Limitations.Camera;
      })
      .catch((err) => {
        this.setState({
          isLoading: false,
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong in fetching Camera Data!",
            type: "alert",
            header: "",
          },
        });
        this.resetModal();
      });
  };

  getServices = async () => {
    axiosApiInstance
      .get("/service/?type=Usecase&packagedData=true&all=true")
      .then((res) => {
        this.getCameraSlots();
        this.setState({ Service: res.data.detail });
      })
      .catch((err) => {
        this.setState({
          isLoading: false,
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
      .get("/camera/get_all_slots")
      .then((res) => {
        this.setState({ apiData: res.data }, () => {
          this.onLoad();
        });
      })
      .catch((err) => {
        this.setState({
          isLoading: false,
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong in fetching Camera Slots!",
            type: "alert",
            header: "",
          },
        });
        this.resetModal();
      });
  };

  submitCameraSlots = async (toConfig, service_item) => {
    this.setState({ isLoading: true });
    let finalObj = {};
    let UCArray = [];
    this.state.data.map((items, index) => {
      if (items.Usecases.length > 0) {
        items.Usecases.map((uc, ucind) => {
          UCArray.push(uc);
        });

        let aiSet = [...new Set(items.AI)];
        let ucSet = [...new Set(items.Usecases)];
        let dpSet = [...new Set(items.Dependent)];
        finalObj[items.slot] = {
          Usecases: ucSet,
          Dependent: dpSet,
          AI: aiSet,
        };
      } else {
        finalObj[items.slot] = {};
      }
    });

    let body = {
      CameraID: camID,
      Timeslots: finalObj,
    };
    this.setState({ isLoadingScreen: true });
    axiosApiInstance
      .post("camera/send_camera_slots", body)
      .then((res) => {
        if (res.status == 200) {
          if (toConfig) {
            this.setState(
              {
                ActiveTab: "Configuration",
                selectedService: service_item,
                isLoadingScreen: false,
                isLoading: false,
              },
              () => {
                var url = new URL(window.location.href);
                url.searchParams.append("service", service_item);
                window.history.pushState(null, null, url);
              }
            );
          } else {
            axiosApiInstance
              .get("camera/finish_configure", body)
              .then((res) => {
                if (res.status == 200) {
                  this.setState({
                    isLoadingScreen: false,
                    showErrorModal: {
                      ...this.state.showErrorModal,
                      showPop: true,
                      msg: "Schedule added successfully!",
                      type: "success",
                      header: "Success",
                    },
                  });
                  timeout = setTimeout(() => {
                    this.props.history.push("/camera");
                  }, 3000);
                }
              })
              .catch((err) => {
                this.setState({
                  isLoadingScreen: false,
                  isLoading: false,
                  showErrorModal: {
                    ...this.state.showErrorModal,
                    showPop: true,
                    msg: "Something Went Wrong!",
                    type: "alert",
                    header: "",
                  },
                });
                this.resetModal();
              });
          }
        } else {
          alert("Failed to save");
        }
      })
      .catch((err) => {
        this.setState({
          isLoadingScreen: false,
          isLoading: false,
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong!",
            type: "alert",
            header: "",
          },
        });
        this.resetModal();
      });
  };

  toggleSetting = (param) => {
    let __data = this.state.data;
    let res = false;
    for (let i = 0; i < __data.length; i++) {
      if (__data[i].Usecases.includes(param)) {
        res = true;
      }
    }
    return res;
  };

  postCameraSlot = async () => {
    this.setState({ isLoading: true });
    let finalObj = {};
    let UCArray = [];
    this.state.data.map((items, index) => {
      if (items.Usecases.length > 0) {
        items.Usecases.map((uc, ucind) => {
          UCArray.push(uc);
        });

        let aiSet = [...new Set(items.AI)];
        let ucSet = [...new Set(items.Usecases)];
        let dpSet = [...new Set(items.Dependent)];
        finalObj[items.slot] = {
          Usecases: ucSet,
          Dependent: dpSet,
          AI: aiSet,
        };
      } else {
        finalObj[items.slot] = {};
      }
    });
    const authResult = new URLSearchParams(window.location.search);
    camID = authResult.get("cameraID");
    let body = {
      CameraID: camID,
      Timeslots: finalObj,
    };
    this.setState({ isLoadingScreen: true });

    axiosApiInstance
      .post("camera/send_camera_slots", body)
      .then((res) => {
        // fetch for loop
        if (this.state.configData.length > 0) {
          this.postConfigData();
        } else {
          this.setState({
            isLoadingScreen: false,
            showErrorModal: {
              ...this.state.showErrorModal,
              showPop: true,
              msg: "Schedule added successfully!",
              type: "success",
              header: "Success",
            },
          });
          this.postFinishConfig();
        }
      })
      .catch((err) => {
        uploadCount = 1;
        this.setState({
          isLoading: false,
          isLoadingScreen: false,
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong!",
            type: "alert",
            header: "",
          },
        });
        this.resetModal();
      });
  };

  postConfigData = async () => {
    let _configData = [...this.state.configData];
    if (!_configData[0].CameraID) {
      const authResult = new URLSearchParams(window.location.search);
      const cType = authResult.get("cameraID");
      for (let i = 0; i < _configData.length; i++) {
        _configData[i].CameraID = cType;
      }
    }
    let obj = {
      // CameraID: this.state.configData[0].CameraID,
      Services: [..._configData],
    };

    await axiosApiInstance
      .post("camera/modules/usecase/settings", obj)
      .then((res) => {
        this.postFinishConfig();
      })
      .catch((err) => {
        this.setState({
          isLoading: false,
          isLoadingScreen: false,
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong!",
            type: "alert",
            header: "",
          },
        });
        this.resetModal();
      });

    // for (let i = 0; i < this.state.configData.length; i++) {
    //   await axiosApiInstance
    //     .post("camera/modules/usecase/settings", this.state.configData[i])
    //     .then((res) => {
    //       uploadCount = i + 1;
    //       console.log(uploadCount);
    //       if (uploadCount === this.state.configData.length) {
    //         this.postFinishConfig();

    //       }
    //     })
    //     .catch((err) => {
    //       console.log(err.response);
    //       this.setState({
    //         isLoading: false,
    //         isLoadingScreen: false,
    //         showErrorModal: {
    //           ...this.state.showErrorModal,
    //           showPop: true,
    //           msg: "Something Went Wrong!",
    //           type: "alert",
    //           header: "",
    //         },
    //       });
    //       this.resetModal();
    //     });
    // }
  };

  postFinishConfig = () => {
    axiosApiInstance
      .get("camera/finish_configure")
      .then((res) => {
        if (res.status == 200) {
          this.setState({
            isLoadingScreen: false,
            showErrorModal: {
              ...this.state.showErrorModal,
              showPop: true,
              msg: "Schedule added successfully!",
              type: "success",
              header: "Success",
            },
          });
          setTimeout(() => {
            clearTimeout(counterTimeout);
            sessionStorage.removeItem("timer");
            this.props.history.push("/camera");
          }, 3000);
        }
      })
      .catch((err) => {
        this.setState({
          isLoading: false,
          isLoadingScreen: false,
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong!",
            type: "alert",
            header: "",
          },
        });
        this.resetModal();
      });
  };

  render() {
    const search = (what) =>
      this.state.configData.find((element) => element.ServiceID === what);
    if (this.state.ActiveTab === "Configuration") {
      return (
        <AppConfiguration
          handleBack={() => {
            this.setState({ ActiveTab: "Scheduler", counter: pageTime });
          }}
          service={this.state.selectedService}
          handleConfigData={(data) => {
            let _data = [...this.state.configData];
            if (_data.length > 0) {
              let _res = search(data.ServiceID);
              if (_res) {
                let index = _data.findIndex(
                  (i) => i.ServiceID === _res.ServiceID
                );
                if (index >= 0) {
                  _data.splice(index, 1);
                  _data.push(data);
                }
              } else {
                _data.push(data);
              }
            } else {
              _data.push(data);
            }
            this.setState({ configData: [..._data] });
          }}
          handleConfigBack={(res) => {
            console.log(res);
            this.props.handleConfigBack(res);
          }}
          handleConfigLoading={(res) => {
            this.props.handleLoading(res);
          }}
          handleConfigSubmit={(res) => {
            this.props.handleConfigSubmit(res);
          }}
        />
      );
    }
    return (
      <motion.div
        variants={xMotion}
        exit="exit"
        initial="hidden"
        animate="visible"
        className="_app_configuration_"
      >
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

        {/* <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et
        </p> */}
        <BoxCard
          id="add_scheduler_card_"
          isLoading={this.state.isLoading}
          className="card_size"
        >
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
              <p className="select_text">Select All</p>
              <p className="drag_text">Drag & Select Time Range</p>
              <p className="configure_text">Configure</p>
            </div>

            <div className="timeline-header header_adjust">
              <p className="h">Activate Camera Time</p>
              <div
                className={
                  isAllTimeSelected ? "select_all all_selected" : "select_all"
                }
                style={{
                  backgroundColor: _.isEqual(
                    this.state.DisabledTS,
                    this.state.time
                  )
                    ? "gray"
                    : null,
                }}
                onMouseEnter={() => {
                  this.setState({ mouseState: false });
                }}
                onMouseLeave={() => {
                  this.setState({ mouseState: false });
                }}
                onClick={() => {
                  if (!_.isEqual(this.state.DisabledTS, this.state.time)) {
                    isAllTimeSelected = !isAllTimeSelected;
                    this.toggleCameraSlot();
                  }
                }}
              />
              <div
                className="timeline"
                onMouseLeave={() => this.setState({ mouseState: false })}
              >
                {this.state.data.map((item) => (
                  <div
                    key={item.slot + "1020"}
                    className={
                      this.state.selectedTimeSlot.includes(item.slot)
                        ? "child activeslot"
                        : "child"
                    }
                    style={{
                      backgroundColor: this.state.DisabledTS.includes(item.slot)
                        ? "gray"
                        : "",
                      cursor: this.state.DisabledTS.includes(item.slot)
                        ? "not-allowed"
                        : "default",
                    }}
                    onMouseDown={() => {
                      if (!this.state.DisabledTS.includes(item.slot)) {
                        this.timeslotMouseDown(item.slot);
                      }
                    }}
                    onMouseEnter={() => {
                      if (this.state.mouseState) {
                        if (!this.state.DisabledTS.includes(item.slot)) {
                          this.timeslotMouseDown(item.slot);
                        }
                      }
                    }}
                    onMouseUp={() => this.setState({ mouseState: false })}
                  >
                    <div className="circle" />
                  </div>
                ))}
                <div className="circle2 c_adjust" />
              </div>
            </div>
            <div className="data-container">
              <h1>Apps</h1>
              <Scrollbars autoHeight autoHeightMax="49vh">
                <div className="app_fixed">
                  {this.state.Service.map((service_item, service_index) => (
                    <div className="flex" key={service_item.Service_id}>
                      <h4 className="name">
                        {service_item.Service_name.replaceAll("_", " ")}
                      </h4>
                      <div
                        className={
                          isAllUCSelected[service_index]
                            ? "select_all all_selected"
                            : "select_all"
                        }
                        onMouseEnter={() => {
                          this.setState({ mouseState: false });
                        }}
                        onMouseLeave={() => {
                          this.setState({ mouseState: false });
                        }}
                        style={{
                          backgroundColor: disabledServices.includes(
                            service_item.Service_id
                          )
                            ? "gray"
                            : null,
                          cursor: disabledServices.includes(
                            service_item.Service_id
                          )
                            ? "not-allowed"
                            : "pointer",
                        }}
                        onClick={() => {
                          if (this.state.selectedTimeSlot.length !== 0) {
                            if (
                              !disabledServices.includes(
                                service_item.Service_id
                              )
                            ) {
                              isAllUCSelected[service_index] =
                                !isAllUCSelected[service_index];
                              this.toggleUCSlot(service_item, service_index);
                            }
                          }
                        }}
                      />
                      <div
                        className="dummy"
                        onMouseLeave={() =>
                          this.setState({ mouseState: false })
                        }
                        onMouseEnter={() =>
                          this.setState({ mouseState: false })
                        }
                      >
                        {this.state.data.map((item, index) => (
                          <div
                            key={item.slot + "2"}
                            className={
                              item.Usecases.includes(service_item.Service_id)
                                ? "child activeslot"
                                : "child"
                            }
                            style={{
                              backgroundColor: item.disabledService.includes(
                                service_item.Service_id
                              )
                                ? "gray"
                                : this.state.DisabledTS.includes(item.slot)
                                ? "gray"
                                : "",
                            }}
                            onMouseDown={() => {
                              if (
                                !item.disabledService.includes(
                                  service_item.Service_id
                                )
                              ) {
                                if (this.state.isCamerPresent) {
                                  if (
                                    !this.state.DisabledTS.includes(item.slot)
                                  ) {
                                    this.usecaseMouseDown2(
                                      item,
                                      service_index,
                                      service_item,
                                      index
                                    );
                                  }
                                } else {
                                  this.usecaseMouseDown(
                                    item,
                                    service_index,
                                    service_item,
                                    index
                                  );
                                }
                              }
                            }}
                            onMouseEnter={() => {
                              if (this.state.mouseState) {
                                if (
                                  !item.disabledService.includes(
                                    service_item.Service_id
                                  )
                                ) {
                                  if (this.state.isCamerPresent) {
                                    this.usecaseMouseDown2(
                                      item,
                                      service_index,
                                      service_item,
                                      index
                                    );
                                  } else {
                                    this.usecaseMouseDown(
                                      item,
                                      service_index,
                                      service_item,
                                      index
                                    );
                                  }
                                }
                              }
                            }}
                            onMouseUp={() =>
                              this.setState({ mouseState: false })
                            }
                          >
                            <div className="circle" />
                          </div>
                        ))}
                        <div className="circle2" />
                      </div>
                      <i
                        style={{
                          display: this.toggleSetting(service_item.Service_name)
                            ? "block"
                            : "none",
                        }}
                        onClick={() => {
                          if (this.toggleSetting(service_item.Service_name)) {
                            // this.props.handleHistory("App Configuration");
                            this.setState({ ActiveTab: "Configuration" });
                            clearTimeout(counterTimeout);
                            sessionStorage.removeItem("timer");
                            var url = new URL(window.location.href);
                            url.searchParams.append(
                              "service",
                              service_item.Service_name
                            );
                            window.history.pushState(null, null, url);
                          }
                        }}
                        // onClick={() =>
                        //   this.submitCameraSlots(true, service_item.Service_name)
                        // }
                        // onClick={() => {
                        //   if (this.toggleSetting(service_item.Service_name)) {
                        //     // this.props.handleHistory("App Configuration");
                        //     this.submitCameraSlots(true, service_item.Service_name);
                        //   }
                        // }}
                        // onClick={() => {
                        //   this.props.handleHistory("App Configuration");
                        //   var url = new URL(window.location.href);
                        //   url.searchParams.append(
                        //     "service",
                        //     service_item.Service_name
                        //   );
                        //   window.history.pushState(null, null, url);
                        // }}
                        className="material-icons setting_icon"
                      >
                        settings
                      </i>
                    </div>
                  ))}
                </div>
              </Scrollbars>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: "-16%",
              transform: "translateX(-50%)",
              bottom: "0vw",
            }}
          >
            {/* <Button
              style={{ width: "6vw" }}
              onClick={this.postCameraSlot}
              type="gradient"
              name="Submit"
              // disabled={this.state.isLoading}
            /> */}
          </div>
        </BoxCard>
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
              if (this.state.showErrorModal.type === "success") {
                this.props.history.push("/camera");
                clearTimeout(timeout);
              }
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
        {this.state.isLoadingScreen && (
          <Loading type={"transparent"} text={"Loading"} />
        )}
      </motion.div>
    );
  }
}

export default withRouter(AppScheduler);
