import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import Button from "../../../../components/Button/Button";
import { BoxCard } from "../../../../components/card/Card";
import Dropdown from "../../../../components/Dropdown/Dropdown";
import { xMotion } from "../../../../helper/motions";
import { axiosApiInstance, randomID } from "../../../../helper/request";
import MultiSelectDropdown from "../../../../components/MultiSelectDropdown/MultiSelectDropdown";
import useModal from "../../../../helper/useModal";
import Modal from "../../../../components/Modal/Modal";
import PasswordVerification from "../../../../components/PasswordVerification/PasswordVerification";

import "./alert_setting.scss";
import Scrollbars from "react-custom-scrollbars";
import useLoading from "../../../../helper/useLoading";
import Loading from "../../../../components/Loading/Loading";

let msg = "";
let timeout = null;
let services = [];
export const AlertSetting = () => {
  const [options, setOptions] = useState([]);
  const [serviceMapping, setServiceMapping] = useState({});
  // const [services, setServices] = useState([]);
  const [globalServiceMapping, setGlobalServiceMapping] = useState({});
  const { modalOpen, close, open } = useModal();
  const [showPassContainer, setShowPassContainer] = useState(false);
  const [password, setPassword] = useState(null);
  const [showBoxCard, setShowBoxCard] = useState(null);
  const { isLoading, loadingFinished, loading } = useLoading();

  const [showErrorModal, setshowErrorModal] = useState({
    showPop: false,
    msg: "",
    type: "alert",
    header: "",
  });
  const resetModal = () => {
    timeout = setTimeout(() => {
      setshowErrorModal((prevState) => ({
        ...prevState,
        showPop: false,
        msg: "",
        type: "alert",
        header: "",
      }));
    }, 3000);
  };
  const fetchDownloadedServices = (tempDict) => {
    loading();
    axiosApiInstance
      .get("service/?all=true")
      .then((res) => {
        let tempServices = [...res.data.detail];
        let serviceMappingData = {};
        services = tempServices;

        if (Object.keys(tempDict).length) {
          tempServices.map((serviceDetails) => {
            if (tempDict[serviceDetails["Service_name"]] === undefined) {
              serviceMappingData[serviceDetails["Service_name"]] = {
                Service_id: serviceDetails["Service_name"],
                Alert_priority: "",
                Alert_action: [],
                Alert_frequency: "",
              };
              return serviceDetails;
            } else {
              serviceMappingData[serviceDetails["Service_name"]] = {
                Service_id: serviceDetails["Service_name"],
                Alert_priority:
                  tempDict[serviceDetails["Service_name"]]["Alert_priority"],
                Alert_action: [
                  ...tempDict[serviceDetails["Service_name"]]["Alert_action"],
                ],
                Alert_frequency: "",
              };
              return serviceDetails;
            }
          });
        } else {
          tempServices.map((serviceDetails) => {
            serviceMappingData[serviceDetails["Service_name"]] = {
              Service_id: serviceDetails["Service_name"],
              Alert_priority: "",
              Alert_action: [],
              Alert_frequency: "",
            };
            return serviceDetails;
          });
        }

        setServiceMapping({ ...serviceMappingData });
        setGlobalServiceMapping({ ...serviceMappingData });
        setShowBoxCard(true);
      })
      .catch((err) => {
        if (err.response.status !== 404) {
          setshowErrorModal((prevState) => ({
            ...prevState,
            showPop: true,
            msg: "Failed to fetch downloaded service!",
            type: "alert",
            header: "Error",
          }));
          resetModal();
        } else {
          setShowBoxCard(false);
          setshowErrorModal((prevState) => ({
            ...prevState,
            showPop: true,
            msg: "Please download services first!",
            type: "alert",
            header: "Error",
          }));
          resetModal();
        }
      })
      .finally(() => {
        loadingFinished();
      });
  };

  const getAlertActions = () => {
    loading();
    axiosApiInstance
      .get("base/alert/actions")
      .then((res) => {
        setOptions(res.data.detail.actions);
        getAlertSettings();
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Failed to fetch Alert actions!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      });
  };

  const getAlertSettings = () => {
    loading();
    axiosApiInstance
      .get("base/alertsettings")
      .then((res) => {
        let tempDict = {};
        res.data.map((setting) => {
          //console.log(setting);
          tempDict[setting["Service_id"]] = setting;
        });
        fetchDownloadedServices(tempDict);
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Failed to fetch alert settings!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
      })
      .finally(() => {
        loadingFinished();
      });
  };

  const postAlertSettings = () => {
    loading();
    let requestList = Object.keys(serviceMapping).map((key) => {
      return serviceMapping[key];
    });

    axiosApiInstance
      .post("base/alertsettings", { Settings: requestList })
      .then((res) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Details successfully updated!",
          type: "success",
          header: "Success",
        }));
        resetModal();

        setTimeout(() => {
          getAlertActions();
        }, 1000);
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Something went wrong!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
        //console.log(err.response);
      })
      .finally(() => {
        loadingFinished();
      });
  };

  const selectedPriority = (value, selectedPriorityValue) => {
    setServiceMapping((prevState) => {
      prevState[value.replaceAll(" ", "_")]["Alert_priority"] =
        selectedPriorityValue;
      return { ...prevState };
    });
  };

  const selectedAction = (value, selectedActionValues) => {
    setServiceMapping((prevState) => {
      prevState[value.replaceAll(" ", "_")]["Alert_action"] = [
        ...selectedActionValues,
      ];
      return { ...prevState };
    });
  };

  const postPassword = () => {
    if (password === "") {
      return;
    }
    axiosApiInstance
      .post("user/verify-password", {
        Password: password,
      })
      .then((res) => {
        if (res.status === 200) {
          defaultDatahandler();
        }
      })
      .catch((err) => {
        setshowErrorModal((prevState) => ({
          ...prevState,
          showPop: true,
          msg: "Password did not matched. Try again!",
          type: "alert",
          header: "Error",
        }));
        resetModal();
        //console.log(err.response);
      });
  };

  const defaultDatahandler = () => {
    let tempDict = {};
    Object.keys(serviceMapping).map((key) => {
      tempDict[key] = { ...serviceMapping[key] };
      tempDict[key]["Alert_priority"] = "";
      tempDict[key]["Alert_action"] = [];
      tempDict[key]["Alert_frequency"] = "";
      return tempDict;
    });

    setServiceMapping({ ...tempDict });
    setGlobalServiceMapping({ ...tempDict });
  };

  useEffect(() => {
    getAlertActions();
  }, []);

  return (
    <React.Fragment>
      <motion.div
        variants={xMotion}
        exit="exit"
        initial="hidden"
        animate="visible"
        className="__alert_setting_"
      >
        {showBoxCard && (
          <BoxCard className="card_size_alert">
            <Scrollbars autoHeight autoHeightMin={"65vh"} autoHeightMax="65vh">
              <div className="alert_card_holder">
                {services.map((serviceDetails) => {
                  //console.log(serviceDetails["Service_name"]);
                  return (
                    <UsecaseCard
                      key={serviceDetails["Service_name"]}
                      name={serviceDetails["Service_name"].replaceAll("_", " ")}
                      options={options}
                      serviceMapping={globalServiceMapping}
                      selectedActionObject={selectedAction}
                      selectedPriorityObject={selectedPriority}
                    />
                  );
                })}
              </div>
            </Scrollbars>

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
              <Button
                style={{ width: "8vw" }}
                name="Default"
                onClick={() => setShowPassContainer(true)}
              />
              <Button
                style={{ width: "8vw" }}
                onClick={() => postAlertSettings()}
                type="gradient"
                name="Save"
              />
            </div>
          </BoxCard>
        )}
        {showPassContainer && (
          <PasswordVerification
            close={() => setShowPassContainer(false)}
            postPassword={postPassword}
            password={password}
            setPassword={setPassword}
          />
        )}
        {modalOpen && (
          <Modal
            className="transparent_modal"
            handleClose={() => {
              close();
            }}
            type="success"
            errorHeader="Success"
            errorText={msg}
          />
        )}
      </motion.div>
      {showErrorModal.showPop && (
        <Modal
          className={"transparent_modal"}
          handleClose={() => {
            setshowErrorModal((prevState) => ({
              ...prevState,
              showPop: false,
            }));
          }}
          type={showErrorModal.type}
          errorHeader={showErrorModal.header ? showErrorModal.header : "Error"}
          errorText={showErrorModal.msg}
        />
      )}
      {isLoading && <Loading type={"transparent"} text={"Loading"} />}
    </React.Fragment>
  );
};

