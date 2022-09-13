import React, { Component, useEffect, useState } from "react";
import { xMotion } from "../../../../helper/motions";
import "./appconfig.scss";
import { motion } from "framer-motion";
import { BoxCard } from "../../../../components/card/Card";
import InputBox from "../../../../components/Inputbox/InputBox";
import Dropdown from "../../../../components/Dropdown/Dropdown";
import Button from "../../../../components/Button/Button";
import { Radio } from "../../../../components/Radio/Radio";
import Scrollbars from "react-custom-scrollbars";
import { axiosApiInstance, SOCKET_URL } from "../../../../helper/request";
import { withRouter } from "react-router-dom";
import Modal from "../../../../components/Modal/Modal";
import Loading from "../../../../components/Loading/Loading";
import Counter from "../../../../components/Counter/Counter";
import _ from "lodash";
let finalCord = [];
let timeout = null;
let isUpdate = false;
let pageTime = 300;
let dataCount = -1;
let counterTimeout = null;

class AppConfiguration extends Component {
  state = {
    counter: "",
    isLoadingScreen: false,
    canvasImage:
      "https://static.onecms.io/wp-content/uploads/sites/28/2021/02/19/new-york-city-evening-NYCTG0221.jpg",
    service_data: [],
    radio: "",
    point: 3,
    dots: 0,
    lines: 0,
    messageBody: "",
    alertBox: false,
    ROIcord: [],
    selectedCard: "ABC",
    LOIcord: [],
    LOIcord1: [],
    direction: "A TO B",
    data: [],
    activeCardIndex: -1,
    toggleSubtypeChange: false,
    showErrorModal: {
      showPop: false,
      msg: "",
      type: "alert",
      header: "",
    },
    SubTypes: [],
    isLoading: true,
    finalCoordinates: [],
  };

  getDeveloperSettings = () => {
    console.log(finalCord);
    let res = finalCord.flatMap((x) => Object.keys(x));
    console.log(res);
    res.map((items, index) => {
      console.log(items);
      var ctx = document.getElementById("canvas").getContext("2d");
      ctx.beginPath();
      ctx.strokeStyle = "red";
      // if (Object.keys(finalCord[index][items].roicords).length > 0) {
      if (finalCord[index][items].roicords) {
        ctx.moveTo(
          finalCord[index][items].roicords.x1,
          finalCord[index][items].roicords.y1
        );
        ctx.lineTo(
          finalCord[index][items].roicords.x2,
          finalCord[index][items].roicords.y2
        );
        ctx.moveTo(
          finalCord[index][items].roicords.x2,
          finalCord[index][items].roicords.y2
        );
        ctx.lineTo(
          finalCord[index][items].roicords.x3,
          finalCord[index][items].roicords.y3
        );
        ctx.moveTo(
          finalCord[index][items].roicords.x3,
          finalCord[index][items].roicords.y3
        );
        ctx.lineTo(
          finalCord[index][items].roicords.x4,
          finalCord[index][items].roicords.y4
        );
        ctx.moveTo(
          finalCord[index][items].roicords.x4,
          finalCord[index][items].roicords.y4
        );
        ctx.lineTo(
          finalCord[index][items].roicords.x1,
          finalCord[index][items].roicords.y1
        );
        ctx.stroke();

        if (finalCord[index][items].hasOwnProperty("loicord")) {
          ctx.moveTo(
            finalCord[index][items].loicord.lineA.x1,
            finalCord[index][items].loicord.lineA.y1
          );
          ctx.lineTo(
            finalCord[index][items].loicord.lineA.x2,
            finalCord[index][items].loicord.lineA.y2
          );
          ctx.stroke();

          let midpoint1 =
            (finalCord[index][items].loicord.lineA.x1 +
              finalCord[index][items].loicord.lineA.x2) /
            2;
          let midpoint2 =
            (finalCord[index][items].loicord.lineA.y1 +
              finalCord[index][items].loicord.lineA.y2) /
            2;

          var slope =
            (finalCord[index][items].loicord.lineA.y2 -
              finalCord[index][items].loicord.lineA.y1) /
            (finalCord[index][items].loicord.lineA.x2 -
              finalCord[index][items].loicord.lineA.x1);
          if (
            finalCord[index][items].loicord.lineA.y2 >
              finalCord[index][items].loicord.lineA.y1 &&
            finalCord[index][items].loicord.lineA.x1 >
              finalCord[index][items].loicord.lineA.x2
          ) {
            var xa = midpoint1 - Math.sqrt(400 / (1 + 1 / slope ** 2));
            var xb = midpoint1 + Math.sqrt(625 / (1 + 1 / slope ** 2));
            var ya = midpoint2 - (1 / slope) * (xa - midpoint1);
            var yb = midpoint2 - (1 / slope) * (xb - midpoint1);
          } else if (
            finalCord[index][items].loicord.lineA.y2 >
              finalCord[index][items].loicord.lineA.y1 ||
            finalCord[index][items].loicord.lineA.x1 >
              finalCord[index][items].loicord.lineA.x2
          ) {
            var xa = midpoint1 + Math.sqrt(400 / (1 + 1 / slope ** 2));
            var xb = midpoint1 - Math.sqrt(800 / (1 + 1 / slope ** 2));
            var ya = midpoint2 - (1 / slope) * (xa - midpoint1);
            var yb = midpoint2 - (1 / slope) * (xb - midpoint1);
          } else {
            var xa = midpoint1 - Math.sqrt(400 / (1 + 1 / slope ** 2));
            var xb = midpoint1 + Math.sqrt(800 / (1 + 1 / slope ** 2));
            var ya = midpoint2 - (1 / slope) * (xa - midpoint1);
            var yb = midpoint2 - (1 / slope) * (xb - midpoint1);
          }
          ctx.font = "25px Arial";
          ctx.fillStyle = "red";
          ctx.fillText("A", xa, ya);
          ctx.fillText("B", xb, yb);
          ctx.stroke();
        }
      }
    });
  };

  handleCanvasReset = (id, index) => {
    let res = finalCord.flatMap((x) => Object.keys(x));
    console.log(id, index);
    console.log(res);
    res.map((items, index) => {
      if (items === id) {
        finalCord[index] = { [id]: {} };
      }
    });

    console.log(finalCord);
    let _data = [...this.state.data];

    _data[index].radio = "ROI";
    _data[index].roicords = {};
    _data[index].loicord = { InDirection: "A TO B", lineA: {} };

    this.setState({
      finalCoordinates: [...finalCord],
      data: _data,
      radio: "ROI",
      point: 3,
      activeCardIndex: index,
    });

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    this.setState({ ROIcord: [] });
    this.state.ROIcord.map((items, index) => {
      ctx.beginPath();
      ctx.clearRect(
        items.x - this.state.point - 1,
        items.y - this.state.point - 1,
        this.state.point * 2 + 2,
        this.state.point * 2 + 2
      );

      ctx.closePath();
      // this.setState  ({ dots: 0 });
    });

    this.setState({ dots: 0, lines: 0, LOIcord1: [] });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var ctx = document.getElementById("canvas").getContext("2d");
    ctx.fillStyle = "#ff2626"; // Red color

    this.getDeveloperSettings();
  };

  checkDataAvailable = () => {
    let val = false;
    if (finalCord.length > 0) {
      finalCord.map((itemz, ind) => {
        if (Object.keys(itemz) == this.state.selectedCard) {
          // //console.log(itemz[this.state.selectedCard]);
          if (Object.keys(itemz[this.state.selectedCard]).length > 0) {
            // alert('Data Available cant add')
            val = true;
          } else {
            val = false;
          }
        }
      });
    } else {
      val = false;
    }
    // //console.log(val);
    return val;
  };

