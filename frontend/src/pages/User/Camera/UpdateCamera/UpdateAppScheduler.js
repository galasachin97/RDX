import React, { Children, Component } from "react";
import limits from "./limits.json";
import servicess from "./services.json";
import { motion } from "framer-motion";
import "./updateappconfig.scss";
import { xMotion } from "../../../../helper/motions";
import { BoxCard } from "../../../../components/card/Card";
import { withRouter } from "react-router-dom";
import { axiosApiInstance } from "../../../../helper/request";
import Modal from "../../../../components/Modal/Modal";
import AppConfiguration from "../AppConfiguration/AppConfiguration";
import Scrollbars from "react-custom-scrollbars";
import { encryptStorage } from "../../../../helper/storage";
var _ = require("lodash");
const Services = servicess["Services"];
let Limits = limits["details"]["Limitations"];
let deepStreamLimit = Limits["Deepstream"];
let usecaseLimit = Limits["Usecase"];
let cameraLimit = Limits["Camera"];
let isAllTimeSelected = false;
let isAllUCSelected = [];
let disabledServices = [];
let timeout = null;
let _enabledTS = [];
let pageTime = 300;
let counterTimeout = null;

class UpdateAppScheduler extends Component {
  state = {
    counter: 0,

    DisabledTS: [],
    ActiveTab: "Scheduler",
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
        isCameraPresent: false,
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
        isCameraPresent: false,
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
        isCameraPresent: false,
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
        isCameraPresent: false,
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
        isCameraPresent: false,
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
        isCameraPresent: false,
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
        isCameraPresent: false,
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
        isCameraPresent: false,
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
        isCameraPresent: false,
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
        isCameraPresent: false,
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
        isCameraPresent: false,
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
        isCameraPresent: false,
      },
    ],
    apiData: {
      "0-2": {
        global: {
          Cameras: ["1", "2"],
          Usecases: [
            "Weapon_Detection",
            "Early_Camera_Tampering",
            "DUMMY_Tampering",
            "No_Mask_Detection",
          ],
          Dependent: [],
          AI: ["Weapon_Detection_AI"],
        },
        local: {
          1: {
            Usecases: [
              "Weapon_Detection",
              "Early_Camera_Tampering",
              "DUMMY_Tampering",
              "No_Mask_Detection",
            ],
            Dependent: [],
            AI: ["Weapon_Detection_AI"],
          },
          2: {
            Usecases: [
              "No_Mask_Detection",
              "Early_Camera_Tampering",
              "DUMMY_Tampering",
            ],
            Dependent: [],
            AI: ["Weapon_Detection_AI"],
          },
          3: {
            Usecases: [
              "No_Mask_Detection",
              "Early_Camera_Tampering",
              "DUMMY_Tampering",
            ],
            Dependent: [],
            AI: ["Weapon_Detection_AI"],
          },
        },
      },
      "2-4": {
        global: {
          Cameras: ["1", "2"],
          // Cameras: ["1"],
          Usecases: ["Weapon_Detection", "No_Mask_Detection"],
          Dependent: [],
          AI: ["Weapon_Detection_AI"],
        },
        local: {
          1: {
            Usecases: ["No_Mask_Detection"],
            Dependent: [],
            AI: ["Weapon_Detection_AI"],
          },
          2: {
            Usecases: ["Weapon_Detection"],
            Dependent: [],
            AI: ["Weapon_Detection_AI"],
          },
        },
      },
      "4-6": {
        global: {
          Cameras: ["1", "2"],
          Usecases: ["Weapon_Detection"],
          Dependent: [],
          AI: ["Weapon_Detection_AI"],
        },
        local: {
          1: {
            Usecases: ["Weapon_Detection"],
            Dependent: [],
            AI: ["Weapon_Detection_AI"],
          },
          2: {
            Usecases: ["Weapon_Detection"],
            Dependent: [],
            AI: ["Weapon_Detection_AI"],
          },
        },
      },
      "6-8": {
        global: {
          Cameras: ["1", "2"],
          Usecases: ["Weapon_Detection"],
          Dependent: [],
          AI: ["Weapon_Detection_AI"],
        },
        local: {
          1: {
            Usecases: ["Weapon_Detection"],
            Dependent: [],
            AI: ["Weapon_Detection_AI"],
          },
          2: {
            Usecases: ["Weapon_Detection"],
            Dependent: [],
            AI: ["Weapon_Detection_AI"],
          },
        },
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
          Cameras: ["1"],
          Usecases: ["Loitering_Idling"],
          Dependent: [],
          AI: ["Person_Detection_AI"],
        },
        local: {
          1: {
            Usecases: ["Loitering_Idling"],
            Dependent: [],
            AI: ["Person_Detection_AI"],
          },
        },
      },
      "12-14": {
        global: {
          Cameras: ["1"],
          Usecases: ["Loitering_Idling"],
          Dependent: [],
          AI: ["Person_Detection_AI"],
        },
        local: {
          1: {
            Usecases: ["Loitering_Idling"],
            Dependent: [],
            AI: ["Person_Detection_AI"],
          },
        },
      },
      "14-16": {
        global: {
          Cameras: ["1"],
          Usecases: ["Loitering_Idling"],
          Dependent: [],
          AI: ["Person_Detection_AI"],
        },
        local: {
          1: {
            Usecases: ["Loitering_Idling"],
            Dependent: [],
            AI: ["Person_Detection_AI"],
          },
        },
      },
      "16-18": {
        global: {
          Cameras: ["1"],
          Usecases: ["Loitering_Idling"],
          Dependent: [],
          AI: ["Person_Detection_AI"],
        },
        local: {
          1: {
            Usecases: ["Loitering_Idling"],
            Dependent: [],
            AI: ["Person_Detection_AI"],
          },
        },
      },
      "18-20": {
        global: {
          Cameras: ["1"],
          Usecases: ["Loitering_Idling"],
          Dependent: [],
          AI: ["Person_Detection_AI"],
        },
        local: {
          1: {
            Usecases: ["Loitering_Idling"],
            Dependent: [],
            AI: ["Person_Detection_AI"],
          },
        },
      },
      "20-22": {
        global: {
          Cameras: ["1"],
          Usecases: ["Loitering_Idling"],
          Dependent: [],
          AI: ["Person_Detection_AI"],
        },
        local: {
          1: {
            Usecases: ["Loitering_Idling"],
            Dependent: [],
            AI: ["Person_Detection_AI"],
          },
        },
      },
      "22-24": {
        global: {
          Cameras: ["1"],
          Usecases: ["Loitering_Idling"],
          Dependent: [],
          AI: ["Person_Detection_AI"],
        },
        local: {
          1: {
            Usecases: ["Loitering_Idling"],
            Dependent: [],
            AI: ["Person_Detection_AI"],
          },
        },
      },
    },
    mouseState: false,
    isCamerPresent: false,
    // Service: Services,
    Service: [],
    selectedTimeSlot: [],
    staticTimeSlot: [],
    enabledTS: [],
    isSuccess: false,
    isLoading: true,
    showErrorModal: {
      showPop: false,
      msg: "",
      type: "alert",
      header: "",
    },
    configData: [],
  };

  parentLoop = (arr, callback) => {
    for (let element of arr) {
      callback(element);
    }
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

  timeslotMouseDown = (i) => {
    // //console.log("timeslotMouseDown()");
    let _selectedTimeSlot = [...this.state.selectedTimeSlot];
    _selectedTimeSlot = [...new Set(_selectedTimeSlot)];
    let _data = [...this.state.data];
    let _service = [...this.state.Service];

    if (_selectedTimeSlot.includes(i)) {
      //console.log("INCLUDES");
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
    } else {
      _selectedTimeSlot.push(i);
      this.parentLoop(_data, (ele) => {
        if (ele.slot === i) {
          if (this.state.staticTimeSlot.includes(i)) {
            // //console.log("AVAILABLE IN TS");
            ele.AI = [...ele.staticAI];
            ele.Usecases = [...ele.staticUC];
            ele.Dependent = [...ele.staticDependent];
            ele.disabledService = [...new Set(ele.disabledService)];
            let addUCnD = [];
            Array.prototype.push.apply(addUCnD, ele.Usecases);
            Array.prototype.push.apply(addUCnD, ele.Dependent);
            addUCnD = [...new Set(addUCnD)];
            let intersection = ele.disabledService.filter(
              (x) => !addUCnD.includes(x)
            );
            // //console.log(intersection);
            ele.disabledService = [...intersection];
            var indexOf = _data.findIndex((i) => i.slot === ele.slot);
            this.verifyLimits(ele, "", "", indexOf);
          } else {
            // //console.log("ELSE IF..........");
            ele.disabledService.length = 0;
            var indexOf = _data.findIndex((i) => i.slot === ele.slot);
            this.verifyLimits(ele, "", "", indexOf);
          }
        }
      });
    }

    this.setState({
      selectedTimeSlot: [..._selectedTimeSlot],
      data: [..._data],
      mouseState: true,
    });
  };
  toggleAnalytics = (element, data_index) => {
    // //console.log("toggleAnalytics()");
    // //console.log(element, data_index);
    let _data = [...this.state.data];
    let _usecases = [..._data[data_index].Usecases];
    let _Dependent = [..._data[data_index].Dependent];
    let uniqueUC = [..._usecases];
    Array.prototype.push.apply(uniqueUC, _Dependent);
    uniqueUC = [...new Set(uniqueUC)];
    let uniqueAI = [..._data[data_index].staticAI];
    Array.prototype.push.apply(uniqueAI, _data[data_index].AI);
    uniqueAI = [...new Set(uniqueAI)];

    let intersection = element.Dependent_services.AI.filter(
      (x) => !uniqueAI.includes(x)
    );
    // //console.log(intersection);
    let add = uniqueAI.length + intersection.length;
    // //console.log();
    if (deepStreamLimit < add) {
      _data[data_index].disabledService.push(element.Service_id);
      _data[data_index].disabledService = [
        ...new Set(_data[data_index].disabledService),
      ];
    } else {
      // //console.log("below DS range");
      let UCnDependent = [...element.Dependent_services.Usecase];
      UCnDependent.push(element.Service_id);
      // //console.log(UCnDependent);
      let UCadd = [...uniqueUC];
      Array.prototype.push.apply(UCadd, UCnDependent);
      Array.prototype.push.apply(UCadd, _data[data_index].staticUC);
      UCadd = [...new Set(UCadd)];
      // //console.log(UCadd);
      // //console.log(usecaseLimit + "<" + UCadd.length);
      if (usecaseLimit < UCadd.length) {
        _data[data_index].disabledService.push(element.Service_id);
        _data[data_index].disabledService = [
          ...new Set(_data[data_index].disabledService),
        ];
      } else {
        // //console.log("false");
        var ucIndex = _data[data_index].disabledService.indexOf(
          element.Service_id
        );
        // //console.log(ucIndex);
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

  isUsecasePresentInCamera = (data_item, service_item) => {
    let idee = this.props.match.params.id;
    let filterData = this.state.apiData[data_item.slot].global.Cameras.filter(
      (cam) => cam !== idee
    );
    let res = false;
    this.parentLoop(filterData, (filEle) => {
      res = this.state.apiData[data_item.slot].local[filEle].Usecases.includes(
        service_item.Service_name
      );
    });
    //console.log(res);

    //if res=true do nothing

    let _uc = [...data_item.Usecases];
    if (!res) {
      Array.prototype.push.apply(_uc, [...data_item.staticUC]);
      Array.prototype.push.apply(_uc, [...data_item.staticDependent]);
    }
    _uc = [...new Set(_uc)];
    //console.log(_uc);

    //console.log(res);
    //console.log(this.state.apiData);
    return res;
    // return true;
  };

  getRemainingUC = (data_item, service_item) => {
    let idee = this.props.match.params.id;
    let filterData = this.state.apiData[data_item.slot].global.Cameras.filter(
      (cam) => cam !== idee
    );
    //console.log(filterData);
    let _uc = [];
    this.parentLoop(filterData, (filEle) => {
      Array.prototype.push.apply(_uc, [
        ...this.state.apiData[data_item.slot].local[filEle].Usecases,
      ]);
    });
    _uc = [...new Set(_uc)];
    return _uc;
  };

  isUCPresentInAnyCamera = (addArr, data_item, service_item) => {
    let idee = this.props.match.params.id;
    const intersection = addArr.filter(
      (value) => !data_item.Usecases.includes(value)
    );
    //console.log(intersection);
    let filterData = this.state.apiData[data_item.slot].global.Cameras.filter(
      (cam) => cam !== idee
    );
    //console.log(filterData, intersection);
    let arr = [];
    this.parentLoop(intersection, (intrEle) => {
      //console.log(intrEle);
      let isFound = false;
      this.parentLoop(filterData, (filEle) => {
        //console.log(filEle);
        if (
          this.state.apiData[data_item.slot].local[filEle].Usecases.includes(
            intrEle
          )
        ) {
          // arr.push(intrEle);
          isFound = true;
        } else {
          var indexOf = addArr.findIndex((i) => i == intrEle);
          //console.log(indexOf);
          if (indexOf >= 0) {
            addArr.splice(indexOf, 1);
          }
        }
      });
      // if (!isFound) {
      //   var indexOf = addArr.findIndex((i) => i == intrEle);
      //   //console.log(indexOf);
      //   addArr.splice(indexOf, 1);
      // }
    });
    // //console.log(arr);
    const reFilteredData = addArr.filter((val) => !arr.includes(val));
    //console.log(addArr, reFilteredData);
    // let res = false;
    // this.parentLoop(filterData, (filEle) => {
    //   res = this.state.apiData[data_item.slot].local[filEle].Usecases.includes(
    //     service_item.Service_name
    //   );
    // });
    // //console.log(res);
    return addArr;
  };

  verifyLimits = (
    data_item,
    service_index,
    service_item,
    data_index,
    omit = false
  ) => {
    //console.log("verifyLimits()" + data_index);
    //console.log(data_item);
    // //console.log(this.state);
    let _data = [...this.state.data];
    // let _Service = [...this.state.Service];
    let _usecases = [..._data[data_index].Usecases];
    let _Dependent = [..._data[data_index].Dependent];
    let addArr = [..._usecases];
    Array.prototype.push.apply(addArr, _Dependent);

    // let uniqueAI = [...new Set(_data[data_index].AI)];
    let uniqueAI = [];
    Array.prototype.push.apply(uniqueAI, _data[data_index].AI);
    let _isUsecasePresentInCamera = this.isUsecasePresentInCamera(
      data_item,
      service_item
    );
    //console.log(_isUsecasePresentInCamera);
    if (data_item.isCameraPresent) {
      if (_isUsecasePresentInCamera) {
        Array.prototype.push.apply(addArr, [...data_item.staticDependent]);
        Array.prototype.push.apply(addArr, [...data_item.staticUC]); //added[17/2]
        Array.prototype.push.apply(uniqueAI, [...data_item.staticAI]);
        addArr = [...new Set(addArr)];
        //console.log(this.state.apiData[data_item.slot].global.Cameras.length);
        // if (this.state.apiData[data_item.slot].global.Cameras.length > 2) {
        if (this.state.apiData[data_item.slot].global.Cameras.length >= 2) {
          let isUCPresent = this.isUCPresentInAnyCamera(
            addArr,
            data_item,
            service_item
          );
          //console.log(isUCPresent);
          addArr = [...isUCPresent];
        } else {
          //console.log("ELSE");
          //console.log(data_item.disabledService, addArr);
          this.parentLoop(data_item.disabledService, (disEle) => {
            this.parentLoop(addArr, (arrEle) => {
              if (disEle === arrEle) {
                var indexOf = addArr.findIndex((i) => i == disEle);
                //console.log(indexOf, disEle);
                if (indexOf >= 0) {
                  addArr.splice(indexOf, 1);
                }
              }
            });
          });
        }
      } else {
        let remainingUC = this.getRemainingUC(data_item, service_item);
        //console.log(remainingUC);
        Array.prototype.push.apply(addArr, [...remainingUC]);
      }
    }

    // let remainingUC = this.getRemainingUC(data_item, service_item);
    // //console.log(remainingUC);
    // Array.prototype.push.apply(addArr, [...remainingUC]);

    uniqueAI = [...new Set(uniqueAI)];
    // uniqueAI = [...new Set(_data[data_index].AI)]; //extra

    addArr = [...new Set(addArr)];
    //console.log(uniqueAI);
    //console.log(addArr);
    //console.log(_data);
    //console.log(this.state.apiData);
    // //console.log(addArr);

    if (usecaseLimit === addArr.length) {
      // //console.log(addArr);
      //console.log("Usecase limit reached");
      this._UCLimitReached(
        data_item,
        service_index,
        service_item,
        data_index,
        _isUsecasePresentInCamera
      );
    } else if (uniqueAI.length === deepStreamLimit) {
      // //console.log(uniqueAI);
      //console.log("DS limit reached");
      this._DSLimitReached(
        data_item,
        service_index,
        service_item,
        data_index,
        _isUsecasePresentInCamera
      );
    } else {
      //console.log("verifyLimits ELSE");
      if (!omit) {
        this.toggleService(
          data_item,
          service_index,
          service_item,
          data_index,
          _isUsecasePresentInCamera
        );
      }
      // this._unchecked(service_item);
    }
  };

  toggleService = (
    data_item,
    service_index,
    service_item,
    data_index,
    _isUsecasePresentInCamera
  ) => {
    //console.log("toggleService()", _enabledTS);
    // //console.log(this.state);
    let _data = [...this.state.data];
    let _Service = [...this.state.Service];
    let _usecases = [..._data[data_index].Usecases];
    let _Dependent = [..._data[data_index].Dependent];
    // let addArr = [..._usecases];
    // Array.prototype.push.apply(addArr, _Dependent);
    // addArr = [...new Set(addArr)];
    let addArr = [..._usecases];
    Array.prototype.push.apply(addArr, _Dependent);
    // let uniqueAI = [...new Set(_data[data_index].AI)];
    // let uniqueAI = [];
    // let uniqueAI = [..._data[data_index].staticAI];
    let uniqueAI = [..._data[data_index].AI];
    // if (!_enabledTS.includes(data_item.slot)) {
    if (data_item.isCameraPresent) {
      if (_isUsecasePresentInCamera) {
        Array.prototype.push.apply(addArr, _data[data_index].staticUC);
        Array.prototype.push.apply(addArr, _data[data_index].staticDependent);
        Array.prototype.push.apply(uniqueAI, _data[data_index].staticAI);
      } else {
        let remainingUC = this.getRemainingUC(data_item, service_item);
        //console.log(remainingUC);
        Array.prototype.push.apply(addArr, [...remainingUC]);
        Array.prototype.push.apply(uniqueAI, _data[data_index].staticAI);
      }
    }

    addArr = [...new Set(addArr)];
    uniqueAI = [...new Set(uniqueAI)];
    // //console.log(addArr);
    // //console.log(uniqueAI);
    if (!uniqueAI.length) {
      // //console.log("DEFAULT STATE");
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
            // //console.log("ELSE...............");
          }
        }
      });
    } else {
      // //console.log("toggleService ELSE");
      let arr = [];
      this.parentLoop(_usecases, (ele) => {
        this.parentLoop(_Service, (ele2) => {
          if (ele2.Service_id === ele) {
            Array.prototype.push.apply(arr, ele2.Dependent_services.AI);
            arr = [...new Set(arr)];
          }
        });
      });
      // //console.log(arr);
      if (arr.length > 1) {
        // //console.log("ARR > 1");
        let filterData = _Service.filter(
          (item) => item.Dependent_services.AI.length <= deepStreamLimit
        );
        // //console.log(filterData);
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
              // //console.log("calling analytics " + element.Service_name);
              this.toggleAnalytics(element, data_index);
            } else {
              let intersection = element.Dependent_services.AI.filter(
                (x) => !uniqueAI.includes(x)
              );
              // //console.log(intersection);
              let add = uniqueAI.length + intersection.length;
              if (deepStreamLimit < add) {
                // //console.log("disable4: " + element.Service_id);
                _data[data_index].disabledService.push(element.Service_id);
                _data[data_index].disabledService = [
                  ...new Set(_data[data_index].disabledService),
                ];
              } else {
                // //console.log("enable4: " + element.Service_id);
                let uniqueD = [...new Set(_data[data_index].disabledService)];
                var ucIndex = uniqueD.indexOf(element.Service_id);
                // //console.log(ucIndex);
                if (ucIndex >= 0) {
                  uniqueD.splice(ucIndex, 1);
                  _data[data_index].disabledService = [...uniqueD];
                }
              }
            }
          } else {
            if (element.Category === "Analytics") {
              // //console.log("calling analytics " + element.Service_name);
              this.toggleAnalytics(element, data_index);
            } else {
              let intersection = element.Dependent_services.AI.filter(
                (x) => !uniqueAI.includes(x)
              );
              // //console.log(intersection);
              let add = uniqueAI.length + intersection.length;
              // //console.log(uniqueAI, intersection);
              // //console.log(deepStreamLimit + "<" + add);
              if (deepStreamLimit < add) {
                // //console.log("disable5: " + element.Service_id);
                _data[data_index].disabledService.push(element.Service_id);
                _data[data_index].disabledService = [
                  ...new Set(_data[data_index].disabledService),
                ];
              } else {
                // //console.log("enable5: " + element.Service_id);
                let uniqueD = [...new Set(_data[data_index].disabledService)];
                var ucIndex = uniqueD.indexOf(element.Service_id);
                // //console.log(ucIndex);
                if (ucIndex >= 0) {
                  uniqueD.splice(ucIndex, 1);
                  _data[data_index].disabledService = [...uniqueD];
                }
              }
            }
          }
        });
      } else {
        // //console.log("ARR === 1");
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
                  // //console.log("calling analytics " + element.Service_name);
                  this.toggleAnalytics(element, data_index);
                } else {
                  let intersection = element.Dependent_services.AI.filter(
                    (x) => !uniqueAI.includes(x)
                  );
                  let add = uniqueAI.length + intersection.length;
                  // //console.log("RESULT");
                  // //console.log(intersection);
                  // //console.log(deepStreamLimit + "<" + add);
                  if (deepStreamLimit < add) {
                    // //console.log("disable: " + element.Service_id);
                    _data[data_index].disabledService.push(element.Service_id);
                    _data[data_index].disabledService = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                  } else {
                    // //console.log("enable: " + element.Service_id);
                    let uniqueD = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                    var ucIndex = uniqueD.indexOf(element.Service_id);
                    // //console.log(ucIndex);
                    if (ucIndex >= 0) {
                      uniqueD.splice(ucIndex, 1);
                      _data[data_index].disabledService = [...uniqueD];
                    }
                  }
                }
              } else {
                if (element.Category === "Analytics") {
                  // //console.log("calling analytics " + element.Service_name);
                  this.toggleAnalytics(element, data_index);
                } else {
                  let intersection = element.Dependent_services.AI.filter(
                    (x) => !uniqueAI.includes(x)
                  );
                  // //console.log(intersection);
                  let add = uniqueAI.length + intersection.length;
                  // //console.log("RESULT 1");
                  // //console.log(intersection);
                  // //console.log(deepStreamLimit + "<" + add);
                  if (deepStreamLimit < add) {
                    // //console.log("disable1: " + element.Service_id);
                    _data[data_index].disabledService.push(element.Service_id);
                    _data[data_index].disabledService = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                  } else {
                    // //console.log("enable1: " + element.Service_id);
                    let uniqueD = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                    var ucIndex = uniqueD.indexOf(element.Service_id);
                    // //console.log(ucIndex);
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
                  // //console.log("calling analytics " + element.Service_name);
                  this.toggleAnalytics(element, data_index);
                } else {
                  let intersection = element.Dependent_services.AI.filter(
                    (x) => !uniqueAI.includes(x)
                  );
                  // //console.log(intersection);
                  let add = uniqueAI.length + intersection.length;
                  // //console.log("RESULT 2");
                  // //console.log(intersection);
                  // //console.log(deepStreamLimit + "<" + add);
                  if (deepStreamLimit < add) {
                    // //console.log("disable2: " + element.Service_id);
                    _data[data_index].disabledService.push(element.Service_id);
                    _data[data_index].disabledService = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                  } else {
                    // //console.log("enable2: " + element.Service_id);
                    let uniqueD = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                    var ucIndex = uniqueD.indexOf(element.Service_id);
                    // //console.log(ucIndex);
                    if (ucIndex >= 0) {
                      uniqueD.splice(ucIndex, 1);
                      _data[data_index].disabledService = [...uniqueD];
                    }
                  }
                }
              } else {
                if (element.Category === "Analytics") {
                  // //console.log("calling analytics " + element.Service_name);
                  this.toggleAnalytics(element, data_index);
                } else {
                  let intersection = element.Dependent_services.AI.filter(
                    (x) => !uniqueAI.includes(x)
                  );

                  let add = uniqueAI.length + intersection.length;
                  // //console.log("RESULT 3");
                  // //console.log(intersection);
                  // //console.log(deepStreamLimit + "<" + add);
                  if (deepStreamLimit < add) {
                    // //console.log("disable3: " + element.Service_id);
                    _data[data_index].disabledService.push(element.Service_id);
                    _data[data_index].disabledService = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                  } else {
                    // //console.log("enable3: " + element.Service_id);
                    let uniqueD = [
                      ...new Set(_data[data_index].disabledService),
                    ];
                    var ucIndex = uniqueD.indexOf(element.Service_id);
                    // //console.log(ucIndex);
                    if (ucIndex >= 0) {
                      uniqueD.splice(ucIndex, 1);
                      _data[data_index].disabledService = [...uniqueD];
                    }
                  }
                }
              }
            }
          } else {
            _data[data_index].disabledService.push(element.Service_id);
            _data[data_index].disabledService = [
              ...new Set(_data[data_index].disabledService),
            ];
          }
        });
      }
    }
    this.setState({ data: _data });
  };

  _UCLimitReached = (
    data_item,
    service_index,
    service_item,
    data_index,
    _isUsecasePresentInCamera
  ) => {
    //console.log("_UCLimitReached()");
    let _Service = [...this.state.Service];
    let _data = [...this.state.data];
    let _usecases = [..._data[data_index].Usecases];
    Array.prototype.push.apply(_usecases, data_item.Dependent);
    //console.log(_enabledTS);
    // if (!_enabledTS.includes(data_item.slot)) {

    //console.log(_isUsecasePresentInCamera);
    if (data_item.isCameraPresent) {
      if (_isUsecasePresentInCamera) {
        Array.prototype.push.apply(_usecases, data_item.staticDependent);
        Array.prototype.push.apply(_usecases, data_item.staticUC);
      } else {
        let remainingUC = this.getRemainingUC(data_item, service_item);
        //console.log(remainingUC);
        Array.prototype.push.apply(_usecases, [...remainingUC]);
      }
    }

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
    this.setState({ data: [..._data] });
  };

  _DSLimitReached = (
    data_item,
    service_index,
    service_item,
    data_index,
    _isUsecasePresentInCamera
  ) => {
    // //console.log("_DSLimitReached()");
    // //console.log(this.state);
    let _data = [...this.state.data];
    let _Service = [...this.state.Service];
    let _usecases = [..._data[data_index].Usecases];
    let _AI = [..._data[data_index].AI];
    let _Dependent = [..._data[data_index].Dependent];
    let uniqueUC = [..._usecases];
    //console.log(data_item);
    Array.prototype.push.apply(uniqueUC, _Dependent);
    //extra
    // if (!_enabledTS.includes(data_item.slot)) {
    if (data_item.isCameraPresent) {
      if (_isUsecasePresentInCamera) {
        Array.prototype.push.apply(uniqueUC, _data[data_index].staticDependent);
        Array.prototype.push.apply(uniqueUC, _data[data_index].staticUC);
        Array.prototype.push.apply(_AI, _data[data_index].staticAI);
      } else {
        let remainingUC = this.getRemainingUC(data_item, service_item);
        //console.log(remainingUC);
        Array.prototype.push.apply(uniqueUC, [...remainingUC]);
      }
    }

    // }
    uniqueUC = [...new Set(uniqueUC)];
    _AI = [...new Set(_AI)]; //extra
    // //console.log(uniqueUC, _usecases);
    this.parentLoop(_Service, (serv_ele) => {
      let result = [];
      if (serv_ele.Dependent_services.AI.length <= deepStreamLimit) {
        // //console.log(serv_ele.Service_name);
        this.parentLoop(uniqueUC, (uc_ele) => {
          if (uc_ele === serv_ele.Service_id) result.push(true);
          else result.push(false);
        });
        // // //console.log(serv_ele.Service_id, result);
        if (result.includes(true)) {
          // //console.log("IF " + serv_ele.Service_id);
        } else {
          const intersection = serv_ele.Dependent_services.AI.filter(
            (value) => !_AI.includes(value)
          );
          // //console.log(intersection);
          let add = _AI.length + intersection.length;
          if (deepStreamLimit < add) {
            // //console.log("disabled DS: " + serv_ele.Service_id);
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
        _data[data_index].disabledService.push(serv_ele.Service_id);
        _data[data_index].disabledService = [
          ...new Set(_data[data_index].disabledService),
        ];
      }
    });
    this.setState({ data: [..._data] });
  };

  usecaseMouseDown = (data_item, service_index, service_item, data_index) => {
    let _Service = [...this.state.Service];
    let _data = [...this.state.data];
    let _usecases = [..._data[data_index].Usecases];
    let _Dependent = [..._data[data_index].Dependent];
    let activeUC = [..._usecases];
    Array.prototype.push.apply(activeUC, _Dependent);
    Array.prototype.push.apply(activeUC, _data[data_index]?.staticUC);
    // activeUC = [...new Set(activeUC)];
    //console.log(activeUC);
    //checking if usecase is added or not
    if (_usecases.includes(service_item.Service_id)) {
      //console.log("UC PRESENT IN ACTIVE UC");
      var ucIndex = _data[data_index].Usecases.indexOf(service_item.Service_id);
      _data[data_index].Usecases.splice(ucIndex, 1);
      //console.log(ucIndex);
      //removing DS
      let arr = [];
      //console.log(_usecases);
      this.parentLoop(_data[data_index].Usecases, (ele) => {
        this.parentLoop(_Service, (ele2) => {
          if (ele2.Service_id === ele) {
            Array.prototype.push.apply(arr, ele2.Dependent_services.AI);
            // arr = [...new Set(arr)];
          }
        });
      });
      //console.log(arr);
      _data[data_index].AI = [...arr];
      if (service_item.Category === "Analytics") {
        // //console.log("Analytics: " + service_item.Service_name);
        let dArr = _data[data_index].Dependent;

        this.parentLoop(service_item.Dependent_services.Usecase, (u_ele) => {
          if (dArr.includes(u_ele)) {
            let index = _data[data_index].Dependent.indexOf(u_ele);
            // //console.log(index);
            if (index >= 0) {
              _data[data_index].Dependent.splice(index, 1);
            }
          }
        });
      }
    } else {
      // //console.log(activeUC);
      //console.log("UC NOT PRESENT IN ACTIVE UC");
      //push data in time slot
      _data[data_index].Usecases.push(service_item.Service_id);
      if (service_item.Category === "Analytics") {
        let arr = [];
        arr.push(service_item.Service_id);
        Array.prototype.push.apply(
          arr,
          service_item.Dependent_services.Usecase
        );
        // //console.log(arr);
        if (arr <= usecaseLimit) {
          Array.prototype.push.apply(
            _data[data_index].Dependent,
            service_item.Dependent_services.Usecase
          );
        } else {
          // //console.log("else");
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

    // //console.log(activeUC);
    this.setState(
      {
        mouseState: true,
        data: _data,
      },
      () =>
        this.verifyLimits(data_item, service_index, service_item, data_index)
    );
  };

  componentWillUnmount() {
    sessionStorage.removeItem("timer");
    clearTimeout(counterTimeout);
  }

  componentDidMount() {
    //console.log(sessionStorage.getItem("timer"));

    // this.onLoad();
    this.props.handleBack(this.btnHandleBack);
    this.props.handleSubmit(this.postCameraSlot);
    this.getCameraLimit();
  }

  componentDidUpdate(prevProps, prevState) {
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
            //console.log("REDIRECT");
            axiosApiInstance
              .get("camera/finish_configure")
              .then((res) => {
                encryptStorage.removeItem("LIM");
                this.props.history.push("/camera");
              })
              .catch((err) => err.response);

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
      console.log(this.btnHandleBack);
      this.props.handleBack(this.btnHandleBack);
    }
  }

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

  getCameraLimit = async () => {
    let _lData = encryptStorage.getItem("LIM");
    if (_lData) {
      usecaseLimit = _lData.usecaseLimit;
      deepStreamLimit = _lData.deepStreamLimit;
      cameraLimit = _lData.cameraLimit;
      console.log(usecaseLimit, deepStreamLimit, cameraLimit);
      this.getServices();
    } else {
      encryptStorage.removeItem("LIM");
      this.props.history.push("/camera");
    }
  };
  getServices = async () => {
    axiosApiInstance
      .get("service/?type=Usecase&packagedData=true&all=true")
      .then((res) => {
        this.getCameraSlots();
        // //console.log(res);
        this.setState({ Service: res.data.detail });
      })
      .catch((err) => {
        //console.log(err.response);
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
      .get("camera/get_all_slots")
      .then((res) => {
        //console.log(res);
        this.setState({ apiData: res.data }, () => {
          this.onLoad();
        });
      })
      .catch((err) => {
        //console.log(err.response);
        this.setState({
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong in fetching camera slots!",
            type: "alert",
            header: "",
          },
        });
        this.resetModal();
      });
  };

  submitCameraSlots = async () => {
    this.setState({ isLoading: true });
    let finalObj = {};
    let UCArray = [];
    this.state.data.map((items, index) => {
      // //console.log(items.slot);

      if (items.Usecases.length > 0) {
        items.Usecases.map((uc, ucind) => {
          UCArray.push(uc);
        });

        // //console.log("is grater");
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
      CameraID: this.props.match.params.id,
      Timeslots: finalObj,
    };
    // let arrset = [...new Set(UCArray)];
    //console.log(body);
    axiosApiInstance
      .post("camera/send_camera_slots", body)
      .then((res) => {
        //console.log(res);

        axiosApiInstance
          .get("camera/finish_configure", body)
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
                encryptStorage.removeItem("LIM");
                this.props.history.push("/camera");
              }, 3000);
            }
          })
          .catch((err) => {
            //console.log(err.response);
            this.setState({
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
      })
      .catch((err) => {
        //console.log(err.response);
        this.setState({
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

  postCameraSlot = async () => {
    clearTimeout(counterTimeout);
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
      CameraID: this.props.match.params.id,
      Timeslots: finalObj,
    };
    // let arrset = [...new Set(UCArray)];
    //console.log(body);

    axiosApiInstance
      .post("camera/send_camera_slots", body)
      .then((res) => {
        // fetch for loop
        //console.log(this.state.configData);
        if (this.state.configData.length > 0) {
          //console.log("CALLING  this.postConfigData();");
          this.postConfigData();
        } else {
          this.setState({
            showErrorModal: {
              ...this.state.showErrorModal,
              showPop: true,
              msg: "Updated Successfully!",
              type: "success",
              header: "Success",
            },
          });
          this.postFinishConfig();
        }
      })
      .catch((err) => {
        //console.log(err.response);
        this.setState({
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

  postConfigData = async () => {
    let obj = {
      // CameraID: this.state.configData[0].CameraID,
      Services: [...this.state.configData],
    };

    await axiosApiInstance
      .post("camera/modules/usecase/settings", obj)
      .then((res) => {
        this.postFinishConfig();
      })
      .catch((err) => {
        //console.log(err.response);
        this.setState({
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

    //console.log("postConfigData()");
    // for (let i = 0; i < this.state.configData.length; i++) {
    //   await axiosApiInstance
    //     .post("camera/modules/usecase/settings", this.state.configData[i])
    //     .then((res) => {
    //       uploadCount = i + 1;
    //       //console.log(uploadCount);
    //       if (uploadCount === this.state.configData.length) {
    //         this.postFinishConfig();
    //         // this.setState({
    //         //   showErrorModal: {
    //         //     ...this.state.showErrorModal,
    //         //     showPop: true,
    //         //     msg: "Updated Successfully!",
    //         //     type: "success",
    //         //     header: "Success",
    //         //   },
    //         // });
    //         // setTimeout(() => {
    //         //   this.props.history.push("/camera");
    //         // }, 3000);
    //       }
    //     })
    //     .catch((err) => {
    //       //console.log(err.response);
    //       this.setState({
    //         isLoading: false,
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
    //console.log("postFinishConfig()");
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
            this.props.history.push("/camera");
          }, 3000);
        }
      })
      .catch((err) => {
        //console.log(err.response);
        this.setState({
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

  pushData = (data_ele, keys) => {
    let _dataa = _.cloneDeep(this.state.data);
    let _apiData = { ...this.state.apiData };
    let idee = this.props.match.params.id;
    //console.log(data_ele, keys);

    Array.prototype.push.apply(
      data_ele.Usecases,
      _apiData[keys].local[idee]?.Usecases
    );
    //console.log(data_ele);

    Array.prototype.push.apply(
      data_ele.Dependent,
      _apiData[keys].local[idee]?.Dependent
    );

    Array.prototype.push.apply(data_ele.AI, _apiData[keys].local[idee]?.AI);

    Array.prototype.push.apply(
      data_ele.staticUC,
      _apiData[keys].global.Usecases
    );

    Array.prototype.push.apply(data_ele.staticAI, _apiData[keys].global?.AI);
    Array.prototype.push.apply(
      data_ele.staticDependent,
      _apiData[keys].global?.Dependent
    );

    //unique
    data_ele.staticAI = [...new Set(data_ele.staticAI)];
    data_ele.staticUC = [...new Set(data_ele.staticUC)];
    data_ele.staticDependent = [...new Set(data_ele.staticDependent)];

    data_ele.Usecases = [...new Set(data_ele.Usecases)];
    data_ele.Dependent = [...new Set(data_ele.Dependent)];
    data_ele.AI = [...new Set(data_ele.AI)];

    return data_ele;
  };

  onLoad = () => {
    //console.log("ONLOAD");
    let _data = _.cloneDeep(this.state.data);
    let _selectedTimeSlot = [...this.state.selectedTimeSlot];
    let _service = [...this.state.Service];
    let _apiData = { ...this.state.apiData };
    let keys = Object.keys(this.state.apiData);
    let idee = this.props.match.params.id;
    let _DisabledTS = [];
    for (let i = 0; i < keys.length; i++) {
      if (_apiData[keys[i]].global.Cameras.length) {
        if (_apiData[keys[i]].global.Cameras.length >= cameraLimit) {
          if (!_apiData[keys[i]].global.Cameras.includes(idee)) {
            _DisabledTS.push(keys[i]);
          }
        }
      }

      if (_apiData[keys[i]].global.Cameras.length) {
        if (_apiData[keys[i]].global.Cameras.includes(idee)) {
          if (_apiData[keys[i]].global.Cameras.length > 1) {
            _data[i].isCameraPresent = true;
          }
        } else {
          _data[i].isCameraPresent = true;
        }

        //if global camera length is greater than camera limit
        //console.log(_apiData[keys[i]].global.Cameras.length, cameraLimit);
        // if (_apiData[keys[i]].global.Cameras.length >= cameraLimit) {
        // if (_apiData[keys[i]].global.Cameras.length > cameraLimit) {
        if (false) {
          //console.log(_apiData[keys[i]].global.Cameras, idee);
          if (!_apiData[keys[i]].global.Cameras.includes(idee)) {
            _DisabledTS.push(keys[i]);
          }
        } else {
          if (_apiData[keys[i]].global.Cameras.includes(idee)) {
            _selectedTimeSlot.push(keys[i]);
            //console.log("IDEE INCLUDED IN GLOBAL CAMERA: " + keys[i]);
            let abc = this.pushData(_data[i], keys[i]);
            //console.log(abc);
            _data[i] = { ...abc };
            this.parentLoop(_service, (serv_ele) => {
              this.parentLoop(_data[i].AI, (data_ele) => {
                this.parentLoop(serv_ele.Dependent_services.AI, (serv_ele2) => {
                  let _usecases = [..._data[i].Usecases];
                  let _AI = [..._data[i].AI];
                  if (_data[i].isCameraPresent) {
                    Array.prototype.push.apply(
                      _usecases,
                      _data[i].staticDependent
                    );
                    Array.prototype.push.apply(_usecases, _data[i].staticUC);
                    Array.prototype.push.apply(_AI, _data[i].staticAI);
                  }
                  _usecases = [...new Set(_usecases)];
                  _AI = [...new Set(_AI)];
                  //console.log(_usecases);
                  //console.log(_AI);
                  if (_usecases.length === usecaseLimit) {
                    //console.log("UC LIMIT REACHED: " + serv_ele.Service_id);
                    if (!_usecases.includes(serv_ele.Service_id)) {
                      _data[i].disabledService.push(serv_ele.Service_id);
                    }
                  } else {
                    //console.log("IN ELSE");
                    let res_ = _data[i].AI.length <= deepStreamLimit;
                    let result = [];

                    if (!res_) {
                      if (data_ele !== serv_ele2) {
                        _data[i].disabledService.push(serv_ele.Service_id);
                      }
                    } else {
                      //console.log("Service_id:" + serv_ele.Service_id);
                      const intersection =
                        serv_ele.Dependent_services.AI.filter(
                          (value) => !_AI.includes(value)
                        );
                      let add = _AI.length + intersection.length;
                      if (deepStreamLimit < add) {
                        _data[i].disabledService.push(serv_ele.Service_id);
                        _data[i].disabledService = [
                          ...new Set(_data[i].disabledService),
                        ];
                      }
                    }
                  }
                });
              });
            });
          } else {
            //console.log("IDEE NOT INCLUDED IN GLOBAL CAMERA" + keys[i]);
            let abc = this.pushData(_data[i], keys[i]);
            _data[i] = { ...abc };
            this.parentLoop(_service, (serv_ele) => {
              _data[i].disabledService.push(serv_ele.Service_id);
            });
          }
        }
      } else {
        //console.log("NO CAMERA FOUND");
        //console.log(keys[i]);
        this.parentLoop(_service, (serv_ele) => {
          _data[i].disabledService.push(serv_ele.Service_id);
        });
      }
    }

    this.setState(
      {
        selectedTimeSlot: [..._selectedTimeSlot],
        staticTimeSlot: [..._selectedTimeSlot],
        DisabledTS: [..._DisabledTS],
        isLoading: false,
        data: [..._data],
      },
      () => {
        //console.log(_data);
        if (sessionStorage.getItem("timer")) {
          this.setState({ counter: sessionStorage.getItem("timer") });
        } else {
          this.setState({ counter: pageTime });
        }
        // for (let i = 0; i < this.state.data.length; i++) {
        //   let add = _.concat(
        //     this.state.data[i].AI,
        //     this.state.data[i].staticAI
        //   );
        //   if (add.length > 0) {
        //     // //console.log(this.state.data[i].slot, add);
        //     this.verifyLimits(this.state.data[i], "", "", i);
        //   }
        // }
      }
    );
  };

  onLoad2 = () => {
    // //console.log("onLoad()", this.props.match.params.id);
    let _data = [...this.state.data];
    let _selectedTimeSlot = [...this.state.selectedTimeSlot];
    let _service = [...this.state.Service];
    let _apiData = { ...this.state.apiData };
    let keys = Object.keys(this.state.apiData);
    let idee = this.props.match.params.id;
    let _DisabledTS = [];
    function pushData(data_ele, keys) {
      Array.prototype.push.apply(
        data_ele.Usecases,
        _apiData[keys].local[idee]?.Usecases
      );

      Array.prototype.push.apply(
        data_ele.Dependent,
        _apiData[keys].local[idee]?.Dependent
      );

      Array.prototype.push.apply(data_ele.AI, _apiData[keys].local[idee]?.AI);

      Array.prototype.push.apply(
        data_ele.staticUC,
        _apiData[keys].global.Usecases
      );

      Array.prototype.push.apply(data_ele.staticAI, _apiData[keys].global?.AI);
      Array.prototype.push.apply(
        data_ele.staticDependent,
        _apiData[keys].global?.Dependent
      );

      //unique
      data_ele.staticAI = [...new Set(data_ele.staticAI)];
      data_ele.staticUC = [...new Set(data_ele.staticUC)];
      data_ele.staticDependent = [...new Set(data_ele.staticDependent)];

      data_ele.Usecases = [...new Set(data_ele.Usecases)];
      data_ele.Dependent = [...new Set(data_ele.Dependent)];
      data_ele.AI = [...new Set(data_ele.AI)];
    }

    for (let i = 0; i < keys.length; i++) {
      if (this.state.apiData[keys[i]].global.Cameras.length) {
        if (this.state.apiData[keys[i]].global.Cameras.length >= cameraLimit) {
          // // //console.log(this.state.apiData[keys[i]]);
          if (!this.state.apiData[keys[i]].global.Cameras.includes(idee)) {
            _DisabledTS.push(keys[i]);
          }
        }

        if (this.state.apiData[keys[i]].global.Cameras.includes(idee)) {
          if (!_selectedTimeSlot.length) {
            // //console.log("object", keys[i]);
            _selectedTimeSlot.push(keys[i]);
            // var indexOf = _data.findIndex(
            //   (i) => i.slot == _selectedTimeSlot[0]
            // );
            // // //console.log(indexOf);
            // pushData(_data[i], keys[i]);
            // this.verifyLimits(_data[indexOf], "", "", indexOf);
            pushData(_data[i], keys[i]);
            this.verifyLimits(_data[i], "", "", i);
          } else {
            // //console.log("ELSEELSEELSEELSE ", keys[i], slot2);

            _selectedTimeSlot.push(keys[i]);

            this.parentLoop(_selectedTimeSlot, (slot_ele) => {
              var indexOf = _data.findIndex((i) => i.slot == slot_ele);
              // //console.log(indexOf);
              pushData(_data[i], keys[i]);
              this.verifyLimits(_data[indexOf], "", "", indexOf);
            });
            // pushData(_data[i], keys[i]);
            // this.verifyLimits(_data[i], "", "", i);
          }

          // _selectedTimeSlot.push(keys[i]);
          // this.parentLoop(_selectedTimeSlot, (slot_ele) => {
          //   var indexOf = _data.findIndex((i) => i.slot == slot_ele);
          //   // //console.log(indexOf);
          //   pushData(_data[i], keys[i]);
          //   this.verifyLimits(_data[indexOf], "", "", indexOf);
          // });
          // pushData(_data[i], keys[i]);
          // this.verifyLimits(_data[i], "", "", i);
        } else {
          //console.log("ELSE");
          //console.log(keys[i], _data[i]);
          this.parentLoop(_service, (serv_ele) => {
            _data[i].disabledService.push(serv_ele.Service_id);
          });

          //extra added [18/1/2022]
          // var indexOf = _data.findIndex((it) => it.slot === keys[i]);
          // pushData(_data[i], keys[i]);
          // this.verifyLimits(_data[indexOf], "", "", indexOf, true);
        }
      } else {
        //console.log("ELSE ELSE");
        //console.log(keys[i]);
        this.parentLoop(_service, (serv_ele) => {
          _data[i].disabledService.push(serv_ele.Service_id);
        });
      }
    }
    this.setState(
      {
        selectedTimeSlot: [..._selectedTimeSlot],
        staticTimeSlot: [..._selectedTimeSlot],
        data: [..._data],
        DisabledTS: [..._DisabledTS],
        isLoading: false,
      },
      () => {
        if (sessionStorage.getItem("timer")) {
          this.setState({ counter: sessionStorage.getItem("timer") });
        } else {
          this.setState({ counter: pageTime });
        }
        //console.log(this.state);
      }
    );
  };

  btnHandleBack = () => {
    this.setState({ isLoading: true });
    axiosApiInstance
      .get("camera/finish_configure")
      .then((res) => {
        sessionStorage.removeItem("timer");
        clearTimeout(counterTimeout);
        encryptStorage.removeItem("LIM");
        this.props.history.push("/camera");
      })
      .catch((err) => {
        this.setState({ isLoading: false });
        //console.log(err.response);
        this.setState({
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Something Went Wrong in submitting configure setting!",
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
          ref={this.myRef}
          handleBack={() => {
            this.setState({ ActiveTab: "Scheduler", counter: pageTime });
          }}
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
          configData={this.state.configData}
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
        className="_update_app_schduler_camera_"
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

        {/* {//console.log(this.state)} */}

        {/* <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et
        </p> */}
        <BoxCard
          id="update_scheduler_card_"
          className="card_size"
          isLoading={this.state.isLoading}
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
              {/* <p className="select_text">Select All</p> */}
              <p className="drag_text">Drag & Select Time Range</p>
              <p className="configure_text">Configure</p>
            </div>

            <div className="timeline-header header_adjust">
              <p className="h">Activate Camera Time</p>
              {/* <div
                className={
                  isAllTimeSelected ? "select_all all_selected" : "select_all"
                }
                onMouseEnter={() => {
                  this.setState({ mouseState: false });
                }}
                onMouseLeave={() => {
                  this.setState({ mouseState: false });
                }}
                // style={{ marginLeft: "1vw" }}
                onClick={() => {
                  isAllTimeSelected = !isAllTimeSelected;
                  this.toggleCameraSlot();
                }}
              /> */}
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
                    onMouseLeave={() => this.setState({ mouseState: false })}
                  >
                    <div className="circle" />
                  </div>
                ))}
                <div className="circle2 c_adjust" />
              </div>
            </div>
            <div className="data-container">
              <h1>Apps</h1>

              <Scrollbars autoHeight autoHeightMax="43vh">
                <div className="app_fixed">
                  {this.state.Service.map((service_item, service_index) => (
                    <div className="flex" key={service_item.Service_id}>
                      <h4 className="name">
                        {service_item.Service_name.replaceAll("_", " ")}
                      </h4>
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
                            onMouseLeave={() =>
                              this.setState({ mouseState: false })
                            }
                          >
                            <div className="circle" />
                          </div>
                        ))}
                        <div className="circle2" />
                      </div>
                      <i
                        className="material-icons setting_icon"
                        style={{
                          display: this.toggleSetting(service_item.Service_name)
                            ? "block"
                            : "none",
                        }}
                        onClick={() => {
                          if (this.toggleSetting(service_item.Service_name)) {
                            // this.props.handleHistory("App Configuration");
                            sessionStorage.removeItem("timer");
                            clearTimeout(counterTimeout);
                            this.setState({ ActiveTab: "Configuration" });
                            var url = new URL(window.location.href);
                            url.searchParams.append(
                              "service",
                              service_item.Service_name
                            );
                            window.history.pushState(null, null, url);
                          }
                        }}
                      >
                        settings
                      </i>
                    </div>
                  ))}
                </div>
              </Scrollbars>
            </div>
          </div>
          {/* <div
            style={{
              position: "fixed",
              left: "3vw",
              top: "15vw",
            }}
          >
            <Button
              style={{ width: "6vw", margin: "0 2.5vw" }}
              onClick={() => {
                this.setState({ isLoading: true });
                axiosApiInstance
                  .get("camera/finish_configure")
                  .then((res) => {
                    sessionStorage.removeItem("timer");
                    clearTimeout(counterTimeout);
                    this.props.history.push("/camera");
                  })
                  .catch((err) => {
                    this.setState({ isLoading: false });
                    //console.log(err.response);
                    this.setState({
                      showErrorModal: {
                        ...this.state.showErrorModal,
                        showPop: true,
                        msg: "Something Went Wrong in submitting configure setting!",
                        type: "alert",
                        header: "",
                      },
                    });
                    this.resetModal();
                  });
              }}
              name="Back"
            />
            <Button
              style={{ width: "6vw", marging: "0 2.5vw" }}
              onClick={this.postCameraSlot}
              type="gradient"
              name="Submit"
              disabled={this.state.isLoading}
            />
          </div> */}
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
                encryptStorage.removeItem("LIM");
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
      </motion.div>
    );
  }
}
export default withRouter(UpdateAppScheduler);
