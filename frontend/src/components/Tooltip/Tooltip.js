import React from "react";
import _tooltip from "../../assets/images/tooltip.png";
import "./tooltip.scss";
export default function Tooltip({ type, tooltip }) {
  return (
    <div className="_tooltip_wrapper_">
      <img src={_tooltip} className="tt_icon" />
      <div
        className={type === "left" ? "tooltip tt_left" : "tooltip tt_center"}
      >
        {tooltip}
      </div>
    </div>
  );
}
