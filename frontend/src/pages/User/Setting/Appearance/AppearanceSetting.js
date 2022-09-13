import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import "./appearance.scss";
import { BoxCard } from "../../../../components/card/Card";
import InputBox from "../../../../components/Inputbox/InputBox";
import color from "../../../../assets/images/colour.png";
import company_name from "../../../../assets/images/company_name.png";
import navbar_dark from "../../../../assets/images/navbar_dark.png";
import navbar_light from "../../../../assets/images/navbar_light.png";
import favicon from "../../../../assets/images/favicon.png";
import ps from "../../../../assets/images/ps.png";
import { HexColorPicker, HexColorInput } from "react-colorful";
import useClickOutside from "../../../../helper/useClickOutside";
import Scrollbars from "react-custom-scrollbars";
import Button from "../../../../components/Button/Button";
import toast from "react-hot-toast";
import { axiosApiInstance, SOCKET_URL } from "../../../../helper/request";
import Loading from "../../../../components/Loading/Loading";
import Modal from "../../../../components/Modal/Modal";
let apiData = {};
export default function AppearanceSetting() {
  const primaryRef = useRef();
  const secondaryRef = useRef();
  const gColor1Ref = useRef();
  const gColor2Ref = useRef();
  const solidColorRef = useRef();

  const [PrimaryColor, setPrimaryColor] = useState("#1DB8CE");
  const [SecondaryColor, setSecondaryColor] = useState("#1DB8CE");
  const [GradientColor1, setGradientColor1] = useState("#1DB8CE");
  const [GradientColor2, setGradientColor2] = useState("#1DB8CE");
  const [SolidColor, setSolidColor] = useState("#1DB8CE");
  const [CompanyName, setCompanyName] = useState("");
  const [DarkLogo, setDarkLogo] = useState(null);
  const [LightLogo, setLightLogo] = useState(null);
  const [Favicon, setFavicon] = useState(null);
  const [Video, setVideo] = useState(null);
  const [activePreview, setactivePreview] = useState(null);
  const [activeTheme, setActiveTheme] = useState("Light");
  const [isLoading, setisLoading] = useState(false);
  const [isClearFilter, setisClearFilter] = useState(false);
  const [Popup, setPopup] = useState(true);

  const [errors, setErrors] = useState({
    isCNameEmpty: false,
    isDarkLogoEmpty: false,
    isLightLogoEmpty: false,
    isVideoLogoEmpty: false,
  });

  const clearError = (name) => {
    let _errors = { ...errors };
    _errors[name] = false;
    setErrors({ ..._errors });
  };

  const [isPrimaryColorOpen, SetIsPrimaryColorOpen] = useState(false);
  const [isSecondaryColorOpen, SetIsSecondaryColorOpen] = useState(false);
  const [isGradientColor1Open, SetIsGradientColor1Open] = useState(false);
  const [isGradientColor2Open, SetIsGradientColor2Open] = useState(false);
  const [isSolidColorOpen, SetIsSolidColorOpen] = useState(false);

  const primaryClose = useCallback(() => SetIsPrimaryColorOpen(false), []);
  useClickOutside(primaryRef, primaryClose);

  const secondaryClose = useCallback(() => SetIsSecondaryColorOpen(false), []);
  useClickOutside(secondaryRef, secondaryClose);

  const gradientColor1Close = useCallback(
    () => SetIsGradientColor1Open(false),
    []
  );
  useClickOutside(gColor1Ref, gradientColor1Close);

  const gradientColor2Close = useCallback(
    () => SetIsGradientColor2Open(false),
    []
  );
  useClickOutside(gColor2Ref, gradientColor2Close);

  const solidColorClose = useCallback(() => SetIsSolidColorOpen(false), []);
  useClickOutside(solidColorRef, solidColorClose);

  const getThemeData = () => {
    axiosApiInstance.get("host/theme").then((res) => {
      let { detail } = res.data;
      apiData = { ...detail };
      console.log(apiData);
      setCompanyName(detail.label);
      setPrimaryColor(detail.primary_colour);
      setSecondaryColor(detail.secondary_colour);
      setGradientColor1(detail.button_colour2_primary);
      setGradientColor2(detail.button_colour2_secondary);
      setSolidColor(detail.button_colour1);
      setFavicon(apiData.favicon);
      setLightLogo(apiData.logo_white_theme);
      setDarkLogo(apiData.logo_black_theme);
      setVideo(apiData.startup_video);
    });
  };

  const validateImage = (type) => {
    console.log(type);
    const res = ["image/png", "image/jpg", "image/jpeg"].some(
      (item) => item == type
    );
    return res;
  };

  const postData = () => {
    if (!CompanyName) {
      notify({
        type: "alert",
        msg: "Company Name Required!",
      });
      return;
    }
    let arr = [];
    let formData = new FormData();
    if (CompanyName !== apiData.label) {
      formData.append("label", CompanyName);
      console.log(CompanyName);
      arr.push("CompanyName");
    }

    if (LightLogo !== apiData.logo_white_theme) {
      if (!validateImage(LightLogo.type)) {
        notify({
          type: "alert",
          msg: "Invalid Light Theme Image Format!",
        });
        return;
      }
      formData.append("logo_white_theme", LightLogo, LightLogo.name);
      arr.push("LightLogo");
    }
    if (DarkLogo !== apiData.logo_black_theme) {
      if (!validateImage(DarkLogo.type)) {
        notify({
          type: "alert",
          msg: "Invalid Dark Theme Image Format!",
        });
        return;
      }
      formData.append("logo_black_theme", DarkLogo, DarkLogo.name);
      arr.push("DarkLogo");
    }
    console.log(Favicon)
    if (Favicon !== apiData.favicon) {
      const res = ["image/x-icon", "image/vnd.microsoft.icon"].some(
        (item) => item === Favicon.type
      );
      if (!res) {
        notify({
          type: "alert",
          msg: "Invalid Favicon Image Format!",
        });
        return;
      }

      formData.append("favicon", Favicon, Favicon.name);
      arr.push("Favicon");
    }
    if (Video !== apiData.startup_video) {
      if (Video.type != "video/mp4") {
        notify({
          type: "alert",
          msg: "Invalid Video Format!",
        });
        return;
      }
      formData.append("startup_video", Video, Video.name);
      arr.push("Video");
    }
    if (PrimaryColor !== apiData.primary_colour) {
      formData.append("primary_colour", PrimaryColor);
      arr.push("PrimaryColor");
    }
    if (SecondaryColor !== apiData.secondary_colour) {
      formData.append("secondary_colour", SecondaryColor);
      arr.push("SecondaryColor");
    }

    if (GradientColor1 !== apiData.button_colour2_primary) {
      formData.append("button_colour2_primary", GradientColor1);
      arr.push("GradientColor1");
    }
    if (GradientColor2 !== apiData.button_colour2_secondary) {
      formData.append("button_colour2_secondary", GradientColor2);
      arr.push("GradientColor2");
    }
    console.log(SolidColor, apiData.button_colour1);
    if (SolidColor !== apiData.button_colour1) {
      formData.append("button_colour1", SolidColor);
      arr.push("SolidColor");
    }
    setisLoading(true);
    axiosApiInstance
      .post("host/theme", formData)
      .then((res) => {
        notify({
          type: "success",
          msg: "Theme updated successfully!",
        });
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      })
      .catch((err) => {
        notify({
          type: "alert",
          msg: "Something went wrong!",
        });
      })
      .finally(() => {
        setisLoading(false);
      });
  };

  const postDefaultTheme = () => {
    setisLoading(true);
    axiosApiInstance
      .post("host/theme/default", {})
      .then((res) => {
        notify({
          type: "success",
          msg: "Default theme applied successfully!",
        });
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      })
      .catch((err) => {
        notify({
          type: "alert",
          msg: "Something went wrong!",
        });
      })
      .finally(() => {
        setisLoading(false);
      });
  };

  useEffect(() => {
    getThemeData();
  }, []);

  return (
    <motion.div className="_appearance_setting_">
      {console.log(Favicon)}
      <BoxCard className="card_size">
        <Scrollbars autoHeight autoHeightMax="71vh">
          <div
            style={{
              padding: "1vw",
              paddingLeft: "1.5vw",
              paddingBottom: "1.5vw",
            }}
          >
            <AppearanceHeader
              name="Company Name"
              onClick={setactivePreview}
              style={{
                opacity: activePreview === "Company Name" && "1",
              }}
            />
            <InputBox
              id="CompanyName"
              onChange={(e) => setCompanyName(e.target.value)}
              error={errors["isCNameEmpty"]}
              value={CompanyName}
              onFocus={() => {
                clearError("isCNameEmpty");
                setactivePreview("Company Name");
              }}
            />
            <BoxCard className="logo_card">
              <AppearanceHeader
                name="Logo"
                onClick={setactivePreview}
                style={{
                  opacity: activePreview === "Logo" && "1",
                }}
              />
              <AppearanceUpload
                name="Light Theme"
                value={LightLogo}
                type="image/png,image/jpg,image/jpeg"
                onChange={(e) => {
                  if (e.target.value) {
                    setLightLogo(e.target.files[0]);
                  } else {
                    setLightLogo(apiData.logo_white_theme);
                  }
                }}
                onFocus={() => {
                  setactivePreview("Logo");
                }}
              />
              <AppearanceUpload
                name="Dark Theme"
                type="image/png,image/jpg,image/jpeg"
                value={DarkLogo}
                onChange={(e) => {
                  if (e.target.value) {
                    setDarkLogo(e.target.files[0]);
                  } else {
                    setDarkLogo(apiData.logo_black_theme);
                  }
                }}
                onFocus={() => {
                  setactivePreview("Logo");
                }}
              />
            </BoxCard>

            <BoxCard className="logo_card">
              <AppearanceHeader
                name="Favicon"
                onClick={setactivePreview}
                style={{
                  opacity: activePreview === "Favicon" && "1",
                }}
              />
              <AppearanceUpload
                name="Image"
                type="image/x-icon"
                onChange={(e) => {
                  console.log(e.target.files);
                  if (e.target.value) {
                    setFavicon(e.target.files[0]);
                  } else {
                    setFavicon(apiData.favicon);
                  }
                }}
                value={Favicon}
                onFocus={() => {
                  setactivePreview("Favicon");
                }}
              />
            </BoxCard>

            <BoxCard className="logo_card">
              <AppearanceHeader
                name="Start-up screen"
                onClick={setactivePreview}
                style={{
                  opacity: activePreview === "Start-up screen" && "1",
                }}
              />
              <AppearanceUpload
                name="Video"
                type="video/mp4"
                onChange={(e) => {
                  console.log(e.target.value);
                  if (e.target.value) {
                    setVideo(e.target.files[0]);
                    setactivePreview(null);
                    setTimeout(() => {
                      setactivePreview("Start-up screen");
                    }, 500);
                  } else {
                    setVideo(apiData.startup_video);
                    setactivePreview(null);
                    setTimeout(() => {
                      setactivePreview("Start-up screen");
                    }, 500);
                  }
                }}
                value={Video}
                onFocus={() => {
                  setactivePreview("Start-up screen");
                }}
              />
            </BoxCard>

            <BoxCard className="logo_card">
              <AppearanceHeader
                name="Theme color"
                onClick={(name) => {
                  setactivePreview(name);
                  setActiveTheme("Light");
                }}
                style={{
                  opacity: activePreview === "Theme color" && "1",
                }}
              />
              <p className="i_header_">Primary Theme Color</p>
              <BoxCard className="a_color_card primary">
                <div className="color_wrapper">
                  {/* <p style={{ color: PrimaryColor }}>#</p> */}
                  <HexColorInput
                    color={PrimaryColor}
                    onChange={setPrimaryColor}
                    style={{ color: PrimaryColor }}
                  />
                </div>
                <img
                  src={color}
                  onClick={() => {
                    setactivePreview("Theme color");
                    SetIsPrimaryColorOpen(!isPrimaryColorOpen);
                  }}
                />

                {isPrimaryColorOpen && (
                  <div
                    className="popupfromLeft fadeIn"
                    style={{ right: "-3%" }}
                    ref={primaryRef}
                  >
                    <HexColorPicker
                      color={PrimaryColor}
                      onChange={setPrimaryColor}
                    />
                  </div>
                )}
              </BoxCard>

              <p className="i_header_">Secondary Theme Color</p>
              <BoxCard className="a_color_card secondary">
                <div className="color_wrapper">
                  {/* <p style={{ color: SecondaryColor }}>{SecondaryColor}</p> */}
                  <HexColorInput
                    color={SecondaryColor}
                    onChange={setSecondaryColor}
                    style={{ color: SecondaryColor }}
                  />
                </div>
                <img
                  src={color}
                  onClick={() => {
                    setactivePreview("Theme color");
                    SetIsSecondaryColorOpen(!isSecondaryColorOpen);
                  }}
                />
                {isSecondaryColorOpen && (
                  <div
                    className="popupfromLeft fadeIn"
                    style={{ right: "-3%" }}
                    ref={secondaryRef}
                  >
                    <HexColorPicker
                      color={SecondaryColor}
                      onChange={setSecondaryColor}
                    />
                  </div>
                )}
              </BoxCard>
            </BoxCard>

            <BoxCard className="logo_card btn_color">
              <AppearanceHeader
                name="Button Color"
                onClick={setactivePreview}
                style={{
                  opacity: activePreview === "Button Color" && "1",
                }}
              />
              <div className="gradient_btn__">
                <div style={{ flex: 1, marginRight: "1vw" }}>
                  <p className="i_header_">Gradient Color 1</p>
                  <BoxCard className="a_color_card primary">
                    <div className="color_wrapper">
                      {/* <p style={{ color: GradientColor1 }}>{GradientColor1}</p> */}
                      <HexColorInput
                        color={GradientColor1}
                        onChange={setGradientColor1}
                        style={{ color: GradientColor1, width: "80%" }}
                      />
                    </div>
                    <img
                      src={color}
                      onClick={() => {
                        SetIsGradientColor1Open(!isGradientColor1Open);
                        setactivePreview("Button Color");
                      }}
                    />

                    {isGradientColor1Open && (
                      <div className="popover fadeIn" ref={gColor1Ref}>
                        <HexColorPicker
                          color={GradientColor1}
                          onChange={setGradientColor1}
                        />
                      </div>
                    )}
                  </BoxCard>
                </div>
                <div style={{ flex: 1 }}>
                  <p className="i_header_">Gradient Color 2</p>
                  <BoxCard className="a_color_card secondary">
                    <div className="color_wrapper">
                      {/* <p style={{ color: GradientColor2 }}>{GradientColor2}</p> */}
                      <HexColorInput
                        color={GradientColor2}
                        onChange={setGradientColor2}
                        style={{ color: GradientColor2, width: "80%" }}
                      />
                    </div>
                    <img
                      src={color}
                      onClick={() => {
                        setactivePreview("Button Color");

                        SetIsGradientColor2Open(!isGradientColor2Open);
                      }}
                    />
                    {isGradientColor2Open && (
                      <div className="popupfromLeft fadeIn" ref={gColor2Ref}>
                        <HexColorPicker
                          color={GradientColor2}
                          onChange={setGradientColor2}
                        />
                      </div>
                    )}
                  </BoxCard>
                </div>
              </div>

              <p className="i_header_">Solid Color</p>
              <BoxCard
                className="a_color_card primary"
                style={{ width: "100%" }}
              >
                <div className="color_wrapper">
                  {/* <p style={{ color: SolidColor }}>{SolidColor}</p> */}
                  <HexColorInput
                    color={SolidColor}
                    onChange={setSolidColor}
                    style={{ color: SolidColor }}
                  />
                </div>
                <img
                  src={color}
                  onClick={() => {
                    setactivePreview("Button Color");
                    SetIsSolidColorOpen(!isSolidColorOpen);
                  }}
                />

                {isSolidColorOpen && (
                  <div
                    className="popupfromLeft fadeIn"
                    style={{ right: "-4%" }}
                    ref={solidColorRef}
                  >
                    <HexColorPicker
                      color={SolidColor}
                      onChange={setSolidColor}
                    />
                  </div>
                )}
              </BoxCard>
            </BoxCard>
          </div>
        </Scrollbars>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-evenly",
            marginTop: "2vw",
          }}
        >
          <Button
            style={{ width: "8vw" }}
            onClick={postData}
            type="gradient"
            name="Apply Filter"
          />
          <Button
            style={{ width: "8vw" }}
            name="Clear Filter"
            onClick={() => setisClearFilter(true)}
          />
        </div>

        <input
          style={{ display: "none" }}
          type="file"
          id="uploadTheme"
          accept=".zip"
          onChange={(e) => {
            let file = e.target.files[0];
            console.log(file.type != "application/zip");
            if (
              file.type === "application/x-zip-compressed" ||
              file.type === "application/zip"
            ) {
              setisLoading(true);
              let formData = new FormData();
              formData.append("zip_file", file, file.name);
              axiosApiInstance
                .post("host/uploadtheme", formData)
                .then((res) => {
                  notify({
                    type: "success",
                    msg: "ZIP file uploaded successfully!",
                  });
                })
                .catch((err) => {
                  notify({
                    type: "alert",
                    msg: "ZIP file upload failed successfully!",
                  });
                })
                .finally(() => {
                  setisLoading(false);
                });
            } else {
              notify({
                type: "alert",
                msg: "Please select only zip file!",
              });
              return;
            }
          }}
        ></input>
      </BoxCard>
      <BoxCard className="preview_theme">
        <p className="preview">Preview</p>
        {activePreview === "Company Name" && (
          <div className="cname_section fadeIn">
            <img
              alt="company_name"
              className="company_name"
              src={company_name}
            />
            <span className="input_c_name">
              © Copyright 2022 {CompanyName}. All rights reserved.
            </span>
          </div>
        )}
        {isLoading && <Loading type={"transparent"} text={"Loading"} />}
        {activePreview === "Logo" && (
          <div className="logo_section fadeIn">
            {activeTheme === "Light" ? (
              <div className="light_theme fadeIn">
                {LightLogo &&
                  activeTheme === "Light" &&
                  (typeof LightLogo === "object" ? (
                    <img
                      className="selectedLogo  fadeIn"
                      src={URL.createObjectURL(LightLogo)}
                    />
                  ) : (
                    <img
                      className="selectedLogo  fadeIn"
                      src={SOCKET_URL + LightLogo}
                    />
                  ))}

                <img alt="company_name" className="light" src={navbar_light} />
              </div>
            ) : (
              <div className="dark_theme fadeIn">
                {DarkLogo &&
                  activeTheme === "Dark" &&
                  (typeof DarkLogo === "object" ? (
                    <img
                      className="selectedLogo  fadeIn"
                      src={URL.createObjectURL(DarkLogo)}
                    />
                  ) : (
                    <img
                      className="selectedLogo  fadeIn"
                      src={SOCKET_URL + DarkLogo}
                    />
                  ))}
                <img alt="company_name" className="dark" src={navbar_dark} />
              </div>
            )}

            <Button
              name={
                activeTheme === "Light" ? "Switch To Dark" : "Switch To Light"
              }
              onClick={() => {
                if (activeTheme === "Light") {
                  setActiveTheme("Dark");
                } else setActiveTheme("Light");
              }}
            />
          </div>
        )}
        {/* src="https://media.w3.org/2010/05/sintel/trailer.mp4" */}

        {activePreview === "Start-up screen" && (
          <video className="video_section  fadeIn" autoPlay muted loop>
            {console.log(typeof Video)}
            {typeof Video === "object" ? (
              <source
                id="mp4"
                src={URL.createObjectURL(Video)}
                type="video/mp4"
              />
            ) : (
              <source id="mp4" src={SOCKET_URL + Video} type="video/mp4" />
            )}
          </video>
        )}

        {activePreview === "Theme color" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div className="theme_section fadeIn">
              <img
                className="theme_img fadeIn"
                src={activeTheme === "Light" ? ps : navbar_dark}
              />
              {/* <img clas className="selectedLogo fadeIn" src={LightLogo} /> */}
              <div
                className="theme_side_nav"
                style={{
                  backgroundColor:
                    activeTheme === "Light" ? PrimaryColor : "#181d23",
                }}
              >
                <span className="dots" />
                <span className="dots _1" />
                <span className="dots _2" />
                <span className="dots _3" />
                <span className="dots _4" />
                <span className="dots _5" />
              </div>

              <div
                className="theme_sec_box"
                style={{ backgroundColor: SecondaryColor }}
              >
                <div
                  className="theme_box fadeIn"
                  style={{
                    backgroundColor:
                      activeTheme === "Light" ? "white" : "#29313a",
                  }}
                />
              </div>
            </div>
            <Button
              name={
                activeTheme === "Light" ? "Switch To Dark" : "Switch To Light"
              }
              onClick={() => {
                if (activeTheme === "Light") {
                  setActiveTheme("Dark");
                } else setActiveTheme("Light");
              }}
            />
          </div>
        )}

        {activePreview === "Button Color" && (
          <div className="button_section fadeIn">
            <img className="theme_img fadeIn" src={ps} />
            <div className="btn_holder">
              <Button
                type={"gradient"}
                name={"Gradient"}
                style={{
                  background:
                    " linear-gradient(0deg," +
                    GradientColor1 +
                    " 5%," +
                    GradientColor2 +
                    " 60%)",
                }}
              />
              <Button style={{ background: SolidColor }} name={"Solid"} />
            </div>
          </div>
        )}

        {activePreview === "Favicon" && (
          <div className="favicon_section fadeIn">
            <img className="theme_img fadeIn" src={favicon} />
            {typeof Favicon === "object" ? (
              <React.Fragment>
                <img
                  className="fav_small fadeIn"
                  src={URL.createObjectURL(Favicon)}
                />
                <img
                  className="fav_large fadeIn"
                  src={URL.createObjectURL(Favicon)}
                />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <img className="fav_small fadeIn" src={SOCKET_URL + Favicon} />
                <img className="fav_large fadeIn" src={SOCKET_URL + Favicon} />
              </React.Fragment>
            )}
          </div>
        )}
      </BoxCard>
      {isLoading && <Loading type={"transparent"} text={"Loading"} />}
      {isClearFilter && (
        <Modal
          onConfirm={postDefaultTheme}
          handleClose={() => {
            setisClearFilter(false);
          }}
          type="confirm"
          errorHeader="Alert"
          errorText="Are you sure?"
        />
      )}
      {Popup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.4,
          }}
          className="user_selection_"
        >
          <div id="add_user" className="detail_container fadeIn">
            <h1>Before you continue...</h1>
            <div
              className="close"
              onClick={() => {
                setPopup(false);
              }}
            >
              <i className="material-icons" style={{ color: "#fff" }}>
                close
              </i>
            </div>
            <h2>Import Theme</h2>
            <p className="sub">Do you want to import already created theme?</p>
            <Button
              style={{ width: "14vw", fontSize: "0.8vw", alignSelf: "center" }}
              onClick={() => {
                document.getElementById("uploadTheme").click();
              }}
              name="Import"
              type={"gradient"}
            />
            <div className="_or">
              <div className="hr_" />
              <span>OR</span>
            </div>
            <h2>Config Theme</h2>
            <p className="sub">Do you want to configure theme manually?</p>
            <Button
              style={{ width: "14vw", fontSize: "0.8vw", alignSelf: "center" }}
              onClick={() => {
                setPopup(false);
              }}
              name="Configure"
              type={"gradient"}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

