import React, { useEffect } from "react";
import "./Card.scss";
import Ram from "../../assets/images/ram.svg";

export const Card = ({
  stat_name,
  stat_usage,
  stat_icon,
  iconType,
  isLoading,
  onClick,
}) => {
  // useEffect(() => {
  //   var ele = document.querySelector("._card_container_");
  //   if (isLoading) {
  //     ele.classList.add("s_loader");
  //   } else {
  //     ele.classList.remove("s_loader");
  //   }
  // }, [isLoading]);

  if (isLoading) {
    return <div className="_card_container_ s_loader"></div>;
  }
  return (
    <div
      className="_card_container_ fadeIn"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {iconType === "fa" ? (
        <i
          className={
            stat_icon ? "fas " + stat_icon : "fas fa-exclamation-triangle"
          }
        />
      ) : iconType === "mdi" ? (
        <i
          className={
            stat_icon
              ? "mdi adjust_mdi " + stat_icon
              : "mdi adjust_mdi mdi-alert-circle"
          }
          // className="mdi mdi-expansion-card"
        ></i>
      ) : (
        <i className="material-icons">{stat_icon ? stat_icon : "dangerous"}</i>
      )}
      {/* <i className="material-icons">{stat_icon ? stat_icon : "dangerous"}</i> */}
      <div className="content">
        <h5>{stat_name}</h5>
        {/* <h2>{stat_usage ? stat_usage : "...Loading"}</h2> */}
        <h2>{stat_usage}</h2>
      </div>
    </div>
  );
};

export const BoxCard = ({
  style,
  children,
  className,
  isLoading,
  onClick,
  id,
}) => {
  useEffect(() => {
    if (id) {
      var ele = document.querySelector("#" + id);

      if (isLoading) {
        ele.classList.add("s_loader");
      } else {
        ele.classList.remove("s_loader");
      }
    }
  }, [isLoading]);
  return (
    <div
      className={
        className ? "_box_card_container_ " + className : "_box_card_container_"
      }
      style={style}
      onClick={onClick}
      id={id}
    >
      {!isLoading && children}
    </div>
  );
};