  handleClick = async (e) => {
    if (this.state.radio == "ROI") {
      if (this.checkDataAvailable()) {
        if (this.state.dots >= 4) {
          this.setState({
            showErrorModal: {
              ...this.state.showErrorModal,
              showPop: true,
              msg: "Coordinates already drawn for selected card. Reset to draw again.",
              type: "alert",
              header: "",
            },
          });
          this.resetModal();

          return;
        } else {
          this.setState({
            showErrorModal: {
              ...this.state.showErrorModal,
              showPop: true,
              msg: "Coordinates already drawn for selected card. Reset to draw again.",
              type: "alert",
              header: "",
            },
          });
          this.resetModal();
        }
      } else {
        if (this.state.dots < 4) {
          const canvas = document.getElementById("canvas");
          var rect = canvas.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          this.setState({ dots: this.state.dots + 1 });
          await this.setState({
            ROIcord: [...this.state.ROIcord, { x: x, y: y }],
          });
          this.drawCoordinates(x, y);
          // dynamically add to specific index
          if (this.state.dots == 4) {
            let k = finalCord.flatMap((x) => Object.keys(x));

            if (k.includes(this.state.selectedCard)) {
              let coordinates = {
                x1: this.state.ROIcord[0].x,
                y1: this.state.ROIcord[0].y,
                x2: this.state.ROIcord[1].x,
                y2: this.state.ROIcord[1].y,
                x3: this.state.ROIcord[2].x,
                y3: this.state.ROIcord[2].y,
                x4: this.state.ROIcord[3].x,
                y4: this.state.ROIcord[3].y,
              };

              finalCord[this.state.activeCardIndex][
                this.state.selectedCard
              ].roicords = coordinates;

              this.setState({
                finalCoordinates: [],
                finalCoordinates: finalCord,
              });
            } else {
              let coordinates = {
                ["roi" + Number(dataCount)]: {
                  roicords: {
                    x1: this.state.ROIcord[0].x,
                    y1: this.state.ROIcord[0].y,
                    x2: this.state.ROIcord[1].x,
                    y2: this.state.ROIcord[1].y,
                    x3: this.state.ROIcord[2].x,
                    y3: this.state.ROIcord[2].y,
                    x4: this.state.ROIcord[3].x,
                    y4: this.state.ROIcord[3].y,
                  },
                },
              };

              finalCord.push(coordinates);
              this.setState({
                finalCoordinates: [],
                finalCoordinates: finalCord,
              });
            }
          }
        } else {
          this.setState({
            showErrorModal: {
              ...this.state.showErrorModal,
              showPop: true,
              msg: "You have already drawn ROI. Reset to draw again.",
              type: "alert",
              header: "",
            },
          });
          this.resetModal();
        }
        if (this.state.dots == 2) {
          this.drawROI(
            [this.state.ROIcord[0].x, this.state.ROIcord[0].y],
            [this.state.ROIcord[1].x, this.state.ROIcord[1].y]
          );
        } else if (this.state.dots == 3) {
          this.drawROI(
            [this.state.ROIcord[1].x, this.state.ROIcord[1].y],
            [this.state.ROIcord[2].x, this.state.ROIcord[2].y]
          );
        } else if (this.state.dots == 4) {
          let _data = [...this.state.data];
          let _activeCardIndex = this.state.activeCardIndex;
          console.log(finalCord, _activeCardIndex, this.state.selectedCard);
          _data[_activeCardIndex].roicords = {
            ...finalCord[_activeCardIndex][this.state.selectedCard].roicords,
          };
          this.setState({ data: [..._data] });
          this.drawROI(
            [this.state.ROIcord[2].x, this.state.ROIcord[2].y],
            [this.state.ROIcord[3].x, this.state.ROIcord[3].y]
          );
          this.drawROI(
            [this.state.ROIcord[3].x, this.state.ROIcord[3].y],
            [this.state.ROIcord[0].x, this.state.ROIcord[0].y]
          );

          // _data[_activeCardIndex].ROIcord={}
        }
      }
    }
  };

  handleMouseDown = async (e) => {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    if (this.state.lines < 1) {
      ctx.beginPath();
      ctx.strokeStyle = this.state.lines == 0 ? "red" : "yellow";
      ctx.moveTo(x, y);
      this.setState({ lines: this.state.lines + 1 });
      this.setState({ LOIcord: [...this.state.LOIcord, { x: x, y: y }] });
      // localStorage.setItem('LOI', JSON.stringify(this.state.LOIcord))
    } else {
      this.setState({
        showErrorModal: {
          ...this.state.showErrorModal,
          showPop: true,
          msg: "You have already drawn 1 line. Reset to draw again.",
          type: "alert",
          header: "",
        },
      });
      this.resetModal();

      // return;
    }
  };

  handleMouseUp = async (e) => {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    if (!this.state.LOIcord[0]?.x) {
      return;
    }
    await this.setState({
      LOIcord1: [
        ...this.state.LOIcord1,
        {
          x: this.state.LOIcord[0]?.x,
          y: this.state.LOIcord[0]?.y,
          x1: x,
          y1: y,
        },
      ],
    });
    // saving into object..
    let k = finalCord.flatMap((x) => Object.keys(x));
    if (k.includes(this.state.selectedCard)) {
      // //console.log(
      //   finalCord[k.indexOf(this.state.selectedCard)][this.state.selectedCard]
      // );
      let loicoord = {
        LOIcord: {
          lineA: {
            x1: this.state.LOIcord1[0].x,
            y1: this.state.LOIcord1[0].y,
            x2: this.state.LOIcord1[0].x1,
            y2: this.state.LOIcord1[0].y1,
          },
          InDirection: this.state.direction,
        },
      };
      finalCord[k.indexOf(this.state.selectedCard)][
        this.state.selectedCard
      ].loicord = loicoord.LOIcord;

      let _data = [...this.state.data];
      let _activeCardIndex = this.state.activeCardIndex;
      _data[_activeCardIndex].loicord.lineA = {
        ...loicoord.LOIcord.lineA,
      };
      this.setState({ data: [..._data] });

      this.setState({ finalCoordinates: [], finalCoordinates: finalCord });
    }

    ctx.font = "25px Arial";

    let midpoint1 = (x + this.state.LOIcord[0].x) / 2;
    let midpoint2 = (y + this.state.LOIcord[0].y) / 2;

    var slope = (y - this.state.LOIcord[0].y) / (x - this.state.LOIcord[0].x);
    if (y > this.state.LOIcord[0].y && this.state.LOIcord[0].x > x) {
      var xa = midpoint1 - Math.sqrt(400 / (1 + 1 / slope ** 2));
      var xb = midpoint1 + Math.sqrt(625 / (1 + 1 / slope ** 2));
      var ya = midpoint2 - (1 / slope) * (xa - midpoint1);
      var yb = midpoint2 - (1 / slope) * (xb - midpoint1);
    } else if (y > this.state.LOIcord[0].y || this.state.LOIcord[0].x > x) {
      var xa = midpoint1 + Math.sqrt(400 / (1 + 1 / slope ** 2));
      var xb = midpoint1 - Math.sqrt(800 / (1 + 1 / slope ** 2));
      var ya = midpoint2 - (1 / slope) * (xa - midpoint1);
      var yb = midpoint2 - (1 / slope) * (xb - midpoint1);
    } else {
      var xa = midpoint1 - Math.sqrt(400 / (1 + 1 / slope ** 2));
      var xb = midpoint1 + Math.sqrt(800 / (1 + 1 / slope ** 2));
      var ya = midpoint2 - (1 / slope) * (xa - midpoint1);
      var yb = midpoint2 - (1 / slope) * (xb - midpoint1);
    }

    this.setState({ LOIcord: [] });

    let polygon1 = [];
    let p = [];
    this.state.ROIcord.map((items, index) => {
      polygon1.push([items.x, items.y]);
    });

    this.state.LOIcord1.map((items, index) => {
      p.push([(items.x + items.x1) / 2, (items.y + items.y1) / 2]);
    });
    // alert(this.isInsidePolygon(polygon1, p[0]))
    if (this.isInsidePolygon(polygon1, p[0])) {
      ctx.lineTo(x, y);
      ctx.fillText("A", xa, ya);
      ctx.fillText("B", xb, yb);
      ctx.stroke();
    } else {
      this.setState({
        showErrorModal: {
          ...this.state.showErrorModal,
          showPop: true,
          msg: "Wrong LOI Drawn! please draw LOI in ROI box.",
          type: "alert",
          header: "",
        },
      });
      this.resetModal();
      this.setState({
        lines: 0,
        LOIcord1: [],
      });
    }
  };

