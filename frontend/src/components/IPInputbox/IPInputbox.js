import React, { useEffect, useState } from "react";
import "./ip_input.scss";
import InputBox from "../Inputbox/InputBox";

export default function IPInputbox({
  id,
  error,
  helperText,
  label,
  defaultValue,
  onFocus,
  onChange,
  exclude,
  IPValue,
  onBlur,
  disabled,
  children,
}) {
  const [text, setText] = useState(defaultValue);
  useEffect(() => {
    if (error && id) {
      var ele = document.querySelector("#" + id);
      ele.classList.add("error_shake");
      setTimeout(function () {
        ele.classList.remove("error_shake");
      }, 500);
    }
  }, [error]);

  const handleCursor = () => {
    var input = document.getElementById(id);
    input.focus();
    input.setSelectionRange(2, 2);
  };

  const handleChange = (event) => {
    let newValue = event.target.value.replace(/[^0-9\.]/g, "");
    let length = newValue.length;
    let index = newValue.lastIndexOf(".") + 1;
    let noOfDots = newValue.split(".").length - 1;
    let updatedVal = "";
    let splittedValue = newValue.split(".");

    if (label !== "Subnet Mask") {
      var indexes = [];

      if (splittedValue.length === 4 && splittedValue[3] === "255")
        return false;

      for (let i = 0; i < splittedValue.length; i++) {
        if (splittedValue[i][0] === "0" && splittedValue[i].length > 1)
          return false;
        if (splittedValue[i] === "0") indexes.push(i);
      }

      if (indexes.includes(0) || indexes.includes(3)) {
        return false;
      }
    }

    if (
      splittedValue.length > 4 ||
      splittedValue.some(
        (part) => part === "00" || part.length > 3 || part < 0 || part > 255
      )
    ) {
      return false;
    }

    if (newValue[newValue.length - 1] === ".") {
      if (text[text.length - 1] === ".") {
        return false;
      }
    }
    if (exclude) {
      if (exclude.includes(splittedValue[0])) {
        handleCursor();
        return text;
      }
    }
    if (IPValue) {
      // let _newValueSplit = _IPvalue[2];
      // let _IPvalue = IPValue.split(".");
      // let _value = _IPvalue[2];
      // let subnetIP = newValue.split(".");
      // let _subValue = subnetIP[2];
      // if (_subValue !== undefined) {
      //   if (_value !== _subValue) {
      //     return false;
      //   }
      // }
    }
    if (
      length !== index &&
      noOfDots < 3 &&
      text.length < length &&
      (length - index) % 3 === 0
    ) {
      updatedVal = newValue + ".";
    } else if (noOfDots > 3 || length - index > 3) {
      let newString = newValue.substring(0, length - 1);
      updatedVal = newString;
    } else {
      updatedVal = newValue;
    }
    setText(updatedVal);
    onChange(updatedVal);
  };

  useEffect(() => {
    setText(defaultValue);
  }, [defaultValue]);

  return (
    <div className="__IP_input__">
      <InputBox
        id={id}
        header={label}
        onChange={handleChange}
        error={error}
        value={text}
        onFocus={onFocus}
        onBlur={onBlur}
        children={children}
        disabled={disabled}
      />
      {helperText && error && <p className="error_text">{helperText}</p>}
    </div>
  );
}
