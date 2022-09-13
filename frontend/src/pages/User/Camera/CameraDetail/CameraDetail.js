import React, { useEffect, useState } from "react";
import { xMotion } from "../../../../helper/motions";
import "./cameradetails.scss";
import { motion } from "framer-motion";
import { BoxCard } from "../../../../components/card/Card";
import InputBox from "../../../../components/Inputbox/InputBox";
import Dropdown from "../../../../components/Dropdown/Dropdown";
import Button from "../../../../components/Button/Button";
import Logo from "../../../../assets/images/Logo.jpg";
import useLoading from "../../../../helper/useLoading";
import { axiosApiInstance } from "../../../../helper/request";
import { useDebouncedEffect } from "../../../../helper/useDebounce";
import Modal from "../../../../components/Modal/Modal";
import Loading from "../../../../components/Loading/Loading";
import { API_URL, SOCKET_URL } from "../../../../helper/request";
let activeInput = null;
let _testImage = null;
let timeout = null;
let camData = {
  Camera_name: "",
  Camera_source: "",
  Location: "",
  link: "",
  Username: "",
  Password: "",
};
export default function CameraDetail({ handleHistory }) {
  const [showPassErrorModal, setshowPassErrorModal] = useState({
    showPop: false,
    msg: "",
    type: "alert",
    header: "",
  });
  const [RTSPLink, setRTSPLink] = useState("");
  const [CameraName, setCameraName] = useState("");
  const [Username, setUsername] = useState("");
  const [Password, setPassword] = useState("");
  const [Location, setLocation] = useState("");
  const [oldType, setOldType] = useState("password");
  const { isLoading, loadingFinished, loading } = useLoading();
  const [CameraSource, setCameraSource] = useState(null);
  const [CameraTestImage, setCameraTestImage] = useState(null);
  const [CameraSourcesOption, setCameraSourcesOption] = useState([]);
  const [isLoadingScreen, setIsLoadingScreen] = useState(false);
  const [disableBtn, setdisableBtn] = useState(true);

  useDebouncedEffect(
    () => (CameraName || RTSPLink ? uniqueCheck() : undefined),
    [CameraName, RTSPLink],
    1000
  );

  const clearError = (name) => {
    let _errors = { ...errors };
    _errors[name] = false;
    setErrors({ ..._errors });
  };

  const uniqueCheck = async () => {
    let obj = {};
    let _err = { ...errors };
    if (activeInput === "CameraName") obj.Camera_name = CameraName;
    if (activeInput === "RTSP") obj.Link = RTSPLink;
    axiosApiInstance
      .post("camera/duplicates", obj)
      .then((res) => {
        //console.log(res);
        if (activeInput === "CameraName") {
          _err.isCameraNameUnique = false;
        }
        if (activeInput === "RTSP") {
          _err.isRTSPUnique = false;
        }

        setErrors({ ..._err });
      })
      .catch((err) => {
        //console.log(err.response);
        if (err.response.status === 409) {
          if (err.response.data.detail.includes("Camera Name")) {
            if (activeInput === "CameraName") {
              _err.isCameraNameUnique = true;
            }
            //console.log("camera name IS NOT VALID");
          }
          if (err.response.data.detail.includes("Link")) {
            //console.log("link IS NOT VALID");
            if (activeInput === "RTSP") {
              _err.isRTSPUnique = true;
            }
          }
        }
        setErrors({ ..._err });
      });
  };

  const handlePassword = (type) => {
    if (!type) {
      setOldType("password");
    } else {
      setOldType("text");
    }
  };

  const [errors, setErrors] = useState({
    isCameraNameEmpty: false,
    isCameraNameUnique: false,
    isRTSPValid: false,
    isRTSPUnique: false,
    isCameraSourceEmpty: false,
    isLocationEmpty: false,
    isUsernameEmpty: false,
    isPasswordEmpty: false,
    // isCameraTestImageEmpty:false
  });
  const rtspValidation = () => {
    let _error = { ...errors };
    let regex =
      /rtsp:\/\/\b(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\b:[0-9]+\/[a-zA-Z]+/i;
    if (RTSPLink.match(regex)) {
      _error["isRTSPValid"] = false;
      //console.log("false");
    } else {
      _error["isRTSPValid"] = true;
      //console.log("true");
    }
    setErrors({ ..._error });
  };

  const getCameraSources = () => {
    loading();
    axiosApiInstance
      .get("camera/sources")
      .then((res) => {
        let _data = res.data.Data.map((item) => item.SourceName);
        //console.log(_data);
        setCameraSourcesOption(_data);
      })
      .catch((err) => {
        setCameraSourcesOption([]);
        //console.log(err);
      })
      .finally(() => {
        loadingFinished();
      });
  };

  const resetModal = () => {
    timeout = setTimeout(() => {
      setshowPassErrorModal((prevState) => ({
        ...prevState,
        showPop: false,
        msg: "",
        type: "alert",
        header: "",
      }));
    }, 5000);
  };
  const postCameraDetail = () => {
    let _errors = { ...errors };
    if (CameraName === "") _errors["isCameraNameEmpty"] = true;
    if (!CameraSource) _errors["isCameraSourceEmpty"] = true;
    if (RTSPLink === "") _errors["isRTSPValid"] = true;
    if (Username === "") _errors["isUsernameEmpty"] = true;
    if (Password === "") _errors["isPasswordEmpty"] = true;
    if (Location === "") _errors["isLocationEmpty"] = true;
    setErrors({ ..._errors });
    if (Object.values(_errors).includes(true)) {
      return;
    }

    let body = {
      Link: RTSPLink,
      CameraSource,
      Type: "Test",
      Username,
      Password,
    };

    //console.log(body);
    setIsLoadingScreen(true);
    axiosApiInstance
      .post("camera/capture", body)
      .then((res) => {
        setCameraTestImage(res.data.image_path);
        _testImage = res.data.image_path;
        //console.log(res);
        camData = {
          Camera_name: CameraName,
          Camera_source: CameraSource,
          Location,
          link: RTSPLink,
          Username,
          Password,
        };
        setdisableBtn(false);
        //console.log(camData);
      })
      .catch((err) => {
        setCameraTestImage(null);
        //console.log(err.response);
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Unable to capture image.",
          type: "alert",
          header: "Error",
        }));
        clearTimeout(timeout);
        resetModal();
      })
      .finally(() => {
        setIsLoadingScreen(false);
      });
  };

  const postData = () => {
    let body = {
      Camera_name: CameraName,
      Camera_source: CameraSource,
      Location: Location,
      link: RTSPLink,
      Username,
      Password,
      TestImage: CameraTestImage,
      RefImgDay: "",
      RefImgNight: "",
      Resolution: "",
    };
    setIsLoadingScreen(true);

    axiosApiInstance
      .get("camera/configure_services")
      .then((res) => {
        axiosApiInstance
          .post("camera", body)
          .then((res) => {
            setshowPassErrorModal((prevState) => ({
              ...prevState,
              showPop: true,
              msg: "Camera Added Successfully!",
              type: "success",
              header: "Success",
            }));
            var url = new URL(window.location.href);
            url.searchParams.append("cameraID", res.data.Camera_id);
            window.history.pushState(null, null, url);
            handleHistory("App Scheduler");
          })
          .catch((err) => {
            setshowPassErrorModal((prevState) => ({
              ...prevState,
              showPop: true,
              msg: "Something went wrong!",
              type: "alert",
              header: "Error",
            }));
            clearTimeout(timeout);
            resetModal();
            //console.log(err.response);
          })
          .finally(() => {
            setIsLoadingScreen(false);
          });
      })
      .catch((err) => {
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Something went wrong!",
          type: "alert",
          header: "Error",
        }));
        clearTimeout(timeout);
        resetModal();
      });
  };
  useEffect(() => {
    const authResult = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(authResult.entries());
    if (Object.keys(params).length > 0) {
      window.location.href = "/camera";
    }
    getCameraSources();
  }, []);

  useEffect(() => {
    let arr = [];
    //console.log(CameraName, camData.Camera_name);
    if (CameraName !== camData.Camera_name) {
      arr.push(true);
    }
    if (CameraSource !== camData.Camera_source) {
      arr.push(true);
    }
    if (RTSPLink !== camData.link) {
      arr.push(true);
    }
    if (Location !== camData.Location) {
      arr.push(true);
    }
    if (Username !== camData.Username) {
      arr.push(true);
    }
    if (Password !== camData.Password) {
      arr.push(true);
    }
    if (arr.length > 0) {
      setdisableBtn(true);
      setCameraTestImage(null);
    } else {
      setCameraTestImage(_testImage);
      setdisableBtn(false);
    }
  }, [CameraName, CameraSource, RTSPLink, Username, Password, Location]);

  return (
    <motion.div
      variants={xMotion}
      exit="exit"
      initial="hidden"
      animate="visible"
      className="_camera_details_"
    >
      <BoxCard className="card_size">
        <InputBox
          id="CameraName"
          header="Camera Name"
          disabled={isLoading}
          // onChange={(e) => {
          //   activeInput = e.target.id;
          //   setCameraName(e.target.value);
          // }}
          onChange={(e) => {
            activeInput = e.target.id;
            const value = e.target.value;
            const regex = /^[a-zA-Z0-9 ]*$/;
            if (value.match(regex) || value === "") {
              setCameraName(value);
            }
          }}
          error={errors["isCameraNameEmpty"] || errors["isCameraNameUnique"]}
          value={CameraName}
          helperText={errors["isCameraNameUnique"] && "Already used"}
          onFocus={(e) => {
            clearError("isCameraNameEmpty");
            activeInput = e.target.id;
            if (CameraName) {
              uniqueCheck();
            }
          }}
          onBlur={uniqueCheck}
        />
        <Dropdown
          optionsList={CameraSourcesOption}
          handleOption={(data) => setCameraSource(data)}
          defaultText={CameraSource}
          label="Camera Source"
          isLoading={isLoading}
          id="CameraSource"
          error={errors["isCameraSourceEmpty"]}
          onMouseDown={() => clearError("isCameraSourceEmpty")}
        />
        <InputBox
          id="RTSP"
          header="RTSP Link"
          onChange={(e) => {
            activeInput = e.target.id;
            const value = e.target.value;
            //console.log(value);
            const regex = /^[a-zA-Z0-9-_:./?=&]*$/;
            if (value.match(regex) || value === "") {
              setRTSPLink(value);
            }
          }}
          value={RTSPLink}
          // onChange={(e) => setRTSPLink(e.target.value)}
          error={errors["isRTSPUnique"] || errors["isRTSPValid"]}
          onBlur={uniqueCheck}
          onFocus={(e) => {
            clearError("isRTSPValid");
            activeInput = e.target.id;
            if (RTSPLink) {
              uniqueCheck();
            }
          }}
          helperText={errors["isRTSPUnique"] && "Already used"}
        />
        <InputBox
          id="RTSPUsername"
          header="RTSP Username"
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
          //   onInput={(e) => checkPassword(e.target.value)}
          error={errors["isPasswordEmpty"]}
          type={oldType}
          typeValue={(data) => handlePassword(data)}
          password
          header="RTSP Password *"
          // onChange={(e) => setPassword(e.target.value)}
          onChange={(e) => {
            const value = e.target.value;
            // const regex = /^[a-zA-Z0-9!@#$%&()+]*$/;
            var regex = /^\S+$/;
            if (value.match(regex) || value === "") {
              setPassword(value);
            }
          }}
          onFocus={() => clearError("isPasswordEmpty")}
          value={Password}
        />
        <InputBox
          id="Location"
          header="Location"
          onChange={(e) => {
            const value = e.target.value;
            const regex = /^[a-zA-Z0-9 ]*$/;
            if (value.match(regex) || value === "") {
              setLocation(value);
            }
          }}
          error={errors["isLocationEmpty"]}
          value={Location}
          onFocus={() => clearError("isLocationEmpty")}
        />

        <div
          style={{
            position: "absolute",
            bottom: "1vw",
            left: 0,
            width: "100%",
            display: "flex",
            justifyContent: "space-evenly",
          }}
        >
          {!CameraTestImage && (
            <p
              style={{
                position: "absolute",
                bottom: "3vw",
                color: "red",
                fontSize: "0.7vw",
              }}
            >
              Please capture the image before proceeding.
            </p>
          )}

          <Button
            style={{ width: "8vw" }}
            onClick={postData}
            type="gradient"
            name="Next"
            disabled={!CameraTestImage || disableBtn}
          />
        </div>
      </BoxCard>
      <BoxCard className="snap_card_size">
        <p>{CameraName}</p>
        <img
          src={
            CameraTestImage
              ? SOCKET_URL + CameraTestImage + "?" + Math.random()
              : Logo
          }
          className="snap"
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
            onClick={postCameraDetail}
            type="gradient"
            name="Capture"
          />
        </div>
      </BoxCard>
      {showPassErrorModal.showPop && (
        <Modal
          className={"transparent_modal"}
          handleClose={() => {
            setshowPassErrorModal((prevState) => ({
              ...prevState,
              showPop: false,
            }));
          }}
          type={showPassErrorModal.type}
          errorHeader={showPassErrorModal.header}
          // errorHeader={
          //   showPassErrorModal.header === "Error" ? "Error" : "Success"
          // }
          errorText={showPassErrorModal.msg}
        />
      )}
      {isLoadingScreen && <Loading type={"transparent"} text={"Loading"} />}
    </motion.div>
  );
}
