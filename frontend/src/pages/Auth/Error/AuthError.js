import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function AuthError() {
  const location = useLocation();
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {location.state ? location.state.message : "Something went wrong."}
      &nbsp;Please report the issue&nbsp;
      <Link to={{ pathname: "https://www.diycam.com" }} target="_blank">
        <span
          style={{
            color: "red",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          here
        </span>
      </Link>
    </div>
  );
}
