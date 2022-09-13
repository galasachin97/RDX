import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import Navbar from "../../../../components/Navbar/Navbar";
import { container, item } from "../../../../helper/motions";
import { axiosApiInstance } from "../../../../helper/request";
import NVRDetails from "../NVRDetails/NVRDetails";
import "./addnvr.scss";
export default function AddNVR() {
  const [settingList, setSettingList] = useState([
    "NVR Details",
  ]);
  const [activeSetting, setactiveSetting] = useState("NVR Details");
 
  const renderSetting = (param) => {
    switch (param) {
      case "NVR Details":
        return <NVRDetails />;
      default:
        return <NVRDetails />;
    }
  };
  return (
    <div className="__add_NVR_wrapper__">
      <Navbar
        navName="Add NVR Manually"
      >
        <div style={{ display: "flex" }}>
          <div className="_setting_list_">
            <div className="fixed_activity">
              <motion.ul
                variants={container}
                exit="exit"
                initial="hidden"
                animate="visible"
              >
                {settingList.map((items) => (
                  <motion.li
                    className={items === activeSetting && "active_stage"}
                    variants={item}
                    key={items}
                    // onClick={() => setactiveSetting(items)}
                    id={items.replace(/ /g, "_")}
                  >
                    {items}
                  </motion.li>
                ))}
              </motion.ul>

            </div>
          </div>
          <div className="_grid_">{renderSetting(activeSetting)}</div>
        </div>
      </Navbar>
    </div>
  );
}