  drawCoordinates = (x, y) => {
    var ctx = document.getElementById("canvas").getContext("2d");
    ctx.fillStyle = "#ff2626"; // Red color
    ctx.beginPath();
    ctx.arc(x, y, this.state.point, 0, Math.PI * 2, true);
    ctx.fill();
  };

  drawROI = (moveto, lineto) => {
    var c = document.getElementById("canvas");
    var ctx = c.getContext("2d");
    ctx.fillStyle = "red";
    ctx.strokeStyle = "red";
    ctx.beginPath();

    ctx.moveTo(moveto[0], moveto[1]);
    ctx.lineTo(lineto[0], lineto[1]);
    ctx.stroke();
  };

  onsegment = (p, q, r) => {
    if (
      q[0] <= Math.max(p[0], r[0]) &&
      q[0] >= Math.min(p[0], r[0]) &&
      q[1] <= Math.max(p[1], r[1]) &&
      q[1] >= Math.min(p[1], r[1])
    ) {
      return true;
    } else {
      return false;
    }
  };

  persept = (p, q, r) => {
    let val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (val == 0) {
      return 0;
    }
    if (val > 0) {
      return 1;
    } else {
      return 2;
    }
  };

  doInterSect = (p1, q1, p2, q2) => {
    let o1 = this.persept(p1, q1, p2);
    let o2 = this.persept(p1, q1, q2);
    let o3 = this.persept(p2, q2, p1);
    let o4 = this.persept(p2, q2, q1);
    if (o1 != o2 && o3 != o4) {
      return true;
    }
    if (o1 == 0 && this.onsegment(p1, p2, q1)) {
      return true;
    }
    if (o2 == 0 && this.onsegment(p2, q2, q1)) {
      return true;
    }
    if (o3 == 0 && this.onsegment(p2, p1, q2)) {
      return true;
    }
    if (o4 == 0 && this.onsegment(p2, q1, q2)) {
      return true;
    }
    return false;
  };

  isInsidePolygon = (polygon1, p) => {
    let n = polygon1.length;
    if (n < 3) {
      return false;
    }
    let extreme = [100000, p[1]];
    let count = 0;
    let i = 0;
    do {
      let next = (i + 1) % n;
      if (this.doInterSect(polygon1[i], polygon1[next], p, extreme)) {
        if (this.persept(polygon1[i], p, polygon1[next]) == 0) {
          return this.onsegment(polygon1[i], p, polygon1[next]);
        }
        count += 1;
      }
      i = next;
    } while (i != 0);
    return count % 2 == 1;
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

  getImage = () => {
    let camID = this.props.match.params.id;
    const authResult = new URLSearchParams(window.location.search);
    const cType = authResult.get("cameraID");

    if (!camID) {
      camID = cType;
    }

    axiosApiInstance.get("camera?CameraID=" + camID).then((res) => {
      if (res.data.Data[0]) {
        this.setState({
          canvasImage: res.data.Data[0].Test_image + "?" + Math.random(),
        });
      }
    });
  };

  componentDidMount() {
    if (sessionStorage.getItem("timer")) {
      this.setState({ counter: sessionStorage.getItem("timer") });
    } else {
      this.setState({ counter: pageTime });
    }

    const authResult = new URLSearchParams(window.location.search);
    const sType = authResult.get("service");
    // //console.log(sType);
    // //console.log(this.props.service);
    if (!sType && !this.props.service) {
      // this.props.history.push("/home");
    } else {
      let type = sType ? sType : this.props.service;
      this.getImage();
      this.getSubtypes(type);
    }

    this.props.handleConfigBack(this.btnHandleBack);
    this.props.handleConfigSubmit(this.postData);
  }
  componentWillUnmount() {
    finalCord = [];
    isUpdate = false;
    clearTimeout(counterTimeout);
    sessionStorage.removeItem("timer");
  }

  validateStateData = () => {
    let _data = [...this.state.data];
    let isSubtypeEmpty = false;
    let isSubtypeValueMissing = false;
    let isROIValueMissing = false;
    let _isROINameunique = false;
    for (let i = 0; i < _data.length; i++) {
      if (!_data[i].roiName) {
        isROIValueMissing = true;
        _data[i].isROINameEmpty = true;
      } else {
        if (_data[i].isROINameunique) {
          _isROINameunique = true;
        }
      }

      if (!_data[i].subtype) {
        isSubtypeEmpty = true;
        _data[i].isSubtypeEmpty = true;
      }
      let _subElements = _data[i].elements;
      if (_subElements) {
        for (let j = 0; j < _subElements.length; j++) {
          if (_subElements[j].required) {
            if (_subElements[j].type === "time") {
              if (_subElements[j].value === "0:0:0") {
                _subElements[j].error = true;
                isSubtypeValueMissing = true;
              }
            } else if (_subElements[j].type === "counter") {
              if (_subElements[j].value === "0") {
                if (_subElements[j].options[0] != "0") {
                  _subElements[j].error = true;
                  isSubtypeValueMissing = true;
                }
              }
            } else {
              if (!_subElements[j].value.length) {
                _subElements[j].error = true;
                isSubtypeValueMissing = true;
              }
            }
          }
        }
      }
    }

    this.setState({ data: _data });
    if (isROIValueMissing) {
      this.setState({
        showErrorModal: {
          ...this.state.showErrorModal,
          showPop: true,
          msg: "ROI Name is required.",
          type: "alert",
          header: "",
        },
      });
      this.resetModal();
      isSubtypeEmpty = false;
      return true;
    }

    if (_isROINameunique) {
      this.setState({
        showErrorModal: {
          ...this.state.showErrorModal,
          showPop: true,
          msg: "ROI Name should be unique.",
          type: "alert",
          header: "",
        },
      });
      this.resetModal();
      isSubtypeEmpty = false;
      return true;
    }

    if (isSubtypeEmpty) {
      this.setState({
        showErrorModal: {
          ...this.state.showErrorModal,
          showPop: true,
          msg: "Please fill the subtype and its respective value",
          type: "alert",
          header: "",
        },
      });
      this.resetModal();
      isSubtypeEmpty = false;
      return true;
    }

    if (isSubtypeValueMissing) {
      this.setState({
        showErrorModal: {
          ...this.state.showErrorModal,
          showPop: true,
          msg: "Please fill the required value",
          type: "alert",
          header: "",
        },
      });
      this.resetModal();
      isSubtypeValueMissing = false;
      return true;
    }
    return false;
  };

  drawFullROI = (idx) => {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let __data = [...this.state.data];
    __data[idx].radio = "FullROI";
    __data[idx].radioType = "FullROI";
    __data[idx].roicords = {
      x1: 1.765625,
      x2: 635.765625,
      x3: 638.765625,
      x4: 1.765625,
      y1: 2.421875,
      y2: 1.421875,
      y3: 477.421875,
      y4: 475.421875,
    };

    __data[idx].loicord = {
      InDirection: "A TO B",
      lineA: {},
    };

    let fullROI = [
      ...finalCord,
      {
        [__data[idx].cardName]: {
          roicords: {
            x1: 1.765625,
            x2: 638.765625,
            x3: 638.765625,
            x4: 1.765625,
            y1: 1.765625,
            y2: 1.765625,
            y3: 478.421875,
            y4: 478.421875,
          },
        },
      },
    ];
    console.log(__data[idx].cardName, fullROI);
    let keys = finalCord.flatMap((x) => Object.keys(x));
    console.log(keys.includes(__data[idx].cardName));
    if (!keys.includes(__data[idx].cardName)) {
      finalCord = [...fullROI];
    } else {
      let indexx = keys.indexOf(__data[idx].cardName);
      console.log(indexx);
      if (indexx >= 0) {
        finalCord[indexx][__data[idx].cardName] = {
          roicords: {
            x1: 1.765625,
            x2: 638.765625,
            x3: 638.765625,
            x4: 1.765625,
            y1: 1.765625,
            y2: 1.765625,
            y3: 478.421875,
            y4: 478.421875,
          },
        };
      }
    }

    this.setState(
      {
        data: __data,
        dots: 4,
        radio: "FullROI",
        LOIcord1: [],
        lines: 0,
        ROIcord: [
          { x: 1.765625, y: 1.765625 },
          { x: 638.765625, y: 1.765625 },
          { x: 638.765625, y: 478.421875 },
          { x: 1.765625, y: 478.421875 },
        ],
        finalCoordinates: [...finalCord],
      },
      () => this.getDeveloperSettings()
    );
  };

  verifyCardDetail = () => {
    if (!this.validateStateData()) {
      if (this.state.data.length === 0 && this.state.dots === 0) {
        dataCount += 1;
        this.setState({
          data: [
            ...this.state.data,
            {
              loicord: { InDirection: "A TO B", lineA: {} },
              roicords: {},
              roiName: "",
              isOpen: true,
              radio: "ROI",
              cardName: "roi" + Number(dataCount),
              subtype: "",
              isROINameEmpty: false,
              isROINameunique: false,
              isSubtypeEmpty: false,
              radioType: "ROI",
            },
          ],
          activeCardIndex: this.state.activeCardIndex + 1,
          radio: "ROI",
          ROIcord: [],
          LOIcord1: [],
          lines: 0,
          dots: 0,
          direction: "A TO B",
          finalCoordinates: [],
          selectedCard: "roi" + Number(dataCount),
        });
      } else {
        if (this.state.dots !== 4) {
          this.setState({
            showErrorModal: {
              ...this.state.showErrorModal,
              showPop: true,
              msg: "Please draw atleast 4 points to add new card!",
              type: "alert",
              header: "",
            },
          });
          this.resetModal();
        } else {
          dataCount += 1;
          this.setState(
            {
              data: [
                ...this.state.data,
                {
                  loicord: { InDirection: "A TO B", lineA: {} },
                  roicords: {},
                  roiName: "",
                  isOpen: true,
                  radio: "ROI",
                  cardName: "roi" + Number(dataCount),
                  subtype: "",
                  isROINameEmpty: false,
                  isROINameunique: false,
                  isSubtypeEmpty: false,
                  radioType: "ROI",
                },
              ],
              radio: "ROI",
              ROIcord: [],
              LOIcord1: [],
              lines: 0,
              dots: 0,
              direction: "A TO B",
              finalCoordinates: [],
              selectedCard: "roi" + Number(dataCount),
            },
            () => {
              this.setState({ activeCardIndex: this.state.data.length - 1 });
            }
          );
        }
      }
    }
  };

  getSubtypes = (type) => {
    axiosApiInstance
      .post("service/settings", {
        serviceId: type,
      })
      .then((res) => {
        this.setState({ SubTypes: res.data.detail }, () => {
          if (this.state.SubTypes.length > 0) {
            dataCount = this.state.SubTypes.length;
          }
          if (window.location.href.includes("update")) {
            isUpdate = true;
          } else {
            isUpdate = false;
          }

          this.getROILOI(type);
          // } else {
          //   this.setState({ isLoading: false });
          // }
        });
      });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedCard != this.state.selectedCard) {
      let _data = [...this.state.data];
      for (let i = 0; i < _data.length; i++) {
        // //console.log(_data[i].cardName + "===" + this.state.selectedCard);
        if (_data[i].cardName === this.state.selectedCard) {
          _data[i].isOpen = true;
        } else {
          _data[i].isOpen = false;
        }
      }
      this.setState({ data: _data });
    }
    if (prevState.isLoading != this.state.isLoading) {
      const canvas = document.getElementById("canvas");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.lineCap = "round";
        ctx.lineWidth = 5;
      }
      console.log(this.props);
    }

