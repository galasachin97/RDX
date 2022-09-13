import React, { useState, useEffect } from "react";
import InputBox from "../Inputbox/InputBox";
import Button from "../Button/Button";
import "./PasswordVerification.scss";

export default function PasswordVerification(props) {
  //   const [showPasswordContainer, setShowPasswordContainer] = useState(false);
  //   const [password, setPassword] = useState(null);
  const [isPasswordEmpty, setisPasswordEmpty] = useState(false);

  return (
    <div className="password_popup fadeIn">
      <div className="pass_container" id="p_container">
        <h1>Confirm access</h1>
        <i
          className="material-icons close_icon"
          onClick={() => {
            props.close();
          }}
        >
          close
        </i>
        <InputBox
          id="password"
          error={isPasswordEmpty}
          type="password"
          header="Enter Password *"
          onChange={(e) => props.setPassword(e.target.value.replace(" ", ""))}
          value={props.password}
          onFocus={() => setisPasswordEmpty(false)}
          onBlur={() => {
            if (props.password === "") {
              setisPasswordEmpty(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.keyCode === 13) {
              props.postPassword();
            }
          }}
        />

        <Button
          style={{ width: "5vw" }}
          type={"gradient"}
          onClick={() => props.postPassword()}
          name="Submit"
          disabled={!props.password}
        />
      </div>
    </div>
  );
}
