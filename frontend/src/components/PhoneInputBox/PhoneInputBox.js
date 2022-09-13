import React, { useCallback, useEffect, useRef, useState } from "react";
import "./phoneib.scss";
import Scrollbars from "react-custom-scrollbars";
import ReactCountryFlag from "react-country-flag";
import useClickOutside from "../../helper/useClickOutside";
const _countryData = require("../../helper/CountryCodes.json");

export default function PhoneInputBox({
  onChange,
  value,
  onFocus,
  id,
  error,
  onBlur,
  helperText,
  theme,
  isEdit,
  disabled,
}) {
  const scrollRef = useRef();
  const primaryRef = useRef();
  const [isFlagOpen, setIsFlagOpen] = useState(false);
  const [Search, setSearch] = useState("");
  const [countryData, setcountryData] = useState([..._countryData]);
  const [phoneData, setphoneData] = useState({
    selectedCountry: "IN",
    countryCode: "+91",
    inputNumber: "",
  });
  const phoneClose = useCallback(() => {
    setIsFlagOpen(false);
  }, []);
  useClickOutside(primaryRef, phoneClose);
  useEffect(() => {
    if (error && id) {
      var ele = document.querySelector("#" + id);
      ele.classList.add("error_shake");
      // ele.classList.add("input__error");
      setTimeout(function () {
        ele.classList.remove("error_shake");
      }, 300);
    }
  }, [error]);

  useEffect(() => {
    if (isEdit) {
      const split = value.split(" ");
      const code = split[0];
      const _number = split[1];
      if (value) {
        const result = countryData.filter((item) => item.dial_code === code);
        if (result.length === 1) {
          setphoneData((prev) => ({
            ...prev,
            countryCode: code,
            inputNumber: _number,
            selectedCountry: result[0].code,
          }));
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isFlagOpen) {
      var childElement =
        document.querySelector("#" + phoneData.selectedCountry).offsetTop - 50;
      scrollRef.current.scrollTop(childElement);
    }
  }, [isFlagOpen]);

  useEffect(() => {
    onChange(phoneData);
  }, [phoneData]);

  useEffect(() => {
    document.addEventListener("keydown", onKeyPressed);
    return () => {
      document.removeEventListener("keydown", onKeyPressed);
    };
  }, [isFlagOpen]);

  const onKeyPressed = (e) => {
    if (isFlagOpen) {
      if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
      }
      getKeyCode(e);
    }
  };

  const getKeyCode = (e) => {
    switch (e.keyCode) {
      case 38:
        arrowKey(e, "up");
        break;

      case 40:
        arrowKey(e, "down");
        break;

      case 13:
        setIsFlagOpen(false);
        break;
    }
  };

  const arrowKey = (e, type) => {
    let myReferenceDiv = document.querySelector(".active_flag");
    let prev = myReferenceDiv.previousElementSibling;
    let next = myReferenceDiv.nextElementSibling;
    if (type === "up") {
      if (prev) {
        myReferenceDiv.classList.remove("active_flag");
        prev.classList.add("active_flag");
        var countryCode = prev.getAttribute("data-countryCode");
        var selectedCountry = prev.getAttribute("data-selectedCountry");
        setphoneData((prev) => ({
          ...prev,
          countryCode,
          selectedCountry,
        }));
        var childElement =
          document.querySelector("#" + selectedCountry).offsetTop -
          myReferenceDiv.offsetHeight;
        scrollRef.current.scrollTop(childElement);
      }
    }

    if (type === "down") {
      if (next) {
        myReferenceDiv.classList.remove("active_flag");
        next.classList.add("active_flag");
        var countryCode = next.getAttribute("data-countryCode");
        var selectedCountry = next.getAttribute("data-selectedCountry");
        setphoneData((prev) => ({
          ...prev,
          countryCode,
          selectedCountry,
        }));
        var childElement =
          document.querySelector("#" + selectedCountry).offsetTop -
          myReferenceDiv.offsetHeight;
        scrollRef.current.scrollTop(childElement);
      }
    }
  };

  return (
    <div className="phone-ib">
      <label>Mobile No*</label>
      <div
        className={error ? "phone_no_wrapper input__error" : "phone_no_wrapper"}
        id={id}
      >
        <div
          className="country_flags"
          onClick={() => setIsFlagOpen(!isFlagOpen)}
        >
          <ReactCountryFlag
            style={{
              fontSize: "1.5em",
              lineHeight: "1.5em",
            }}
            countryCode={phoneData.selectedCountry}
            svg
          />
        </div>
        <svg
          onClick={() => setIsFlagOpen(!isFlagOpen)}
          className={isFlagOpen ? "nav_drop navbar_invert" : "nav_drop"}
          xmlns="http://www.w3.org/2000/svg"
          width="18.424"
          height="11.054"
          viewBox="0 0 18.424 11.054"
        >
          <path
            id="Vector_4394"
            data-name="Vector 4394"
            d="M0,0,9.212,11.054,18.424,0Z"
            fill={"#414d66"}
          />
        </svg>
        <p className="country_dial_code">{phoneData.countryCode}</p>

        <input
          type={"text"}
          className="phone_input_style"
          disabled={disabled}
          onChange={(e) => {
            setphoneData((prev) => ({
              ...prev,
              inputNumber: e.target.value.replace(/[^0-9]/g, ""),
            }));
          }}
          onFocus={() => {
            if (isFlagOpen) {
              setIsFlagOpen(false);
            }
            onFocus();
          }}
          value={phoneData.inputNumber}
        />
        {isFlagOpen && (
          <ul className="flag_suggestion" ref={primaryRef}>
            <div className="flag_search_container">
              <input
                type={"text"}
                className="flag_search_input"
                placeholder="Search Country"
                onChange={(e) => {
                  const value = e.target.value;
                  const regex = /^[a-zA-Z ]*$/;
                  if (value.match(regex) || value === "") {
                    setSearch(value);
                    const found = _countryData.filter((e) =>
                      e.name.toLowerCase().includes(value.toLowerCase())
                    );
                    if (found.length > 0) {
                      setcountryData([...found]);
                    }
                  }
                }}
                value={Search}
              />
              <svg
                className="search_icon"
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.75 15.75L20.25 20.25M17.25 11.25C17.25 14.5637 14.5637 17.25 11.25 17.25C7.93629 17.25 5.25 14.5637 5.25 11.25C5.25 7.93629 7.93629 5.25 11.25 5.25C14.5637 5.25 17.25 7.93629 17.25 11.25Z"
                  stroke="#2D62ED"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <Scrollbars autoHeight autoHeightMax="15vh" ref={scrollRef}>
              {countryData.map((item) => (
                <li
                  id={item.code}
                  className={`flag_options ${
                    phoneData.selectedCountry === item.code && "active_flag"
                  }`}
                  key={item.code}
                  data-countryCode={item.dial_code}
                  data-selectedCountry={item.code}
                  data-countryName={item.name}
                  onClick={() => {
                    setphoneData((prev) => ({
                      ...prev,
                      countryCode: item.dial_code,
                      selectedCountry: item.code,
                    }));
                    setIsFlagOpen(false);
                    setSearch("");
                    setcountryData([..._countryData]);
                    document.querySelector(".phone_input_style").focus();
                  }}
                >
                  <ReactCountryFlag
                    style={{
                      fontSize: "1.5em",
                      lineHeight: "1.5em",
                    }}
                    countryCode={item.code}
                    svg
                  />
                  <p className="country_name">{item.name}</p>
                  <p className="country_dial_code">{item.dial_code}</p>
                </li>
              ))}
            </Scrollbars>
          </ul>
        )}
      </div>

      {helperText && <p className="helperText"> {helperText}</p>}
    </div>
  );
}
