import React, { useState } from "react";
import "./sCard.scss";
let activeIDX = 0;
export default function ScheduleCard() {
  const time = [
    "12 am",
    "2 am",
    "4 am",
    "6 am",
    "8 am",
    "10 am",
    "12 pm",
    "2 pm",
    "4 pm",
    "6 pm",
    "8 pm",
    "10 pm",
  ];
  const [visibleTime, setVisibleTime] = useState(1);

  const enableScroll = () => {
    document.removeEventListener("wheel", preventDefault, false);
  };
  const disableScroll = () => {
    document.addEventListener("wheel", preventDefault, {
      passive: false,
    });
  };
  const preventDefault = (e) => {
    e = e || window.event;
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.returnValue = false;
  };
  return (
    <div className="_schedule_card_">
      <div className="sc_header">
        <h3>Use Case Schedule</h3>
        <div className="arrows">
          <i
            className="material-icons up"
            onClick={() => {
              if (activeIDX !== 0) {
                activeIDX -= 1;
                var myElement = document.querySelector("#time_" + activeIDX);
                var topPos = myElement.offsetTop;
                document.querySelector(".time_line").scrollTop = topPos;
              }
            }}
          >
            arrow_forward_ios
          </i>
          <i
            className="material-icons down"
            onClick={() => {
              if (activeIDX !== 9) {
                activeIDX += 1;
                var myElement = document.querySelector("#time_" + activeIDX);
                var topPos = myElement.offsetTop;
                document.querySelector(".time_line").scrollTop = topPos;
              }
            }}
          >
            arrow_forward_ios
          </i>
        </div>
      </div>

      <div
        className="time_line_wrapper"
        onMouseEnter={disableScroll}
        onMouseLeave={enableScroll}
      >
        <ul className="time_line">
          {time.map((item, idx) => (
            <li className="time_" id={"time_" + idx} key={item}>
              <p className="text_">{item}</p>
              <div className="line">
                <div className="counts">
                  <i
                    className="mdi mdi-clock-time-eleven-outline"
                    //   className={
                    //     stat_icon
                    //       ? "mdi adjust_mdi " + stat_icon
                    //       : "mdi adjust_mdi mdi-alert-circle"
                    //   }
                  ></i>
                  <div className="cam_usecase">
                    <div className="flex_">
                      <p>Cameras</p>
                      <p style={{ marginLeft: "6px" }}>10</p>
                    </div>
                    <div className="flex_">
                      <p>Usecase</p>
                      <p style={{ marginLeft: "6px" }}>5</p>
                    </div>
                  </div>
                  <i className="material-icons c_icon">camera</i>
                  <i className="material-icons c_icon">widgets</i>
                </div>
              </div>
            </li>
          ))}
          {/*             
          
          <div className="abc">
            
          </div> */}
        </ul>
      </div>
    </div>
  );
}
