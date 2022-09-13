import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import Button from "../../../../components/Button/Button";
import { BoxCard } from "../../../../components/card/Card";
import Dropdown from "../../../../components/Dropdown/Dropdown";
import InputBox from "../../../../components/Inputbox/InputBox";
import MultiSelectDropdown from "../../../../components/MultiSelectDropdown/MultiSelectDropdown";
import SwitchBox from "../../../../components/SwitchBox/SwitchBox";
import { xMotion } from "../../../../helper/motions";
import { axiosApiInstance } from "../../../../helper/request";
import Modal from "../../../../components/Modal/Modal";
import useModal from "../../../../helper/useModal";
import PhoneInputBox from "../../../../components/PhoneInputBox/PhoneInputBox";
import "./notification.scss";
import Loading from "../../../../components/Loading/Loading";

let dialCode = "";
let msg = "";
let timeout = "";
let _MobileNoLength = 12;
let data = {
  detail: {
    ticketing: {
      type: {
        type: "dropdown",
        value: "",
        options: ["Diycam Cloud"],
      },
    },
    whatsapp: {
      serviceStatus: false,
      link: "https://infinityos.s3.ap-south-1.amazonaws.com/Whatsapp+Documentation.pdf",
      url: {
        type: "string",
        value: "",
      },
      username: {
        type: "string",
        value: "",
      },
      password: {
        type: "password",
        value: "",
      },
      namespace: {
        type: "string",
        value: "",
      },
      template: {
        type: "string",
        value: "",
      },
      language: {
        type: "dropdown",
        value: "en",
        options: {
          Afrikaans: "af",
          Albanian: "sq",
          Arabic: "ar",
          Azerbaijani: "az",
          Bengali: "bn",
          Bulgarian: "bg",
          Catalan: "ca",
          "Chinese (CHN)": "zh_CN",
          "Chinese (HKG)": "zh_HK",
          "Chinese (TAI)": "zh_TW",
          Croatian: "hr",
          Czech: "cs",
          Danish: "da",
          Dutch: "nl",
          English: "en",
          "English (UK)": "en_GB",
          "English (US)": "en_US",
          Estonian: "et",
          Filipino: "fil",
          Finnish: "fi",
          French: "fr",
          Georgian: "ka",
          German: "de",
          Greek: "el",
          Gujarati: "gu",
          Hausa: "ha",
          Hebrew: "he",
          Hindi: "hi",
          Hungarian: "hu",
          Indonesian: "id",
          Irish: "ga",
          Italian: "it",
          Japanese: "ja",
          Kannada: "kn",
          Kazakh: "kk",
          Kinyarwanda: "rw_RW",
          Korean: "ko",
          "Kyrgyz (Kyrgyzstan)": "ky_KG",
          Lao: "lo",
          Latvian: "lv",
          Lithuanian: "lt",
          Macedonian: "mk",
          Malay: "ms",
          Malayalam: "ml",
          Marathi: "mr",
          Norwegian: "nb",
          Persian: "fa",
          Polish: "pl",
          "Portuguese (BR)": "pt_BR",
          "Portuguese (POR)": "pt_PT",
          Punjabi: "pa",
          Romanian: "ro",
          Russian: "ru",
          Serbian: "sr",
          Slovak: "sk",
          Slovenian: "sl",
          Spanish: "es",
          "Spanish (ARG)": "es_AR",
          "Spanish (SPA)": "es_ES",
          "Spanish (MEX)": "es_MX",
          Swahili: "sw",
          Swedish: "sv",
          Tamil: "ta",
          Telugu: "te",
          Thai: "th",
          Turkish: "tr",
          Ukrainian: "uk",
          Urdu: "ur",
          Uzbek: "uz",
          Vietnamese: "vi",
          Zulu: "zu",
        },
        default: "English",
      },
      contact_number: {
        type: "phone",
        value: "",
        depends_on: "serviceStatus",
      },
      add_contact: {
        type: "button",
        value: "",
        depends_on: "serviceStatus",
        options: {
          action: "add",
          to: "contacts.value",
        },
      },
      contacts: {
        type: "multi_dropdown",
        value: {},
        default: "",
        depends_on: "serviceStatus",
        options: {},
      },
    },
    email: {
      warning: "SMTP settings required.",
      email_id: {
        type: "string",
        value: "",
      },
      add_email: {
        type: "button",
        value: "",
        options: {
          action: "add",
          to: "emails.value",
        },
      },
      emails: {
        type: "multi_dropdown",
        value: [],
        default: "",
        options: [],
      },
    },
    telegram: {
      link: "https://infinityos.s3.ap-south-1.amazonaws.com/telegram.pdf",
      token: {
        type: "password",
        value: "",
      },
      channel: {
        type: "string",
        value: "",
      },
    },
  },
};