const AppearanceHeader = ({ name, onClick, style }) => {
  return (
    <div className="a_header">
      <p>{name}</p>
      <i onClick={() => onClick(name)} style={style}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.952 10.635">
          <path
            id="Path_10208"
            data-name="Path 10208"
            d="M13.976,10.994a6.549,6.549,0,0,1,5.769,3.323,6.669,6.669,0,0,1-11.539,0,6.549,6.549,0,0,1,5.769-3.323m0-1.994A8.568,8.568,0,0,0,6,14.317a8.641,8.641,0,0,0,15.952,0A8.568,8.568,0,0,0,13.976,9Zm0,7.311a1.994,1.994,0,1,1,1.994-1.994A1.991,1.991,0,0,1,13.976,16.311Z"
            transform="translate(-6 -9)"
          />
        </svg>
      </i>
    </div>
  );
};

export const AppearanceUpload = ({
  name,
  value,
  onChange,
  type,
  onFocus,
  defaultText,
}) => {
  return (
    <div className="a_upload">
      <p className="i_header_">{name}</p>
      <BoxCard className={"a_upload_card"}>
        <p>
          {value ? (
            value.name ? (
              value.name
            ) : (
              value.split("/").pop()
            )
          ) : defaultText ? (
            <p className="defaultText">{defaultText}</p>
          ) : (
            "png only - 640x480px"
          )}
        </p>
        <i className="material-icons">file_upload</i>
        <input
          accept={type}
          className="fileInput"
          type="file"
          onChange={onChange}
          onFocus={onFocus}
        />
      </BoxCard>
    </div>
  );
};

export const notify = (data) => {
  return toast(
    (t) => (
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
    ),
    {
      duration: 3000,
    }
  );
};
