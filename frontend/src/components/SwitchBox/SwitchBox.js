import React from "react";
import "./switchbox.scss";
import ReactTooltip from "react-tooltip";
import { Link } from "react-router-dom";

export default function SwitchBox({
  label = "Label",
  value = false,
  onChange,
  link = null,
  warning = null,
}) {
  return (
    <div className="switch_wrapper">
      <ReactTooltip delayShow={500} />
      <p className="switch_label">
        {label}
        {link && (
          <Link to={{ pathname: link }} target="_blank">
            <i
              data-tip="Click to get more info"
              className="material-icons adjust_i"
            >
              error_outline
            </i>
          </Link>
        )}
        {warning && (
          <i data-tip={warning} className="material-icons adjust_i">
            error_outline
          </i>
        )}
      </p>

      <label className="switch">
        <input
          id="togBtn"
          value={value}
          onChange={onChange}
          type="checkbox"
          className="switch_1"
          checked={value}
        />

        <div className="slider round">
          <span className="on">on</span>

          <span className="off">off</span>
        </div>
      </label>
      {/* <div className="switch_box box_1">
        {value ? (
          <span onClick={onChange} className="value_on">
            on
          </span>
        ) : (
          <span onClick={onChange} className="value_off">
            off
          </span>
        )}
        <input
          value={value}
          onChange={onChange}
          type="checkbox"
          className="switch_1"
          checked={value}
        />
      </div> */}
    </div>
  );
}
