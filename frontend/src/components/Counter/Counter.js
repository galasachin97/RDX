import React from "react";
import "./counter.scss";
export default function Counter({
  label,
  required,
  handleIncrement,
  handleDecrement,
  value,
  handleInput,
  sub,
}) {
  return (
    <div className="counter_wrapper_">
      {label && (
        <p className="counter_label">{required ? label + "*" : label}:</p>
      )}
      <div className="c_holder">
        <div className="counter">
          <button className="counter_btn" onClick={handleDecrement}>
            -
          </button>
          <input
            type={"text"}
            className="counter_text"
            maxLength={3}
            onChange={handleInput}
            value={value}
          />

          <button className="counter_btn" onClick={handleIncrement}>
            +
          </button>
        </div>
        {sub && <span className="sub">{sub}</span>}
      </div>
    </div>
  );
}
