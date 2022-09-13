import React, { useEffect, useState } from "react";
import Scrollbars from "react-custom-scrollbars";
import expand from "../../assets/images/expand.png";
import "./MultiSelectDropdown.scss";
export default function MultiSelectDropdown({
  optionsList,
  handleOption,
  defaultText,
  label,
  error,
  id,
  onMouseDown,
  className,
  isLoading,
  onFocus,
  style,
}) {
  const [defaultSelectText, setDefaultSelectText] = useState(defaultText || []);
  const [showOptionList, setshowOptionList] = useState(false);
  const handleClickOutside = (e) => {
    if (
      !e.target.classList.contains("custom-select-option") &&
      !e.target.classList.contains("selected-text") &&
      !e.target.classList.contains("select-options")
    ) {
      setshowOptionList(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    Array.isArray(defaultText)
      ? setDefaultSelectText(defaultText)
      : setDefaultSelectText([]);
  }, [defaultText]);

  const handleListDisplay = () => {
    if (onFocus) {
      onFocus();
    }
    setshowOptionList(!showOptionList);
  };

  const handleOptionClick = (value) => {
    let _defaultSelectText = [...defaultSelectText];
    if (typeof defaultSelectText === "string") {
      _defaultSelectText = [];
    }
    if (defaultSelectText.includes(value)) {
      let _index = _defaultSelectText.indexOf(value);
      _defaultSelectText.splice(_index, 1);
    } else {
      _defaultSelectText.push(value);
    }
    if (_defaultSelectText.length) {
      handleOption([..._defaultSelectText]);
      setDefaultSelectText([..._defaultSelectText]);
    } else {
      handleOption([]);
      setDefaultSelectText([]);
    }
  };
  return (
    <div
      className={
        className
          ? "custom-multi-select-container " + className
          : "custom-multi-select-container"
      }
      style={style}
    >
      <p className="dd-label">{label}</p>
      <div
        id={id}
        className={error ? "selected-text input__error" : "selected-text"}
        onClick={isLoading ? null : () => handleListDisplay()}
        title={defaultSelectText.join()}
      >
        {Array.isArray(defaultSelectText) && defaultSelectText.length
          ? defaultSelectText.join()
          : "Choose option"}
        <img
          src={expand}
          className={showOptionList ? "drop_icon list_open" : "drop_icon"}
        />
      </div>
      <ul
        className={`select-options ${showOptionList ? "active__" : "inactive"}`}
      >
        <Scrollbars autoHeight autoHeightMax="18vh">
          {optionsList.map((option) => {
            return (
              <li
                className={
                  defaultSelectText?.includes(option)
                    ? "custom-select-option active_option"
                    : "custom-select-option"
                }
                data-name={option}
                key={option}
                onClick={() => handleOptionClick(option)}
              >
                <input
                  type="checkbox"
                  checked={defaultSelectText?.includes(option)}
                  className="multi-checkbox"
                  // onChange={() => handleOptionClick(option)}
                />
                {option}
              </li>
            );
          })}
        </Scrollbars>
      </ul>
    </div>
  );
}

//usage
//  <MultiSelectDropdown
//    optionsList={multiOption}
//    label="TITLE"
//    id="custom"
//    defaultText={multiSelectedValue}
//    handleOption={(data) => setmultiSelectedValue([...data])}
//  />;

// const [multiSelectedValue, setmultiSelectedValue] = useState([
//   "Oliver",
//   "Van",
//   "April",
//   "Ralph",
// ]);
// const [multiOption, setmultiOption] = useState([
//   "Oliver",
//   "Van",
//   "April",
//   "Ralph",
//   "Omar",
//   "Carlos",
//   "Miriam Wagner",
//   "Bradley Wilkerson",
//   "Virginia Andrews",
//   "Kelly Snyder",
// ]);