    if (prevState.counter !== this.state.counter) {
      counterTimeout = setTimeout(() => {
        this.setState({ counter: this.state.counter - 1 }, () => {
          if (this.state.counter <= 0) {
            this.setState({ isLoading: true });
            clearTimeout(counterTimeout);
            sessionStorage.removeItem("timer");
            axiosApiInstance
              .get("camera/finish_configure")
              .then((res) => {
                this.props.history.push("/camera");
              })
              .catch((err) => err.response);
          }
        });
        // setCounter(counter - 1);
        sessionStorage.setItem("timer", this.state.counter - 1);
      }, 1000);
    }

    if (prevState.data !== this.state.data) {
      console.log(this.state);
    }
  }

  handleDynamicInputText = (e, isNumber, index, ele_index, label) => {
    let _data = [...this.state.data];
    if (isNumber) {
      if (isNaN(e.target.value)) {
        return;
      }
      const onlyNums = e.target.value.replace(/[^0-9]/g, "");
      _data[this.state.activeCardIndex][e.target.name] = onlyNums;
      _data[this.state.activeCardIndex].elements[ele_index].value =
        e.target.value;
    } else {
      if (e?.target?.name) {
        if (
          _data[this.state.activeCardIndex].elements[ele_index].type === "radio"
        ) {
          _data[this.state.activeCardIndex][label] = e.target.value;
          _data[this.state.activeCardIndex].elements[ele_index].value =
            e.target.value;
        } else {
          _data[this.state.activeCardIndex][e.target.name] = e.target.value;
          _data[this.state.activeCardIndex].elements[ele_index].value =
            e.target.value;
        }
      } else {
        _data[this.state.activeCardIndex][e] = index;
        _data[this.state.activeCardIndex].elements[ele_index].value = index;
      }
    }
    _data[this.state.activeCardIndex].elements[ele_index].error = false;
    this.setState({ data: _data });
  };

  handleDynamicCheckbox = (e, isNumber, index, ele_index, label) => {
    let _data = [...this.state.data];
    if (!_data[this.state.activeCardIndex][label]) {
      _data[this.state.activeCardIndex][label] = [];
    }

    if (_data[this.state.activeCardIndex][label].length >= 0) {
      if (_data[this.state.activeCardIndex][label].includes(e.target.value)) {
        let indexx = _data[this.state.activeCardIndex][label].indexOf(
          e.target.value
        );
        _data[this.state.activeCardIndex][label].splice(indexx, 1);
      } else {
        _data[this.state.activeCardIndex][label].push(e.target.value);
      }
    }
    _data[this.state.activeCardIndex].elements[ele_index].value =
      _data[this.state.activeCardIndex][label];

    this.setState({ data: _data });
  };
  minmax = (value, min, max) => {
    if (parseInt(value) > max) return max;
    else if (!value) return "0";
    else return parseInt(value);
  };
  handleDynamicCounter = (e, index, ele_index, label, type, options) => {
    let _data = [...this.state.data];

    if (type === "input") {
      if (isNaN(e.target.value)) {
        return;
      }
      const onlyNums = e.target.value.replace(/[^0-9]/g, "");
      _data[this.state.activeCardIndex][label] = this.minmax(
        onlyNums,
        options[0],
        options[1]
      ).toString();
      _data[this.state.activeCardIndex].elements[ele_index].value = this.minmax(
        onlyNums,
        options[0],
        options[1]
      ).toString();
    } else {
      if (e === "increment") {
        if (Number(_data[this.state.activeCardIndex][label]) == options[1]) {
          return;
        }
        let _add = _data[this.state.activeCardIndex][label];
        _add++;
        _add = _add.toString();
        _data[this.state.activeCardIndex][label] = _add;
        _data[this.state.activeCardIndex].elements[ele_index].value = _add;
      } else {
        if (Number(_data[this.state.activeCardIndex][label]) == options[0]) {
          return;
        }
        let _sub = _data[this.state.activeCardIndex][label];
        _sub--;
        _sub = _sub.toString();

        _data[this.state.activeCardIndex][label] = _sub;

        //
        _data[this.state.activeCardIndex].elements[ele_index].value = _sub;
      }
    }
    _data[this.state.activeCardIndex].elements[ele_index].error = false;
    this.setState({ data: [..._data] });
  };

  handleDynamicTime = (e, index, ele_index, label, type, options, idx) => {
    let _data = [...this.state.data];
    let _split = _.cloneDeep(
      _data[this.state.activeCardIndex][label].split(":")
    );
    if (type === "input") {
      if (isNaN(e.target.value)) {
        return;
      }
      const onlyNums = e.target.value.replace(/[^0-9]/g, "");
      if (idx === 0) {
        _split[idx] = onlyNums.toString();
        let __split = _split.join(":");
        _data[this.state.activeCardIndex][label] = __split;
        _data[this.state.activeCardIndex].elements[ele_index].value = __split;
      } else {
        _split[idx] = this.minmax(onlyNums, 0, 60).toString();
        let __split = _split.join(":");
        _data[this.state.activeCardIndex][label] = __split;
        _data[this.state.activeCardIndex].elements[ele_index].value = __split;
      }
    } else {
      if (e === "increment") {
        if (idx === 1 || idx === 2) {
          if (Number(_split[idx]) === 60) {
            return;
          }
        }

        let _add = _split[idx];
        _add++;
        _add = _add.toString();
        _split[idx] = _add;
        let __split = _split.join(":");
        _data[this.state.activeCardIndex][label] = __split;
        _data[this.state.activeCardIndex].elements[ele_index].value = __split;
      } else {
        if (idx === 0) {
          if (Number(_split[idx]) === 0) {
            return;
          }
        } else {
          if (_split[idx] == 0) {
            _split[idx] = 60;
          }
        }
        let _add = _split[idx];
        _add--;
        _add = _add.toString();
        _split[idx] = _add;
        let __split = _split.join(":");
        _data[this.state.activeCardIndex][label] = __split;
        _data[this.state.activeCardIndex].elements[ele_index].value = __split;
      }
    }
    _data[this.state.activeCardIndex].elements[ele_index].error = false;
    this.setState({ data: [..._data] });
  };

  removePreviousSelectedValue = () => {
    let _data = [...this.state.data];
    for (let i = 0; i < this.state.SubTypes.length; i++) {
      if (
        _data[this.state.activeCardIndex].subtype !==
        this.state.SubTypes[i].subType
      ) {
        for (let j = 0; j < this.state.SubTypes[i].elements.length; j++) {
          delete _data[this.state.activeCardIndex][
            this.state.SubTypes[i].elements[j].label
          ];
        }
      }
    }
    this.setState({ data: _data });
  };

  removeCard = (item, idx) => {
    let _data = [...this.state.data];
    let copiedIDX = idx;
    let _index = 0;
    _data.splice(idx, 1);

    if (_data.length === 0) {
      idx = -1;
      _index = -1;
    } else {
      if (idx === 0) {
        idx = 0;
        _index = _data[0].cardName;
      } else {
        _index = _data[idx - 1].cardName;
        idx = idx - 1;
      }
    }

    this.setState(
      {
        data: _data,
        activeCardIndex: idx,
        selectedCard: idx === -1 ? "" : _index,
      },
      () => this.handleRedrawCanvas(copiedIDX, idx)
    );
  };

  handleRedrawCanvas = (idx, newIDX) => {
    console.log(idx, newIDX);
    finalCord.splice(idx, 1);
    if (newIDX !== -1) {
      let _data = [...this.state.data];
      _data[newIDX].radio = _data[newIDX].radioType;
      let isLOIDrawn = false;
      let _LOIcord1 = [];
      if (Object.keys(_data[newIDX].loicord.lineA).length > 0) {
        isLOIDrawn = true;
        let _line = { ..._data[newIDX].loicord.lineA };
        let obj = {
          x: _line.x1,
          x1: _line.x2,
          y: _line.y1,
          y1: _line.y2,
        };
        _LOIcord1.push(obj);
      }
      this.setState({
        dots: 4,
        lines: isLOIDrawn ? 1 : 0,
        LOIcord1: _LOIcord1,
        data: _data,
      });
    } else {
      finalCord = [];
      this.setState({
        dots: 0,
        lines: 0,
        LOIcord1: [],
        radio: "",
        data: [],
        selectedCard: "",
        ROIcord: [],
      });
    }

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var ctx = document.getElementById("canvas").getContext("2d");
    ctx.fillStyle = "#ff2626"; // Red color

    this.getDeveloperSettings();
  };

  postData = () => {
    let dataROI = [];
    if (this.state.dots !== 0) {
      if (this.state.dots !== 4) {
        this.setState({
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Please add atleast one card with details.",
            type: "alert",
            header: "",
          },
        });
        this.resetModal();
        return;
      }

      if (this.validateStateData()) {
        //console.log("missing");
        return;
      }
    }
    if (!isUpdate) {
      if (this.state.data.length === 0) {
        this.setState({
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Please add atleast one card with details.",
            type: "alert",
            header: "",
          },
        });
        this.resetModal();
        return;
      }
    }

    for (let i = 0; i < this.state.data.length; i++) {
      let keys = Object.keys(this.state.data[i].roicords);
      //console.log(keys.length);
      if (keys.length < 8) {
        dataROI.push(true);
      }
    }

    if (dataROI.length > 0) {
      this.setState({
        showErrorModal: {
          ...this.state.showErrorModal,
          showPop: true,
          msg: "Please Draw ROI/LOI",
          type: "alert",
          header: "",
        },
      });
      this.resetModal();
      return;
    }
    this.setState({ dataCopy: [...this.state.data] }, () => {
      let _dataa = [...this.state.dataCopy];
      let body = {};
      let dataSubtypes = _dataa.map((item) => item.subtype);
      dataSubtypes = [...new Set(dataSubtypes)];
      //console.log(dataSubtypes);
      for (let i = 0; i < dataSubtypes.length; i++) {
        body[dataSubtypes[i]] = {};
      }

      for (let i = 0; i < _dataa.length; i++) {
        const _subType = _dataa[i].subtype;
        delete _dataa[i].cardName;
        delete _dataa[i].elements;
        delete _dataa[i].isROINameEmpty;
        delete _dataa[i].isROINameunique;
        delete _dataa[i].isSubtypeEmpty;
        delete _dataa[i].radio;
        delete _dataa[i].subtype;
        delete _dataa[i].isOpen;
        body[_subType]["roi" + Number(Object.keys(body[_subType]).length + 1)] =
          {
            ..._dataa[i],
          };
      }
      //console.log(_dataa);
      //console.log(body);
      const authResult = new URLSearchParams(window.location.search);
      const sType = authResult.get("service");
      let resBody = {
        CameraID: "",
        ServiceID: sType,
        UseCaseSettings: body,
      };
      //console.log(isUpdate);

      if (isUpdate === true) {
        resBody.CameraID = this.props.match.params.id;
      } else {
        const cType = authResult.get("cameraID");
        //console.log(authResult);
        resBody.CameraID = cType;
      }
      const sdfs = authResult.get("cameraID");
      //console.log(this.props.match.params.id, sdfs);
      //console.log(resBody);
      this.setState({ isLoadingScreen: true });

      setTimeout(() => {
        this.props.handleConfigData(resBody);
        this.setState({
          isLoadingScreen: false,
          showErrorModal: {
            ...this.state.showErrorModal,
            showPop: true,
            msg: "Configuration added successfully!",
            type: "success",
            header: "Success",
          },
        });
        var url = new URL(window.location.href);
        //console.log(url);
        const params = new URLSearchParams(window.location.search);
        params.delete("service");
        //console.log(params.toString());
        var url = window.location.pathname + "?" + params.toString();
        window.history.pushState(null, null, url);
        this.props.handleBack();
      }, 3000);
    });
  };

  drawROILOICARD = (_res) => {
    let _data = [...this.state.data];
    let _usecaseKey = Object.keys(_res);
    for (let i = 0; i < _usecaseKey.length; i++) {
      let iKey = Object.keys(_res[_usecaseKey[i]]);
      for (let j = 0; j < iKey.length; j++) {
        let obj = {
          ..._res[_usecaseKey[i]][iKey[j]],
          cardName: "roi" + Number(_data.length + 1),
          isOpen: _data.length === 0 ? true : false,
          isROINameEmpty: false,
          isROINameunique: false,
          radio: "ROI",
          isSubtypeEmpty: false,
          subtype: _usecaseKey[i],
        };
        _data.push(obj);
      }
    }
    let fc = [];
    let isLOIDrawn = true;
    let _LOIcord1 = [];
    const { SubTypes } = this.state;
    for (let i = 0; i < _data.length; i++) {
      for (let j = 0; j < SubTypes.length; j++) {
        if (_data[i].subtype === SubTypes[j].subType) {
          _data[i].elements = [...SubTypes[j].elements];
        }
      }
      for (let k = 0; k < _data[i].elements.length; k++) {
        _data[i].elements[k].value = _data[i][_data[i].elements[k].label];
        _data[i].elements[k].error = false;
      }
      let obj = {};
      obj[_data[i].cardName] = {
        roicords: _data[i].roicords,
        loicord: { ..._data[i].loicord },
      };
      if (Object.keys(obj[_data[i].cardName].loicord.lineA).length === 0) {
        if (i === 0) {
          isLOIDrawn = false;
        }
        delete obj[_data[i].cardName].loicord;
      } else {
        if (i === 0) {
          let _line = { ..._data[i].loicord.lineA };
          let obj = {
            x: _line.x1,
            x1: _line.x2,
            y: _line.y1,
            y1: _line.y2,
          };
          _LOIcord1.push(obj);
        }
      }
      fc.push(obj);
      if (!_data[i].loicord) {
        _data[i].loicord = { InDirection: "A TO B", lineA: {} };
      }
      // //console.log(_data[i].loicord);
    }
    let _obj = [
      {
        x: _data[0].roicords.x1,
        y: _data[0].roicords.y1,
      },
      {
        x: _data[0].roicords.x2,
        y: _data[0].roicords.y2,
      },
      {
        x: _data[0].roicords.x3,
        y: _data[0].roicords.y3,
      },
      {
        x: _data[0].roicords.x4,
        y: _data[0].roicords.y4,
      },
    ];

    finalCord = [...fc];
    this.setState(
      {
        data: _data,
        activeCardIndex: 0,
        selectedCard: _data[0].cardName,
        radio: "ROI",
        dots: 4,
        lines: isLOIDrawn ? 1 : 0,
        LOIcord1: _LOIcord1,
        ROIcord: [..._obj],
        isLoading: false,
      },
      () => this.getDeveloperSettings()
    );
  };

  getROILOI = (ServiceID) => {
    let camID = this.props.match.params.id;
    const authResult = new URLSearchParams(window.location.search);
    const cType = authResult.get("cameraID");
    if (!camID) {
      camID = cType;
    }
    axiosApiInstance
      .get(
        "camera/modules/usecase/settings?CameraID=" +
          camID +
          "&ServiceID=" +
          ServiceID
      )
      .then((res) => {
        let _res = {};
        _res = { ...res.data };
        this.drawROILOICARD(_res);
      })
      .catch((err) => {
        if (this.props.configData) {
          for (let i = 0; i < this.props.configData.length; i++) {
            if (ServiceID === this.props.configData[i].ServiceID) {
              this.drawROILOICARD(this.props.configData[i].UseCaseSettings);
            }
          }
        }
        this.setState({ isLoading: false });
      });
  };

  btnHandleBack = () => {
    clearTimeout(counterTimeout);
    sessionStorage.removeItem("timer");
    // this.props.handleHistory("App Scheduler");
    var url = new URL(window.location.href);
    const params = new URLSearchParams(window.location.search);
    params.delete("service");
    var url = window.location.pathname + "?" + params.toString();
    window.history.pushState(null, null, url);
    this.props.handleBack();
  };

  render() {
    const { canvasImage } = this.state;
    return (
      <motion.div
        variants={xMotion}
        exit="exit"
        initial="hidden"
        animate="visible"
        className="_app_config_details_"
      >
        <p className="config_counter">
          Time Remaining:
          <span
            id="s_timer"
            style={{ color: this.state.counter < 60 ? "red" : null }}
          >
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
        <BoxCard
          className="config_container"
          isLoading={this.state.isLoading}
          id="config_container_card"
        >
          <BoxCard className="card_size">
            <canvas
              id="canvas"
              width="640px"
              height="480px"
              style={{
                backgroundImage: `url(${SOCKET_URL + canvasImage})`,
                marginLeft: "0px !important",
              }}
              onClick={
                this.state.radio === "ROI"
                  ? (e) => this.handleClick(e)
                  : this.state.radio == ""
                  ? () => {
                      this.setState({
                        showErrorModal: {
                          ...this.state.showErrorModal,
                          showPop: true,
                          msg: "Please select what you want to draw ROI/LOI.?",
                          type: "alert",
                          header: "",
                        },
                      });
                      this.resetModal();
                    }
                  : null
              }
              onMouseDown={
                this.state.radio === "LOI"
                  ? (e) => this.handleMouseDown(e)
                  : null
              }
              onMouseUp={
                this.state.radio === "LOI" ? (e) => this.handleMouseUp(e) : null
              }
            ></canvas>
          </BoxCard>
          <div style={{ flex: 1 }}>
            <Button
              type="gradient"
              name="Add New ROI/LOI"
              onClick={this.verifyCardDetail}
              style={{
                marginTop: "0.5vw",
                marginBottom: "1vw",
                marginLeft: "1.8vw",
              }}
            />

            <Scrollbars style={{ height: "63vh" }}>
              <div className="config_card_container">
                {this.state.data.map((item, index) => (
                  <ConfigCard
                    isUpdate={isUpdate}
                    key={item.cardName}
                    region={item.radio}
                    SubtypeOptions={this.state.SubTypes}
                    handleRemoveCard={() => this.removeCard(item, index)}
                    onHeaderClick={() => {
                      if (this.state.dots === 4) {
                        if (!this.validateStateData()) {
                          let _data = [...this.state.data];
                          let isLOIDrawn = false;
                          if (
                            Object.keys(_data[index].loicord.lineA).length > 0
                          ) {
                            isLOIDrawn = true;
                          }
                          _data[index].radio = _data[index].radioType;
                          let _obj = [
                            {
                              x: _data[index].roicords.x1,
                              y: _data[index].roicords.y1,
                            },
                            {
                              x: _data[index].roicords.x2,
                              y: _data[index].roicords.y2,
                            },
                            {
                              x: _data[index].roicords.x3,
                              y: _data[index].roicords.y3,
                            },
                            {
                              x: _data[index].roicords.x4,
                              y: _data[index].roicords.y4,
                            },
                          ];
                          //console.log(isLOIDrawn);
                          this.setState({
                            dots: 4,
                            selectedCard: _data[index].cardName,
                            activeCardIndex: index,
                            lines: isLOIDrawn ? 1 : 0,
                            radio: _data[index].radioType,
                            ROIcord: [..._obj],
                            // LOIcord1: [{ ..._data[index].loicord.lineA }],
                            LOIcord1:
                              Object.keys(_data[index].loicord.lineA).length > 0
                                ? [{ ..._data[index].loicord.lineA }]
                                : [],
                          });
                        }
                      } else {
                        this.setState({
                          showErrorModal: {
                            ...this.state.showErrorModal,
                            showPop: true,
                            msg: "Please draw atleast 4 points to Switch or delete the card.",
                            type: "alert",
                            header: "",
                          },
                        });
                        this.resetModal();
                      }
                    }}
                    disabledLOI={this.state.dots !== 4}
                    radioClick={(data) => {
                      // if (this.state.dots === 4 || this.state.dots === 0) {
                      if (data === "FullROI") {
                        this.drawFullROI(index);
                      } else {
                        if (data === "ROI") {
                          var canvas = document.getElementById("canvas");
                          var ctx = canvas.getContext("2d");
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          let res = finalCord.flatMap((x) => Object.keys(x));
                          console.log(res);
                          res.map((items, index) => {
                            if (items === item.cardName) {
                              finalCord[index] = { [item.cardName]: {} };
                            }
                          });
                          let _data = [...this.state.data];
                          _data[index].radio = data;
                          _data[index].radioType = data;
                          _data[index].roicords = {};
                          _data[index].loicord = {
                            InDirection: "A TO B",
                            lineA: {},
                          };
                          this.setState(
                            {
                              dots: 0,
                              lines: 0,
                              ROIcord: [],
                              LOIcord1: [],
                              data: _data,
                              radio: data,
                              activeCardIndex: index,
                              finalCoordinates: [...finalCord],
                            },
                            () => this.getDeveloperSettings()
                          );
                        } else {
                          let _data = [...this.state.data];
                          _data[index].radio = data;
                          this.setState({
                            data: _data,
                            radio: data,
                            activeCardIndex: index,
                          });
                        }
                      }
                    }}
                    roiNameChange={(e) => {
                      let _data = [...this.state.data];
                      _data[index].isROINameEmpty = false;
                      _data[index].roiName = e.target.value;
                      if (_data.length > 1) {
                        for (let i = 0; i < _data.length; i++) {
                          if (i !== index) {
                            if (_data[i].roiName === _data[index].roiName) {
                              _data[index].isROINameunique = true;
                            } else {
                              _data[index].isROINameunique = false;
                            }
                          }
                        }
                      }
                      this.setState({
                        data: _data,
                      });
                    }}
                    isOpen={item.isOpen}
                    roiName={item.roiName}
                    roiError={item.isROINameEmpty}
                    roiError2={item.isROINameunique}
                    subtypeError={item.isSubtypeEmpty}
                    directionChange={(res) => {
                      let _data = [...this.state.data];
                      _data[index].loicord.InDirection = res;
                      this.setState({
                        data: _data,
                        direction: res,
                      });
                    }}
                    onReset={() => this.handleCanvasReset(item.cardName, index)}
                    handleTextFieldInput={this.handleDynamicInputText}
                    handleSubtypeChange={(value, idx) => {
                      //console.log(this.state.activeCardIndex, value, idx);
                      let _data = [...this.state.data];
                      if (value !== _data[this.state.activeCardIndex].subtype) {
                        _data[this.state.activeCardIndex].subtype = value;
                      }
                      let _elements = this.state.SubTypes[idx].elements;
                      _data[this.state.activeCardIndex].elements = _elements;
                      for (let elemE of _data[this.state.activeCardIndex]
                        .elements) {
                        elemE.error = false;
                        if (elemE.type === "checkbox") {
                          elemE.value = [];
                          _data[this.state.activeCardIndex][elemE.label] = [];
                        } else {
                          if (elemE.type === "time") {
                            elemE.value = "0:0:0";
                            _data[this.state.activeCardIndex][elemE.label] =
                              "0:0:0";
                          } else if (elemE.type === "counter") {
                            elemE.value = "0";
                            _data[this.state.activeCardIndex][elemE.label] =
                              "0";
                          } else {
                            elemE.value = "";
                            _data[this.state.activeCardIndex][elemE.label] = "";
                          }
                        }
                      }
                      _data[this.state.activeCardIndex].isSubtypeEmpty = false;
                      this.setState(
                        {
                          data: _data,
                        },
                        this.removePreviousSelectedValue
                      );
                    }}
                    handleCheckboxInput={this.handleDynamicCheckbox}
                    overallData={this.state.data[this.state.activeCardIndex]}
                    handleCounter={this.handleDynamicCounter}
                    handleTime={this.handleDynamicTime}
                  />
                ))}
              </div>
            </Scrollbars>
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
              disabled={this.state.isLoading}
              onClick={() => {
                clearTimeout(counterTimeout);
                sessionStorage.removeItem("timer");

                // this.props.handleHistory("App Scheduler");
                var url = new URL(window.location.href);
                const params = new URLSearchParams(window.location.search);
                params.delete("service");
                //console.log(params.toString());
                var url = window.location.pathname + "?" + params.toString();
                window.history.pushState(null, null, url);
                this.props.handleBack();
              }}
              name="Back"
            />
            <Button
              style={{ width: "6vw", marging: "0 2.5vw" }}
              onClick={this.postData}
              disabled={this.state.isLoading}
              type="gradient"
              name="Submit"
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

const ConfigCard = ({
  radioClick,
  region,
  roiNameChange,
  roiName,
  directionChange,
  onReset,
  onHeaderClick,
  isOpen,
  disabledLOI,
  SubtypeOptions,
  handleSubtypeChange,
  handleTextFieldInput,
  handleCheckboxInput,
  handleCounter,
  overallData,
  roiError,
  roiError2,
  subtypeError,
  handleRemoveCard,
  handleTime,
}) => {
  const [options, setOptions] = useState(["A TO B", "B TO A"]);
  const [Suboptions, setSubOptions] = useState([]);
  const [selectedSub, setselectedSub] = useState("");

  useEffect(() => {
    if (SubtypeOptions.length) {
      let _options = SubtypeOptions.map((item) => item.subType);
      setSubOptions(_options);
      if (isUpdate) {
        //console.log(overallData);
        setselectedSub(overallData.subtype);
      }
    }
  }, [SubtypeOptions, overallData]);

  const getFormElement = (element, index, ele_index) => {
    //console.log(overallData.elements);
    if (!overallData.elements) {
      return;
    } else {
      //console.log(overallData);
      if (element.type === "text" || element.type === "input") {
        return (
          <InputBox
            header={element.required ? element.label + "*" : element.label}
            // error={element.error}
            error={overallData?.elements[ele_index]?.error}
            name={element.label}
            // label={element.label}
            onChange={(e) =>
              handleTextFieldInput(e, element.isNumber, index, ele_index)
            }
            value={
              overallData[element.label]?.length > 0
                ? overallData[element.label]
                : ""
            }
            //  value={element.value?.length > 0 ? element.value : ""}
          />
        );
      }
      if (element.type === "select") {
        return (
          <Dropdown
            name={element.label}
            handleOption={(data) => {
              handleTextFieldInput(
                element.label,
                element.isNumber,
                data,
                ele_index
              );
            }}
            error={overallData?.elements[ele_index].error}
            // label={element?.label}
            label={element.required ? element.label + "*" : element.label}
            optionsList={element?.options}
            defaultText={
              overallData[element.label]?.length > 0
                ? overallData[element.label]
                : ""
            }
            id={element?.elementName}
            //  error={element.error}
            //  onChange={(e) => {
            //    handleTextFieldInput(e, element.isNumber, index, ele_index);
            //    handleBlur(index, ele_index);
            //  }}
            // options={element.options}
            // value={element.value?.length > 0 ? element.value : ""}
          />
        );
      }
      if (element.type === "radio") {
        return (
          <div>
            {element?.label && (
              <label className="radio_label">
                {element.required ? element.label + "*" : element.label}:
              </label>
            )}
            {element?.options.map((item) => (
              <Radio
                namee={item}
                key={item}
                name={item}
                value={item}
                id={"radio_" + Math.random().toString(36).substr(2, 11)}
                // defaultChecked
                checked={overallData[element.label]?.includes(item)}
                onClick={(e) => {
                  handleTextFieldInput(
                    e,
                    element.isNumber,
                    index,
                    ele_index,
                    element.label
                  );
                }}
              />
            ))}
          </div>
        );
      }
      if (element.type === "counter") {
        return (
          <div>
            <Counter
              label={element.label}
              required={element.required}
              handleDecrement={() =>
                handleCounter(
                  "decrement",
                  index,
                  ele_index,
                  element.label,
                  "button",
                  element.options
                )
              }
              handleIncrement={() =>
                handleCounter(
                  "increment",
                  index,
                  ele_index,
                  element.label,
                  "button",
                  element.options
                )
              }
              value={element.value ? element.value : "0"}
              handleInput={(e) =>
                handleCounter(
                  e,
                  index,
                  ele_index,
                  element.label,
                  "input",
                  element.options
                )
              }
            />
          </div>
        );
      }
      if (element.type === "time") {
        const renderValue = (idx) => {
          let _split = element.value.split(":");
          return _split[idx];
        };
        return (
          <div>
            {element?.label && (
              <label className="radio_label">
                {element.required ? element.label + "*" : element.label}:
              </label>
            )}
            <div
              style={{
                display: "flex",
                gap: "1vw",
                marginTop: "0.3vw",
                flexWrap: "wrap",
              }}
            >
              <Counter
                required={element.required}
                handleDecrement={() =>
                  handleTime(
                    "decrement",
                    index,
                    ele_index,
                    element.label,
                    "button",
                    element.options,
                    0
                  )
                }
                handleIncrement={() =>
                  handleTime(
                    "increment",
                    index,
                    ele_index,
                    element.label,
                    "button",
                    element.options,
                    0
                  )
                }
                value={renderValue(0)}
                handleInput={(e) =>
                  handleTime(
                    e,
                    index,
                    ele_index,
                    element.label,
                    "input",
                    element.options,
                    0
                  )
                }
                sub={"Hr"}
              />
              <Counter
                // label={element.label}
                required={element.required}
                handleDecrement={() =>
                  handleTime(
                    "decrement",
                    index,
                    ele_index,
                    element.label,
                    "button",
                    element.options,
                    1
                  )
                }
                handleIncrement={() =>
                  handleTime(
                    "increment",
                    index,
                    ele_index,
                    element.label,
                    "button",
                    element.options,
                    1
                  )
                }
                value={renderValue(1)}
                handleInput={(e) =>
                  handleTime(
                    e,
                    index,
                    ele_index,
                    element.label,
                    "input",
                    element.options,
                    1
                  )
                }
                sub={"Mins"}
              />
              <Counter
                required={element.required}
                handleDecrement={() =>
                  handleTime(
                    "decrement",
                    index,
                    ele_index,
                    element.label,
                    "button",
                    element.options,
                    2
                  )
                }
                handleIncrement={() =>
                  handleTime(
                    "increment",
                    index,
                    ele_index,
                    element.label,
                    "button",
                    element.options,
                    2
                  )
                }
                value={renderValue(2)}
                handleInput={(e) =>
                  handleTime(
                    e,
                    index,
                    ele_index,
                    element.label,
                    "input",
                    element.options,
                    2
                  )
                }
                sub={"Sec"}
              />
            </div>
          </div>
        );
      }
    }

    if (element.type === "checkbox") {
      return (
        <div style={{ display: "flex", margin: "5px 0" }}>
          {element.label && (
            <label className="radio_label">
              {element.required ? element.label + "*" : element.label}:
            </label>
          )}
          <div style={{ marginLeft: "0.5vw" }}>
            {element.options.map((item) => (
              <label className="checkbox_wrapper">
                <input
                  className="dynamic_checkbox"
                  type="checkbox"
                  key={item}
                  name={item}
                  value={item}
                  // value={optn}
                  // checked={value?.includes(optn)}
                  onChange={(e) => {
                    handleCheckboxInput(
                      e,
                      element.isNumber,
                      index,
                      ele_index,
                      element.label
                    );
                  }}
                />
                {item}
              </label>
            ))}
          </div>
        </div>
      );
    }
  };
  return (
    <BoxCard className="config_card">
      <div className="config_header">
        {!isOpen && <div className="header_cover" onClick={onHeaderClick} />}
        <Radio
          // checked={false}
          name="Region of Interest"
          onClick={() => {
            if (isOpen) {
              radioClick("ROI");
            }
          }}
          namee="group1"
          checked={region === "ROI"}
          id={"radio_1" + Math.random().toString(36).substring(2, 5)}
        />
        <Radio
          // checked={false}
          name="Full Region"
          onClick={() => {
            if (isOpen) {
              radioClick("FullROI");
            }
          }}
          namee="group1"
          checked={region === "FullROI"}
          id={"radio_3" + Math.random().toString(36).substring(2, 5)}
        />
        <Radio
          // checked={false}
          name="Line of Interest"
          onClick={() => {
            if (isOpen) {
              radioClick("LOI");
            }
          }}
          id={"radio_2" + Math.random().toString(36).substring(2, 8)}
          namee="group1"
          checked={region === "LOI"}
          disabled={disabledLOI}
        />
        <Dropdown
          optionsList={options}
          handleOption={(data) => {
            if (isOpen) {
              directionChange(data);
            }
          }}
          // handleOption={(data) => {
          //   directionChange(data);
          // }}
          defaultText={options[0]}
          label=""
          id="loi"
          className="select_adjust"
        />
        <i onClick={handleRemoveCard} className="material-icons">
          delete
        </i>
        <i
          className="material-icons"
          onClick={() => {
            if (isOpen) {
              onReset();
            }
          }}
        >
          refresh
        </i>
        <i className="material-icons icons_adjust">expand_more</i>
      </div>
      {isOpen && (
        <div className="config_body">
          <InputBox
            id="roiName"
            header="Enter ROI Name"
            onChange={roiNameChange}
            error={roiError || roiError2}
            value={roiName}
            helperText={roiError2 && "Already Used"}
            // onFocus={() => setisEmpty(false)}
          />
          <Dropdown
            optionsList={Suboptions}
            handleOption={(data) => {
              const _index = Suboptions.indexOf(data);
              setselectedSub(data);
              handleSubtypeChange(data, _index);
            }}
            defaultText={selectedSub}
            label="Select Sub-Type*"
            id="subType"
            className="subType_adjust"
            error={subtypeError}
          />

          <div className="active-sub-item-container">
            {SubtypeOptions.map((item, index) => {
              if (item.subType === selectedSub) {
                return (
                  <div className="element-preview">
                    {item.elements.map((ele_item, ele_index) => (
                      <div className="sub-input" key={ele_item.elementName}>
                        {getFormElement(ele_item, index, ele_index)}
                      </div>
                    ))}
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
    </BoxCard>
  );
};
export default withRouter(AppConfiguration);

// this.setState({
//   showErrorModal: {
//     ...this.state.showErrorModal,
//     showPop: false,
//     msg: "",
//     type: "alert",
//     header: "",
//   },
// });

//TODO subtype value from parent

const FancyButton = ({ text }) => {
  return <button id="fancy_button">{text}</button>;
};

const FancyButton2 = ({ text, onClick }) => {
  return (
    <button id="fancy_button2" onClick={onClick}>
      {text}
    </button>
  );
};