const UsecaseCard = ({
  name,
  options,
  serviceMapping,
  selectedActionObject,
  selectedPriorityObject,
}) => {
  const priorityOptions = ["High", "Medium", "Low"];
  const [selectedPriority, setselectedPriority] = useState("");
  const [multiSelectedValue, setmultiSelectedValue] = useState([]);

  const onMultiOptionSelect = (value, selectedOptions) => {
    selectedActionObject(value, selectedOptions);
    setmultiSelectedValue([...selectedOptions]);
  };

  const onPrioritySelect = (value, priority) => {
    selectedPriorityObject(value, priority);
  };

  useEffect(() => {
    setselectedPriority(
      !Object.keys(serviceMapping).length
        ? ""
        : serviceMapping[name.replaceAll(" ", "_")]["Alert_priority"]
    );
    setmultiSelectedValue(
      !Object.keys(serviceMapping).length
        ? []
        : [...serviceMapping[name.replaceAll(" ", "_")]["Alert_action"]]
    );
  }, [serviceMapping]);

  return (
    <div className="_uc_card_">
      <p className="header">{name}</p>
      <div className="_flex">
        <Dropdown
          optionsList={priorityOptions}
          handleOption={(data) => onPrioritySelect(name, data)}
          defaultText={selectedPriority}
          label="Priority"
        />
        <MultiSelectDropdown
          optionsList={options}
          label="Action"
          // id="Action"
          id={randomID()}
          defaultText={[...multiSelectedValue]}
          handleOption={(data) => onMultiOptionSelect(name, [...data])}
        />
      </div>
    </div>
  );
};
