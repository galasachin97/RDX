import React, { useEffect, useState } from "react";
import { axiosApiInstance } from "../../helper/request";
import "./devicelimitation.scss";

const Limits = ({ name, count, icon, isLoading }) => {
  return (
    <div className="limits">
      <i className="material-icons">{icon}</i>

      <h3>{name}</h3>
      <div className="count">
        <span>{count}</span>
      </div>
    </div>
  );
};

export default function DeviceLimitation() {
  const [limitationData, setlimitationData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axiosApiInstance
      .get("base/device/limitations")
      .then((data) => {
        setlimitationData(data.data);
      })
      .catch((err) => {
        console.debug(err.response);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div className="_device_limitation_ s_loader"></div>;
  }
  return (
    <div className="_device_limitation_ fadeIn">
      <h2>Device Limitation</h2>
      <Limits
        isLoading={isLoading}
        icon="apps"
        name="Camera Limits"
        count={limitationData.Camera}
      />
      <Limits
        isLoading={isLoading}
        icon="photo_camera_front"
        name="Use Case Limits"
        count={limitationData.Usecase}
      />
      <Limits
        isLoading={isLoading}
        icon="photo_size_select_large"
        name="A.I. Limits"
        count={limitationData.Deepstream}
      />
    </div>
  );
}