export default function NotificationSetting({
  setactiveSetting,
  setIsLoading,
  isLoading,
}) {
  const [renderComponentFlag, setRenderComponentFlag] = useState(false);
  const [buttonStateMapping, setButtonStateMapping] = useState({});
  const [isConfirm, setIsConfirm] = useState(false);
  const [isLoading2, setisLoading2] = useState(false);
  const [isConfirm2, setIsConfirm2] = useState(false);
  const [boxCardList, setBoxCardList] = useState([]);
  const [actionSettingsComponents, setActionSettingsComponent] = useState(
    data["detail"]
  );
  const [showPassErrorModal, setshowPassErrorModal] = useState({
    showPop: false,
    msg: "Please check the details",
    type: "alert",
    header: "Error",
  });
  const [componentToBeRendered, setComponentToBeRendered] = useState();
  const [currentAction, setCurrentAction] = useState("");
  const [modalType, setModalType] = useState("success");
  const { modalOpen, close, open } = useModal();
  const resetModal = () => {
    timeout = setTimeout(() => {
      setshowPassErrorModal((prevState) => ({
        ...prevState,
        showPop: false,
        msg: "Please check the details",
        type: "alert",
        header: "Error",
      }));
    }, 4000);
  };
  const getAlertActionsStatus = () => {
    axiosApiInstance
      .get("base/alert/actions/status")
      .then((res) => {
        setBoxCardList([...Object.keys(res.data.detail)]);
        let tempButtonStateMapping = {};

        Object.keys(res.data.detail).map((action) => {
          tempButtonStateMapping[action] = res.data.detail[action];
          return action;
        });

        setButtonStateMapping({ ...tempButtonStateMapping });
      })
      .catch((err) => {})
      .finally(() => {
        setIsLoading(false);
      });
  };

  const postAlertActionsStatus = (action) => {
    axiosApiInstance
      .post("base/alert/actions/status?action=" + action)
      .then((res) => {
        // setModalType("success");
        // msg = "Details successfully updated!";
        // open();
        // clearTimeout(timeout);
        // timeout = setTimeout(() => {
        //   close();
        //   renderSettingsComponent(action, false);
        //   setRenderComponentFlag(false);
        // }, 5000);
      })
      .catch((err) => {
        // setModalType("alert");
        // msg = "";
        // open();
        // clearTimeout(timeout);
        // timeout = setTimeout(() => {
        //   close();
        // }, 5000);
      });
  };

  const postVerifyWhatsappContact = async (contact) => {
    let contactInfo = {
      mobile: contact,
    };
    try {
      let response = await axiosApiInstance.post(
        "base/whatsapp/verify",
        contactInfo
      );
      if (response.data.detail.status === "valid") {
        return response.data.detail.wa_id;
      } else {
        setModalType("alert");
        msg = "Contact is not registered on whatsapp!";
        open();
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          close();
        }, 5000);
        return null;
      }
    } catch (e) {
      if (e.response.status === 422) {
        setModalType("alert");
        msg = "Please enter required details!";
        open();
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          close();
        }, 5000);
        setModalType("success");
        return null;
      }
    }
  };

  const updateInputBoxValues = (action, label, value) => {
    let tempDict = { ...actionSettingsComponents };
    tempDict[action][label]["value"] = value;
    setActionSettingsComponent({ ...tempDict });
    renderSettingsComponent(action, true);
  };

  const updateDropdownValues = (action, label, value) => {
    let tempDict = { ...actionSettingsComponents };
    if (!Array.isArray(tempDict[action][label]["options"])) {
      tempDict[action][label]["value"] =
        tempDict[action][label]["options"][value];
    } else {
      tempDict[action][label]["value"] = value;
    }
    setActionSettingsComponent({ ...tempDict });
    renderSettingsComponent(action, true);
  };

  // const updateMultiSelectDropdownValues = (action, label, value, options) => {
  //   let tempDict = { ...actionSettingsComponents };
  //   tempDict[action][label]["options"] = [...options];
  //   tempDict[action][label]["value"] = [...value];
  //   setActionSettingsComponent({ ...tempDict });
  //   renderSettingsComponent(action, true);
  // };

  const updateMultiSelectDropdownValues = (action, label, value, options) => {
    let tempDict = { ...actionSettingsComponents };
    if (action === "whatsapp") {
      if (value.length !== options.length) {
        if (value.length < options.length) {
          var difference = options.filter((x) => value.indexOf(x) === -1);
          difference.map((elem) => {
            delete tempDict[action][label]["value"][elem];
          });
        }
      }
    } else {
      tempDict[action][label]["options"] = [...options];
      tempDict[action][label]["value"] = [...value];
    }

    setActionSettingsComponent({ ...tempDict });
    renderSettingsComponent(action, true);
  };

  const buttonClickHandler = async (action, label) => {
    let tempDict = { ...actionSettingsComponents };
    let inputFieldName = null;
    let fieldNameToBeUpdated = null;
    let waId = null;

    if (action === "whatsapp") {
      inputFieldName = "contact_number";
      fieldNameToBeUpdated = "contacts";

      let _value = tempDict[action][inputFieldName]["value"].replaceAll(
        " ",
        ""
      );
      _value = _value.replaceAll("+", "");
      _value = _value.replaceAll("-", "");
      if (!tempDict[action][inputFieldName]["value"]) {
        setshowPassErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Please enter valid mobile number",
          type: "alert",
          header: "Error",
        }));
        clearTimeout(timeout);
        resetModal();
        return;
      }
      // if (_value.length !== _MobileNoLength) {
      //   setshowPassErrorModal((prevState) => ({
      //     ...prevState,
      //     showPop: true,
      //     msg: "Please enter valid mobile number",
      //     type: "alert",
      //     header: "Error",
      //   }));
      //   clearTimeout(timeout);
      //   resetModal();
      //   return;
      // }
      waId = await postVerifyWhatsappContact(
        tempDict[action][inputFieldName]["value"]
      );
      console.log(waId);
      if (waId === undefined || waId === null) {
        tempDict[action][inputFieldName]["value"] = "+" + dialCode;
      }
    } else if (action === "email") {
      inputFieldName = "email_id";
      fieldNameToBeUpdated = "emails";
    }

    //console.log(tempDict[action][fieldNameToBeUpdated]["options"]);
    //console.log(tempDict[action][inputFieldName]["value"]);

    if (tempDict[action][inputFieldName]["value"] !== "")
      if (
        Array.isArray(tempDict[action][fieldNameToBeUpdated]["options"]) &&
        tempDict[action][fieldNameToBeUpdated]["options"].indexOf(
          tempDict[action][inputFieldName]["value"]
        ) === -1
      ) {
        tempDict[action][fieldNameToBeUpdated]["options"].unshift(
          tempDict[action][inputFieldName]["value"]
        );

        if (action === "email") {
          tempDict[action][fieldNameToBeUpdated]["value"].unshift(
            tempDict[action][inputFieldName]["value"]
          );
        }
        tempDict[action][inputFieldName]["value"] = "";
      } else if (
        typeof tempDict[action][fieldNameToBeUpdated]["options"] === "object"
      ) {
        if (action === "whatsapp" && waId !== null) {
          tempDict[action][fieldNameToBeUpdated]["value"][
            tempDict[action][inputFieldName]["value"]
          ] = waId;
          tempDict[action][fieldNameToBeUpdated]["options"][
            tempDict[action][inputFieldName]["value"]
          ] = waId;
          tempDict[action][inputFieldName]["value"] = "+" + dialCode;
        }
      }
    //console.log(tempDict);
    setActionSettingsComponent({ ...tempDict });
    renderSettingsComponent(action, true, tempDict);
  };

  const renderComponent = (type, action, label) => {
    switch (type) {
      case "string":
        return (
          <InputBox
            id={label}
            header={label.replace("_", " ")}
            onChange={(e) => {
              updateInputBoxValues(action, label, e.target.value);
            }}
            value={actionSettingsComponents[action][label]["value"]}
          />
        );
      case "password":
        return (
          <InputBox
            type="password"
            id={label}
            header={label.replace("_", " ")}
            onChange={(e) => {
              updateInputBoxValues(action, label, e.target.value);
            }}
            value={actionSettingsComponents[action][label]["value"]}
          />
        );
      case "dropdown":
        return (
          <Dropdown
            style={{ textTransform: "none" }}
            optionsList={
              Array.isArray(actionSettingsComponents[action][label]["options"])
                ? actionSettingsComponents[action][label]["options"]
                : Object.keys(
                    actionSettingsComponents[action][label]["options"]
                  )
            }
            handleOption={(data) => updateDropdownValues(action, label, data)}
            defaultText={actionSettingsComponents[action][label]["default"]}
            label={label.replace("_", " ")}
            id={label}
          />
        );
      case "multi_dropdown":
        let options = Array.isArray(
          actionSettingsComponents[action][label]["options"]
        )
          ? actionSettingsComponents[action][label]["options"]
          : Object.keys(actionSettingsComponents[action][label]["options"]);

        let defaultText = Array.isArray(
          actionSettingsComponents[action][label]["value"]
        )
          ? actionSettingsComponents[action][label]["value"]
          : Object.keys(actionSettingsComponents[action][label]["value"]);
        return (
          <MultiSelectDropdown
            style={{ textTransform: "none" }}
            optionsList={options}
            label={label.replace("_", " ")}
            id={label}
            defaultText={defaultText}
            handleOption={(data) => {
              updateMultiSelectDropdownValues(action, label, data, options);
            }}
          />
        );
      case "phone":
        return (
          <PhoneInputBox
            id="mobile_number"
            isEdit={true}
            onChange={(data) => {
              // inputNumber = data.inputNumber;
              // let _number = data.countryCode + " " + data.inputNumber;
              // setMobile(_number);
              updateInputBoxValues(action, label, data);
            }}
            value={actionSettingsComponents[action][label]["value"]}
          />
          // <PhoneInputBox
          //   id={label}
          //   onChange={(value, country, e, formattedValue) => {
          //     dialCode = country.dialCode;
          //     let _format = country.format;
          //     _MobileNoLength = _format.split(".").length - 1;
          //     // console.log(_MobileNoLength);
          //     updateInputBoxValues(action, label, formattedValue);
          //   }}
          //   _country="in"
          //   value={actionSettingsComponents[action][label]["value"]}
          // />
        );
      case "button":
        return (
          <Button
            style={{
              width: "8vw",
              marginTop: "1vw",
              textTransform: "capitalize",
              marginBottom: "1vw",
            }}
            type="gradient"
            name={label.replace("_", " ")}
            onClick={(e) => {
              buttonClickHandler(action, label);
            }}
          />
        );
      default:
        return <div></div>;
    }
  };

  const fetchNotificationData = async (action) => {
    let tempDict = {};
    console.log(action);
    if (action === "email") {
      try {
        let resp = await axiosApiInstance.get("base/smtp");
        console.log(resp);
      } catch (error) {
        setIsConfirm2(true);
        setRenderComponentFlag(false);
        postAlertActionsStatus(action);

        return null;
      }
    }

    // console.log(resp);
    // if (resp.status !== 200) {

    // }
    setisLoading2(true);
    try {
      let resp = await axiosApiInstance.get("base/" + action);
      tempDict = { ...actionSettingsComponents };
      Object.keys(actionSettingsComponents[action]).map((field) => {
        if (typeof tempDict[action][field] !== "boolean") {
          if (tempDict[action][field]["type"] === "dropdown") {
            if (!Array.isArray(tempDict[action][field]["options"])) {
              let index = Object.values(
                tempDict[action][field]["options"]
              ).indexOf(resp.data.detail[field]);
              tempDict[action][field]["default"] = Object.keys(
                tempDict[action][field]["options"]
              )[index];
            } else {
              tempDict[action][field]["default"] = resp.data.detail[field];
            }
          } else if (tempDict[action][field]["type"] === "multi_dropdown") {
            tempDict[action][field]["options"] =
              resp.data.detail[field] === undefined
                ? []
                : resp.data.detail[field];
            tempDict[action][field]["value"] =
              resp.data.detail[field] === undefined
                ? []
                : resp.data.detail[field];
          } else if (typeof tempDict[action][field] !== "string")
            tempDict[action][field]["value"] =
              resp.data.detail[field] === undefined
                ? ""
                : resp.data.detail[field];
        } else {
          tempDict[action][field] = resp.data.detail[field];
        }
      });
      setActionSettingsComponent({ ...tempDict });
      setisLoading2(false);

      return { action, settingFetched: true, tempDict };
    } catch (e) {
      setisLoading2(false);
      //console.log(e);
      return { action, settingFetched: true, tempDict };
    }
  };

  const renderSettingsComponent = async (
    action,
    settingFetched = false,
    fetchedData = {}
  ) => {
    setCurrentAction(action);
    if (!settingFetched) {
      let response = await fetchNotificationData(action);
      if (!response) {
        return;
      }
      settingFetched = response["settingFetched"];
      fetchedData = response["tempDict"];
    }
    console.log(fetchedData);
    Object.keys(fetchedData).length
      ? setComponentToBeRendered(
          Object.keys(fetchedData[action]).map((field) => {
            if (fetchedData[action][field]["depends_on"] === undefined) {
              return renderComponent(
                fetchedData[action][field]["type"],
                action,
                field
              );
            } else if (
              fetchedData[action][field]["depends_on"] !== undefined &&
              fetchedData[action][fetchedData[action][field]["depends_on"]]
            ) {
              return renderComponent(
                fetchedData[action][field]["type"],
                action,
                field
              );
            }
          })
        )
      : setComponentToBeRendered(
          Object.keys(actionSettingsComponents[action]).map((field) => {
            if (
              actionSettingsComponents[action][field]["depends_on"] ===
              undefined
            ) {
              return renderComponent(
                actionSettingsComponents[action][field]["type"],
                action,
                field
              );
            } else if (
              actionSettingsComponents[action][field]["depends_on"] !==
                undefined &&
              actionSettingsComponents[action][
                actionSettingsComponents[action][field]["depends_on"]
              ]
            ) {
              return renderComponent(
                actionSettingsComponents[action][field]["type"],
                action,
                field
              );
            }
          })
        );
  };

  const postNotificationSettings = (action) => {
    let passwordPresent = true;
    let requestData = {};
    Object.keys(actionSettingsComponents[action]).map((key) => {
      console.log(actionSettingsComponents);
      console.log(key);
      console.log(action);
      requestData[key] = actionSettingsComponents[action][key]["value"];

      if (action === "telegram") {
        if (key === "token" || key === "channel") {
          if (!actionSettingsComponents[action][key]["value"]) {
            console.log("first");
            setModalType("alert");
            // msg = "Please enter password!";
            msg = "Please enter all the details!";
            open();
            passwordPresent = false;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              close();
            }, 5000);
            return;
          }
        }
      } else {
        if (
          // key === "password" &&
          !actionSettingsComponents[action][key]["value"]
        ) {
          console.log("first");
          setModalType("alert");
          // msg = "Please enter password!";
          msg = "Please enter all the details!";
          open();
          passwordPresent = false;
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            close();
          }, 5000);
          return;
        }
      }
      // console.log(key);
      // console.log(actionSettingsComponents[action][key]["value"]);
    });
    if (!passwordPresent) return;
    requestData["state"] = buttonStateMapping[action];
    console.log(requestData);
    axiosApiInstance
      .post("base/" + action, { ...requestData })
      .then((resp) => {
        //go to alert settings
        setModalType("success");
        msg = "Details successfully updated!";
        open();
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          close();
          renderSettingsComponent(action, false);
          setRenderComponentFlag(false);
          setIsConfirm(true);
        }, 5000);
      })
      .catch((err) => {
        if (err.response.status === 422) {
          setModalType("alert");
          msg = err.response.data.detail[0].msg;
          open();
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            close();
            renderSettingsComponent(action, false);
            setRenderComponentFlag(false);
          }, 5000);
        } else {
          setModalType("alert");
          msg = "Invalid Credential!";
          open();
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            close();
            renderSettingsComponent(action, false);
            setRenderComponentFlag(false);
          }, 5000);
        }
      });
  };

  // useEffect(() => {
  //   setIsLoading(true);
  //   getAlertActionsStatus();
  // }, []);

  return (
    <motion.div
      variants={xMotion}
      exit="exit"
      initial="hidden"
      animate="visible"
      className="_notification_setting_"
      onAnimationComplete={() => {
        setIsLoading(true);
        getAlertActionsStatus();
      }}
    >
      <div className="notification_options">
        {boxCardList.map((action) => {
          return (
            <BoxCard
              id={"notification_setting_" + action}
              className={
                buttonStateMapping[action]
                  ? "notification_option_card active_notification_option_card"
                  : "notification_option_card"
              }
              style={{
                background: buttonStateMapping[action] && "var(--primary)",
              }}
              key={action + Math.random().toString()}
            >
              <SwitchBox
                key={action}
                label={"Notify through " + action}
                value={buttonStateMapping[action]}
                link={
                  actionSettingsComponents[action]["link"] !== undefined &&
                  actionSettingsComponents[action]["link"]
                }
                warning={actionSettingsComponents[action]["warning"]}
                onChange={() => {
                  let prevTempDict = { ...buttonStateMapping };
                  prevTempDict[action] = !prevTempDict[action];
                  setButtonStateMapping({ ...prevTempDict });
                  if (!prevTempDict[action]) {
                    postAlertActionsStatus(action);
                    setRenderComponentFlag(false);
                  } else {
                    postAlertActionsStatus(action);
                    renderSettingsComponent(action, false);
                    setRenderComponentFlag(true);
                  }
                }}
              />
              <div className="option_">
                <i className="material-icons">camera</i>
                {buttonStateMapping[action] && (
                  <i
                    className={
                      renderComponentFlag
                        ? "material-icons arrow_selected_"
                        : "material-icons arrow_"
                    }
                    onClick={(e) => {
                      renderSettingsComponent(action, false);
                      setRenderComponentFlag(true);
                    }}
                  >
                    arrow_forward
                  </i>
                )}
              </div>
            </BoxCard>
          );
        })}
      </div>
      {renderComponentFlag && (
        <div
          className="notification_input"
          style={{ textTransform: "capitalize" }}
        >
          <BoxCard className="card_size1">
            {componentToBeRendered}
            <div
              style={{
                position: "relative",
                left: 0,
                marginTop: "3vw",
                width: "100%",
                display: "flex",
                justifyContent: "space-evenly",
              }}
            >
              <Button
                style={{ width: "8vw" }}
                type="gradient"
                name="Save"
                onClick={() => postNotificationSettings(currentAction)}
              />
            </div>
          </BoxCard>
        </div>
      )}
      {modalOpen && (
        <Modal
          className="transparent_modal"
          handleClose={() => {
            close();
            renderSettingsComponent(currentAction, false);
            setRenderComponentFlag(false);
            setIsConfirm(true);
            clearTimeout(timeout);
          }}
          type={modalType}
          errorText={msg}
        />
      )}
      {isConfirm && (
        <Modal
          onConfirm={() => {
            setactiveSetting("Alert Settings");
          }}
          handleClose={() => {
            setIsConfirm(false);
          }}
          type="confirm"
          errorHeader="Warning"
          errorText="You need to enable notification from alert settings page.  Continue?"
        />
      )}

      {isConfirm2 && (
        <Modal
          onConfirm={() => {
            setactiveSetting("S.M.T.P Settings");
          }}
          handleClose={() => {
            getAlertActionsStatus();
            setIsConfirm2(false);
          }}
          type="confirm"
          errorHeader="Warning"
          errorText="Add SMTP settings first. Continue?"
        />
      )}
      {(isLoading || isLoading2) && (
        <Loading type={"transparent"} text={"Loading"} />
      )}
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
          errorText={showPassErrorModal.msg}
        />
      )}
    </motion.div>
  );
}
