import React, { useEffect, useState } from "react";
import "./nvrdetails.scss";
import { motion } from "framer-motion";
import { xMotion } from "../../../../helper/motions";
import { BoxCard } from "../../../../components/card/Card";
import InputBox from "../../../../components/Inputbox/InputBox";
import Dropdown from "../../../../components/Dropdown/Dropdown";
import IPInputbox from "../../../../components/IPInputbox/IPInputbox";
import { axiosApiInstance } from "../../../../helper/request";
import axios from "axios";
import Button from "../../../../components/Button/Button";
import toast from "react-hot-toast";
import { useDebouncedEffect } from "../../../../helper/useDebounce";

export default function NVRDetails() {
  const [NVRName, setNVRName] = useState("Marol NVR");
  const [NVRBrand, setNVRBrand] = useState("");
  const [NVRModel, setNVRModel] = useState("");
  const [NVRBrandOption, setNVRBrandOption] = useState([]);
  const [NVRModelOption, setNVRModelOption] = useState([]);
  const [IP, setIP] = useState("192.168.1.108");
  const [Port, setPort] = useState("80");
  const [Username, setUsername] = useState("admin");
  const [Password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState("");

  const [oldType, setOldType] = useState("password");
  const [errors, setErrors] = useState({
    isNVREmpty: false,
    isNVRNameUnique: false,
    isIPEmpty: false,
    isPortEmpty: false,
    isUsernameEmpty: false,
    isPasswordEmpty: false,
    isNVRBrandEmpty: false,
    isNVRModelEmpty: false,
  });
  useDebouncedEffect(
    () => (NVRName ? uniqueCheck() : undefined),
    [NVRName],
    1000
  );

  const clearError = (name) => {
    let _errors = { ...errors };
    _errors[name] = false;
    setErrors({ ..._errors });
  };

  const handlePassword = (type) => {
    if (!type) {
      setOldType("password");
    } else {
      setOldType("text");
    }
  };

  const uniqueCheck = () => {
    if (NVRName) {
      axios
        .get("http://192.168.1.5:8000/check_nvr_name_exixt?nvr_name=" + NVRName)
        .then((res) => {
          console.log(res);
          setErrors((prevState) => ({
            ...prevState,
            isNVRNameUnique: res.data,
          }));
        });
    }
  };

  const postData = () => {
    let _errors = { ...errors };
    if (NVRName === "") _errors["isNVREmpty"] = true;
    if (NVRBrand === "") _errors["isNVRBrandEmpty"] = true;
    if (NVRModel === "") _errors["isNVRModelEmpty"] = true;
    if (Port === "") _errors["isPortEmpty"] = true;
    if (IP === "") _errors["isIPEmpty"] = true;
    if (Username === "") _errors["isUsernameEmpty"] = true;
    if (Password === "") _errors["isPasswordEmpty"] = true;
    setErrors({ ..._errors });
    if (Object.values(_errors).includes(true)) {
      return;
    }
    let body = {
      nvr_name: NVRName,
      nvr_brand_name: NVRBrand,
      nvr_model_name: NVRModel,
      nvr_ip: IP,
      nvr_port: Port,
      nvr_user_name: Username,
      nvr_password: Password,
    };
    setIsLoading(true);
    axios
      .post("http://192.168.1.5:8000/add_nvr_info", body)
      .then((res) => {
        notify({
          type: "success",
          msg: "NVR added successfully!",
        });
      })
      .catch((err) => {
        notify({
          type: "alert",
          msg: "Failed to save NVR detail!",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    axios
      .get("http://192.168.1.5:8000/get_brand_name")
      .then((res) => {
        setNVRBrandOption([...res.data.brand_names]);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    if (NVRBrand !== "") {
      axios
        .get("http://192.168.1.5:8000/get_model_names?brand_name=" + NVRBrand)
        .then((res) => {
          setNVRModelOption([...res.data.model_names]);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [NVRBrand]);

  return (
    <motion.div
      variants={xMotion}
      exit="exit"
      initial="hidden"
      animate="visible"
      className="_nvr_details_"
    >
      {console.log(errors["isNVRNameUnique"])}
      <BoxCard className="card_size" isLoading={isLoading}>
        <InputBox
          id="NVRName"
          header="NVR Name"
          onChange={(e) => {
            setNVRName(e.target.value);
          }}
          error={errors["isNVREmpty"] || errors["isNVRNameUnique"]}
          value={NVRName}
          onFocus={(e) => {
            clearError("isNVREmpty");
            if (NVRName) {
              uniqueCheck();
            }
          }}
          helperText={errors["isNVRNameUnique"] && "Already used"}
          onBlur={uniqueCheck}
          autoFocus
        />

        <Dropdown
          className="adjust_dd"
          optionsList={NVRBrandOption}
          handleOption={(data) => {
            setNVRBrand(data);
            setNVRModel("");
          }}
          defaultText={NVRBrand}
          label="NVR Brand"
          id="NVRBrandOption"
          error={errors.isNVRBrandEmpty}
          onFocus={() => clearError("isNVRBrandEmpty")}
        />
        {NVRBrand && (
          <Dropdown
            className="adjust_dd fadeIn"
            optionsList={NVRModelOption}
            handleOption={(data) => {
              setNVRModel(data);
            }}
            defaultText={NVRModel}
            label="NVR Model"
            id="NVRModelOption"
            onFocus={() => clearError("isNVRModelEmpty")}
            error={errors.isNVRModelEmpty}
          />
        )}
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
        />
        <InputBox
          id="Port"
          header="Port"
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
        />
        <InputBox
          id="NVRUsername"
          header="NVR Username"
          onChange={(e) => {
            const value = e.target.value;
            const regex = /^[a-zA-Z0-9]*$/;
            if (value.match(regex) || value === "") {
              setUsername(value);
            }
          }}
          error={errors["isUsernameEmpty"]}
          value={Username}
          onFocus={() => clearError("isUsernameEmpty")}
        />
        <InputBox
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
        />
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            marginTop: "1vw",
          }}
        >
          <Button
            style={{ width: "6vw" }}
            onClick={postData}
            type="gradient"
            name="Submit"
          />
        </div>
      </BoxCard>
    </motion.div>
  );
}

export const notify = (data) => {
  return toast((t) => (
    <div className="routeModal">
      <div style={{ display: "flex", alignItems: "center" }}>
        {data?.type === "success" ? (
          <i className="material-icons success_icon">done</i>
        ) : (
          <i className="material-icons modal_icon">warning</i>
        )}

        <div className="warning_content">
          <h3>{data?.type === "success" ? "Success" : "Error"}</h3>
          <p>{data?.msg}</p>
        </div>
      </div>
      <div className="warning_options">
        <i
          className="material-icons warning_icon"
          onClick={() => toast.dismiss(t.id)}
        >
          close
        </i>
      </div>
    </div>
  ));
};
