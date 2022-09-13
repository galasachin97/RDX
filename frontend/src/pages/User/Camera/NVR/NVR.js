import React, { useEffect, useState } from "react";
import "./nvr.scss";
import { motion } from "framer-motion";
import nvr from "../../../../assets/images/nvr.png";
import { BoxCard } from "../../../../components/card/Card";
import dots from "../../../../assets/images/dots.png";
import { randomID } from "../../../../helper/request";
import ReactTooltip from "react-tooltip";
import Scrollbars from "react-custom-scrollbars";
import axios from "axios";
import Modal from "../../../../components/Modal/Modal";
import InputBox from "../../../../components/Inputbox/InputBox";
import IPInputbox from "../../../../components/IPInputbox/IPInputbox";
import Button from "../../../../components/Button/Button";
import { notify } from "../../Setting/Appearance/AppearanceSetting";
let timeout = null;
let timeout2 = null;
let selectedData = {};
export default function NVR({
  setIsDeleting,
  setisConfirmDelete,
  getNVRID,
  dummyFuncc,
}) {
  const [NVRData, setNVRData] = useState([]);
  const [isDetailOpen, setisDetailOpen] = useState(false);
  const [Username, setUsername] = useState("sbaz44");
  const [Password, setPassword] = useState("");
  const [Port, setPort] = useState("");
  const [IP, setIP] = useState("");
  const [DeviceType, setDeviceType] = useState("");
  const [HardwareVersion, setHardwareVersion] = useState("");
  const [MachineName, setMachineName] = useState("");
  const [SerialNumber, setSerialNumber] = useState("");
  const [RecordingStutus, setRecordingStutus] = useState("");
  const [OnvifVersion, setOnvifVersion] = useState("");
  const [errors, setErrors] = useState({
    isUsernameEmpty: false,
    isPasswordEmpty: false,
    isPortEmpty: false,
    isIPEmpty: false,
    // isNVREmpty: false,
    // isNVRNameUnique: false,
    // isNVRBrandEmpty: false,
    // isNVRModelEmpty: false,
  });
  const [DisabledInput, setDisabledInput] = useState({
    username: true,
    password: true,
    port: true,
    ip: true,
  });

  const getNVR = () => {
    // setNVRData([
    //   {
    //     nvr_name: "Marol NVR",
    //     nvr_brand_name: "string",
    //     nvr_model_name: "string",
    //     nvr_ip: "192.168.1.108",
    //     nvr_port: "80",
    //     nvr_user_name: "admin",
    //     nvr_password:
    //       "uWnWDUCuEnE=*SSEL+bcRCD6KSYnlZosVHg==*kY6C72zWA4VarMV/1axSfg==*GF8MLqBeM1bUPVOjImcc7A==",
    //     device_type: "DHI-NVR1104HS-S3/H",
    //     serial_number: "7D01EE9PCAF49CF",
    //     software_version: 'nvr_response["software_version"]',
    //     Onvif_version: "20.06(V2.8.1.957450)",
    //     HDD_details: [
    //       {
    //         "/dev/sda": {
    //           TotalBytes: 449.166015625,
    //           UsedBytes: 155.166015625,
    //           UnusedBytes: 294,
    //         },
    //         "/dev/gda": {
    //           TotalBytes: 449.166015625,
    //           UsedBytes: 1545.166015625,
    //           UnusedBytes: 555,
    //         },
    //       },
    //     ],
    //     channel_on_list: ["Cam 07", "Cam 03"],
    //     channel_off_list: ["Cam 02", "Cam 06"],
    //   },
    // ]);
    setIsDeleting(true);
    axios
      .get("http://192.168.1.5:8000/displaynvrinfo")
      .then((res) => {
        setNVRData([...res.data.response]);
      })
      .catch(() => {})
      .finally(() => {
        setIsDeleting(false);
      });
  };
  useEffect(() => {
    dummyFuncc(getNVR);
    getNVR();
  }, []);

  useEffect(() => {
    let ele1 = document.querySelector(".side_nav_");
    let ele2 = document.querySelector(".nav_header");
    let ele3 = document.querySelector("#fab1");
    let ele4 = document.querySelector(".fixed_activity");
    if (isDetailOpen) {
      if (ele1 && ele2 && ele3 && ele4) {
        ele1.style.position = "relative";
        ele1.style.zIndex = "0";
        ele2.style.zIndex = "0";
        ele3.style.zIndex = "-1";
        ele4.style.zIndex = "-1";
      }
    } else {
      if (ele1 && ele2 && ele3 && ele4) {
        ele1.style.removeProperty("position");
        ele1.style.removeProperty("zIndex");
        ele2.style.zIndex = "12";
        ele3.style.zIndex = "115";
        ele4.style.removeProperty("zIndex");
        ele4.style.zIndex = "1";
      }
    }
    return () => {
      // document.removeEventListener("keydown", escKey, false);
    };
  }, [isDetailOpen]);

  const clearError = (name) => {
    let _errors = { ...errors };
    _errors[name] = false;
    setErrors({ ..._errors });
  };

  const postNVRData = () => {
    let _errors = { ...errors };
    if (Username === "") _errors["isUsernameEmpty"] = true;
    if (Password === "") _errors["isPasswordEmpty"] = true;
    if (Port === "") _errors["isPortEmpty"] = true;
    if (IP === "") _errors["isIPEmpty"] = true;
    setErrors({ ..._errors });
    if (Object.values(_errors).includes(true)) {
      return;
    }
    setIsDeleting(true);
    let body = {
      nvr_name: selectedData.nvr_name,
      nvr_brand_name: selectedData.nvr_brand_name,
      nvr_model_name: selectedData.nvr_model_name,
      nvr_ip: IP,
      nvr_port: Port,
      nvr_user_name: Username,
      nvr_password: Password,
    };
    axios
      .post("http://192.168.1.5:8000/updatenvrinfo", body)
      .then((res) => {
        notify({
          type: "success",
          msg: "NVR updated successfully!",
        });
      })
      .catch((err) => {
        notify({
          type: "alert",
          msg: "NVR not found!",
        });
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  useEffect(() => {
    if (isDetailOpen) {
      setUsername(selectedData.nvr_user_name);
      setPassword("");
      setPort(selectedData.nvr_port);
      setIP(selectedData.nvr_ip);
      setDeviceType(selectedData.device_type);
      setHardwareVersion(selectedData.software_version);
      setMachineName(selectedData.nvr_name);
      setSerialNumber(selectedData.serial_number);
      setRecordingStutus(true ? "Active" : "Inactive");
      setOnvifVersion(selectedData.Onvif_version);
    }
  }, [isDetailOpen]);

  return (
    <div className="list_nvr_container fadeIn">
      {NVRData.map((item, index) => (
        <NVRCard
          key={item.nvr_name}
          name={randomID()}
          idx={index}
          data={item}
          onEditClick={() => {
            selectedData = { ...item };
            setisDetailOpen(true);
          }}
          onDeleteClick={() => {
            setisConfirmDelete(true);
            getNVRID(item.nvr_name);
          }}
          // dummyFunc={() => {
          //   dummyFuncc(dummyFunc);
          // }}
        />
      ))}
      {isDetailOpen && (
        <Modal
          className="pop_adjust__"
          handleClose={() => {
            setisDetailOpen(false);
          }}
        >
          <h1>View & Edit NVR Details</h1>
          <div
            className="close"
            onClick={() => {
              setisDetailOpen(false);
            }}
          >
            <i className="material-icons" style={{ color: "#fff" }}>
              close
            </i>
          </div>
          <div
            className="detail_wrapper"
            style={{ display: "flex", flexWrap: "wrap" }}
          >
            <InputBox
              id="NVRName"
              header="NVR Username"
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              error={errors["isUsernameEmpty"]}
              value={Username}
              onFocus={() => clearError("isUsernameEmpty")}
              children={editIcon(() => {
                setDisabledInput((prevState) => ({
                  ...prevState,
                  username: !DisabledInput.username,
                }));
                document.getElementById("NVRName").focus();
              })}
              disabled={DisabledInput.username}
            />
            <InputBox
              id="password"
              header="NVR Password"
              onChange={(e) => {
                const value = e.target.value;
                var regex = /^\S+$/;
                if (value.match(regex) || value === "") {
                  setPassword(value);
                }
              }}
              error={errors["isPasswordEmpty"]}
              value={Password}
              onFocus={(e) => clearError("isPasswordEmpty")}
              // children={editIcon(() => {
              //   setDisabledInput((prevState) => ({
              //     ...prevState,
              //     password: !DisabledInput.password,
              //   }));
              //   document.getElementById("password").focus();
              // })}
              // disabled={DisabledInput.password}
            />
            {/* <InputBox
              id="password"
              error={errors["isPasswordEmpty"]}
              type={oldType}
              typeValue={(data) => handlePassword(data)}
              password
              header="NVR Password"
              onChange={(e) => {
                const value = e.target.value;
                var regex = /^\S+$/;
                if (value.match(regex) || value === "") {
                  setPassword(value);
                }
              }}
              onFocus={() => clearError("isPasswordEmpty")}
              value={Password}
            /> */}
            <InputBox
              id="NVRPort"
              header="NVR Port"
              onChange={(e) => {
                const value = e.target.value;
                const regex = /^[0-9]*$/;
                if (value.match(regex) || value === "") {
                  setPort(value);
                }
              }}
              error={errors["isPortEmpty"]}
              value={Port}
              onFocus={(e) => {
                clearError("isPortEmpty");
              }}
              maxLength={5}
              children={editIcon(() => {
                setDisabledInput((prevState) => ({
                  ...prevState,
                  port: !DisabledInput.port,
                }));
                document.getElementById("NVRPort").focus();
              })}
              disabled={DisabledInput.port}
            />
            <IPInputbox
              id="ip__"
              label="IP"
              error={errors["isIPEmpty"]}
              onChange={(e) => {
                setIP(e);
              }}
              onClick={() => clearError("isIPEmpty")}
              defaultValue={IP}
              onFocus={(event) => {
                clearError("isIPEmpty");
                event.target.select();
              }}
              exclude={[]}
              children={editIcon(() => {
                setDisabledInput((prevState) => ({
                  ...prevState,
                  ip: !DisabledInput.ip,
                }));
                document.getElementById("ip__").focus();
              })}
              disabled={DisabledInput.ip}
            />
            <InputBox
              id="DeviceType"
              header="Device Type"
              value={DeviceType}
              disabled
            />
            <InputBox
              id="HardwareVersion"
              header="Software Version"
              value={HardwareVersion}
              disabled
            />
            <InputBox
              id="MachineName"
              header="Machine Name"
              value={MachineName}
              disabled
            />
            <InputBox
              id="SerialNumber"
              header="Serial Number"
              value={SerialNumber}
              disabled
            />
            <InputBox
              id="NVRRecordingStatus"
              header="NVR Recording Status"
              value={RecordingStutus}
              disabled
            />
            <InputBox
              id="OnvifVersion"
              header="Onvif Version"
              value={OnvifVersion}
              disabled
            />
          </div>
          <p className="hard_header">Hard Disk Details</p>
          <div>
            <Scrollbars autoHeight autoHeightMin={100} autoHeightMax="4vw">
              {selectedData.HDD_details.map((item) => {
                let keys = Object.keys(item);
                return keys.map((item2) => {
                  return (
                    <div
                      className="hardware_wrapper"
                      style={{ display: "flex" }}
                      key={item2}
                    >
                      <InputBox
                        id="TotalMemory"
                        header="Total Memory (in MB)"
                        value={item[item2].TotalBytes}
                        disabled
                      />
                      <InputBox
                        id="UsedMemory"
                        header="Used Memory"
                        value={item[item2].UsedBytes}
                        disabled
                      />
                      <InputBox
                        id="RemaningMemory"
                        header="Remaning Memory"
                        value={item[item2].UnusedBytes}
                        disabled
                      />
                    </div>
                  );
                });
              })}

              {/* <div className="hardware_wrapper" style={{ display: "flex" }}>
                <InputBox
                  id="TotalMemory"
                  header="Total Memory (in MB)"
                  value="abc"
                  disabled
                />
                <InputBox
                  id="UsedMemory"
                  header="Used Memory"
                  value="abc"
                  disabled
                />
                <InputBox
                  id="RemaningMemory"
                  header="Remaning Memory"
                  value="abc"
                  disabled
                />
              </div> */}
            </Scrollbars>
          </div>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "1vw",
            }}
          >
            <span
              className="modal_back"
              onClick={() => {
                setisDetailOpen(false);
              }}
            >
              Back
            </span>
            <Button
              style={{ width: "6vw" }}
              onClick={postNVRData}
              type="gradient"
              name="Submit"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

const NVRCard = ({
  className,
  name,
  idx,
  data,
  onEditClick,
  onDeleteClick,
}) => {
  const [isOpen, setisOpen] = useState(false);
  console.log(data);
  const handleClickOutside = (e) => {
    if (
      !e.target.classList.contains("btnn") &&
      !e.target.classList.contains("floating_menu")
    ) {
      var ele = document.querySelector(".floating_menu");
      if (ele) {
        ele.classList.add("exit_float_menu");
        timeout = setTimeout(() => {
          setisOpen(false);
          ele.classList.remove("exit_float_menu");
        }, 200);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <BoxCard className={className ? "nvr_card " + className : "nvr_card"}>
      <ReactTooltip />
      {isOpen && (
        <motion.div
          initial={{
            width: 0,
            height: 0,
            padding: 0,
          }}
          animate={{
            width: "10.4166666667vw",
            height: "auto",
            padding: "inherit",
            paddingRight: "0.9vw",
          }}
          transition={{ duration: 0.3 }}
          className="floating_menu"
        >
          <button className="btnn" onClick={onEditClick}>
            View & Edit Details
          </button>
          <button
            className="btnn"
            onClick={onDeleteClick}
            // onClick={() => {
            //   setisOpen(false);
            //   //   onEditDetail(true);
            //   //   activeCamDetails = { ...data };
            // }}
          >
            Delete NVR
          </button>

          <img
            src={dots}
            className="dot_icon_active"
            onClick={() => {
              var ele = document.querySelector(".floating_menu");
              ele.classList.add("exit_float_menu");
              clearTimeout(timeout2);
              timeout2 = setTimeout(() => {
                setisOpen(false);
                ele.classList.remove("exit_float_menu");
              }, 200);
            }}
          />
        </motion.div>
      )}
      {!isOpen && (
        <img
          src={dots}
          className="dot_icon_active dot_adjust"
          onClick={() => {
            clearTimeout(timeout2);
            setTimeout(() => {
              setisOpen(true);
            }, 200);
          }}
        />
      )}

      <div className="nvr_info">
        <div className="nvr_image_holder">
          <img src={nvr} alt="nvr" className="nvr_image" />
          <div data-tip="Click here for more information.">
            {infoIcon(() => {
              document.getElementById(name).classList.toggle("flipped");
            })}
          </div>
        </div>
        <p className="name">{data.nvr_name}</p>
        <div className="nvrDetails">
          <div className="content" id={name}>
            <div className="flip-card-front">
              {/* {console.log(data.channel_on_list.lenght)} */}
              {/* <Scrollbars autoHeight autoHeightMin={100} autoHeightMax="9vw"> */}
              <NVRInfo
                title="Status"
                _data={data.nvr_status ? "Active" : "Inactive"}
                titleStyle={{
                  backgroundColor: "unset",
                  color: data.nvr_status ? "green" : "red",
                }}
              />
              <NVRInfo
                title="Video recording"
                _data="ON"
                titleStyle={{ backgroundColor: "unset", color: "green" }}
              />
              <NVRInfo
                title="Active Channel"
                _data={data?.channel_on_list.length || 0}
                titleStyle={{ backgroundColor: "unset" }}
                info="#64E45B"
                type={"_Active_" + idx}
                data={data.channel_on_list}
              />
              <NVRInfo
                title="Inactive Channel"
                _data={data?.channel_off_list.length || 0}
                titleStyle={{ backgroundColor: "unset" }}
                type={"_Inactive_" + idx}
                info="#E45B5B"
                data={data.channel_off_list}
              />
              {/* </Scrollbars> */}
            </div>
            <div className="flip-card-back">
              <div className="nvr_full_info">
                <Scrollbars autoHeight autoHeightMin={100} autoHeightMax="9vw">
                  <NVRInfo back title="IP" _data={data.nvr_ip} />
                  <NVRInfo back title="Port" _data={data.nvr_port} />
                  <NVRInfo
                    back
                    title="Connected Camera"
                    _data={data?.channel_on_list.length || 0}
                  />
                  <NVRInfo
                    back
                    title="Onvif Version"
                    _data={data.Onvif_version}
                  />
                  <NVRInfo
                    back
                    title="Serial Number"
                    _data={data.serial_number}
                  />
                  <NVRInfo
                    back
                    title="Software Version"
                    _data={data.software_version}
                  />
                  <NVRInfo back title="Device Type" _data={data.device_type} />
                </Scrollbars>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BoxCard>
  );
};

const NVRInfo = ({ title, _data, titleStyle, back, info, type, data }) => {
  let timeout = null;
  return (
    <div className={back ? "nvr_info_wrapper nvr_adjust" : "nvr_info_wrapper"}>
      <p className="_title">{title}</p>
      {!back && <p className="dot_">:</p>}
      <div className="_data" style={titleStyle}>
        {_data}
        {info && (
          <React.Fragment>
            <div
              onMouseEnter={() => {
                document.querySelector("." + type).style.display = "block";
              }}
              onMouseLeave={() => {
                timeout = setTimeout(() => {
                  document.querySelector("." + type).style.display = "none";
                }, 200);
              }}
            >
              {infoIcon(null, info)}
            </div>
            <div
              className={"hover_data " + type}
              onMouseMove={() => {
                clearTimeout(timeout);
                document.querySelector("." + type).style.display = "block";
              }}
              onMouseOut={() => {
                document.querySelector("." + type).style.display = "none";
              }}
            >
              <div className="hover_data_content">
                <Scrollbars
                  renderThumbVertical={({ style, ...props }) => {
                    const thumbStyle = {
                      borderRadius: 6,
                      backgroundColor: "rgba(0, 0, 0, 0.2)",
                      width: "3px",
                    };
                    return (
                      <div style={{ ...style, ...thumbStyle }} {...props} />
                    );
                  }}
                  renderThumbHorizontal={({ style, ...props }) => {
                    return (
                      <div
                        {...props}
                        style={{ display: "none" }}
                        className="track-horizontal"
                      />
                    );
                  }}
                  autoHeight
                  autoHeightMin={100}
                  autoHeightMax="2vw"
                >
                  {data?.map((item) => (
                    <p
                      key={item}
                      style={{ padding: "0 15px", fontSize: "0.7vw" }}
                    >
                      {item}
                    </p>
                  ))}
                </Scrollbars>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};
const data = [{}];

const infoIcon = (onClick, color = "#0a82ea") => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={28}
    viewBox="0 0 28 28"
    className="info_icon"
    onClick={onClick}
  >
    <g id="sample">
      <path
        id="placeholder"
        d="M14,0A14,14,0,1,1,0,14,14,14,0,0,1,14,0Z"
        fill={color}
      />
    </g>
    <text
      id="i"
      transform="translate(12 21)"
      fill="#fff"
      fontSize={18}
      fontFamily="SegoeUI, Segoe UI"
      letterSpacing="0.04em"
    >
      <tspan x={0} y={0}>
        {"i"}
      </tspan>
    </text>
  </svg>
);

const editIcon = (onClick) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={17.933}
    height={19.603}
    viewBox="0 0 17.933 19.603"
    className="editIcon"
    onClick={onClick}
  >
    <path
      id="border_color_FILL0_wght400_GRAD0_opsz48"
      d="M5.345,23.877a1.279,1.279,0,0,1-.953-.4A1.334,1.334,0,0,1,4,22.51a1.279,1.279,0,0,1,.4-.953,1.334,1.334,0,0,1,.964-.392h15.22a1.339,1.339,0,0,1,1.345,1.345,1.378,1.378,0,0,1-1.367,1.367Zm1.166-5.088a.652.652,0,0,1-.672-.672v-2.04a.658.658,0,0,1,.045-.247.683.683,0,0,1,.157-.224L14.2,7.446l2.981,2.981L9.021,18.587a.683.683,0,0,1-.224.157.658.658,0,0,1-.247.045Zm.672-1.345H8.192a90,90,0,0,0,7.061-7.061c1.513-2.017-1.009-1.009-1.009-1.009L7.183,16.435Zm10.984-8L15.185,6.46l1.883-1.883a.761.761,0,0,1,.56-.3.858.858,0,0,1,.628.3L20,6.326a.868.868,0,0,1,.291.616.941.941,0,0,1-.247.616ZM7.183,17.444Z"
      transform="translate(-4 -4.274)"
      fill="var(--primary)"
    />
  </svg>
);
