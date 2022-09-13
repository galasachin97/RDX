import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import Button from "../../../components/Button/Button";
import FormCard from "../../../components/FormCard/FormCard";
import IPInputbox from "../../../components/IPInputbox/IPInputbox";
import { API_URL } from "../../../helper/request";
import "./an.scss";
import "../../ServerDown/server_down.scss";
import { motion } from "framer-motion";
import { container, item } from "../../../helper/motions";
import { useHistory, useLocation } from "react-router-dom";
import useModal from "../../../helper/useModal";
import Modal from "../../../components/Modal/Modal";
import useLoading from "../../../helper/useLoading";
import { CircularProgressBar2 } from "../../ServerDown/Restart";
import Loading from "../../../components/Loading/Loading";
import { encryptStorage } from "../../../helper/storage";
let msg = "";
let apiData = {
  IP: "",
  subnet: "",
  gateway: "",
  DNS1: "",
  DNS2: "",
};
let timer = null;
let interval = null;
export default function AuthNetwork() {
  let history = useHistory();
  let location = useLocation();
  const { modalOpen, close, open } = useModal();
  const { isLoading, loadingFinished, loading } = useLoading();
  const [showMsg, setshowMsg] = useState(false);
  const [isRestarting, setisRestarting] = useState(false);

  const [errors, setErrors] = useState({
    isIPEmpty: false,
    isSubnetEmpty: false,
    isDefaultGateway: false,
    isDNS1Empty: false,
    // isDNS2Empty: false,
  });

  const [IP, setIP] = useState("");
  const [subnet, setSubnet] = useState("");
  const [gateway, setGateway] = useState("");
  const [DNS1, setDNS1] = useState("");
  const [DNS2, setDNS2] = useState("");
  const [result, setResult] = useState("");
  const [showPop, setShowPop] = useState(false);

  const clearError = (name) => {
    let _errors = { ...errors };
    _errors[name] = false;
    setErrors({ ..._errors });
  };
  const validateIP = () => {
    const _data = [IP, subnet, gateway];
    let _errors = { ...errors };
    let _errorKey = Object.keys(errors);
    let res = [];
    for (let [index, dataEle] of _data.entries()) {
      if (dataEle === "") {
        res.push(false);
        _errors[_errorKey[index]] = true;
      } else {
        let splited = dataEle.split(".");
        if (splited.length !== 4 || splited.includes("")) {
          res.push(false);
          _errors[_errorKey[index]] = true;
        } else {
          res.push(true);
          _errors[_errorKey[index]] = false;
        }
      }
    }

    if (DNS1) {
      let dns = DNS1.split(".");
      if (dns.length !== 4 || dns.includes("")) {
        res.push(false);
        _errors["isDNS1Empty"] = true;
      }
    }
    if (DNS2) {
      let dns2 = DNS2.split(".");
      if (dns2.length !== 4 || dns2.includes("")) {
        res.push(false);
        _errors["isDNS2Empty"] = true;
      }
    }

    // let IPvalue = IP.split(".");
    // let _value = IPvalue[2];
    // let subnetIP = gateway.split(".");
    // let _subValue = subnetIP[2];
    // console.log(IPvalue, _value, subnetIP, _subValue);
    // if (_value !== _subValue) {
    //   _errors["isDefaultGateway"] = true;
    // }

    if (gateway !== "" && IP !== "" && gateway === IP) {
      _errors["isIPEmpty"] = true;
      _errors["isDefaultGateway"] = true;
      msg = "IP address and Default gateway cannot be same!";
      setshowMsg(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        getNetwork();
        setshowMsg(false);
      }, 5000);
    }

    setErrors(_errors);
    if (res.includes(false) || Object.values(_errors).includes(true)) {
      return false;
    } else {
      return true;
    }
  };

  const postData = () => {
    if (validateIP()) {
      loading();
      let _error_ = [];
      if (IP !== apiData.IP || IP === "") {
        _error_.push(true);
      }
      // if (subnet !== apiData.subnet) {
      //   _error_.push(true);
      // }
      // if (gateway !== apiData.gateway || gateway === "") {
      //   _error_.push(true);
      // }
      // if (DNS1 !== apiData.DNS1) {
      //   _error_.push(true);
      // }
      // if (DNS2 !== apiData.DNS2) {
      //   _error_.push(true);
      // }

      if (_error_.includes(true)) {
        axios
          .get(API_URL + "host/network/test?ip=" + IP)
          .then((res) => {
            if (res.data.detail.status === "found") {
              close();
              msg = "IP address already assigned to other device!";
              setshowMsg(true);
              clearTimeout(timer);
              timer = setTimeout(() => {
                setshowMsg(false);
                close();
                getNetwork();
              }, 3000);
            } else {
              open();
            }
          })
          .catch((err) => {
            localStorage.setItem("theme", "Light");
            history.push("/issue/server");
          })
          .finally(() => {
            loadingFinished();
          });
      }
      else {
        open();
        loadingFinished();
      }
    }
  };

  const getSystemData = async () => {
    axios
      .get(API_URL + "base/startup")
      .then((res) => {
        if (
          res.data.detail != "network" &&
          res.data.detail != "user_selection"
        ) {
          history.replace("/auth/login");
        }
      })
      .catch((err) => {
        if (err.response === undefined) {
          history.push("/auth/error");
        }
      });
  };

  const getNetwork = async () => {
    loading();
    let res = await fetch(API_URL + "host/network");
    if (res.status === 200) {
      loadingFinished();
      let json = await res.json();

      if (json.Ethernets.Dns[0]) {
        var _dns1 = json.Ethernets.Dns[0];
        _dns1 = _dns1.split(".");
      }

      if (json.Ethernets.Dns[1]) {
        var _dns2 = json.Ethernets.Dns[1] ? json.Ethernets.Dns[1] : null;
        if (_dns2 !== null) {
          _dns2 = _dns2.split(".");
        }
      }

      apiData.IP = json.Ethernets.Ip;
      apiData.subnet = json.Ethernets.Subnet_mask;
      apiData.gateway = json.Ethernets.Gateway;
      apiData.DNS1 = json.Ethernets.Dns[0] || "";
      apiData.DNS2 = json.Ethernets?.Dns[1] || "";
      setIP(json.Ethernets.Ip);
      setSubnet(json.Ethernets.Subnet_mask);
      setGateway(json.Ethernets.Gateway);
      setDNS1(json.Ethernets.Dns[0] || "");
      setDNS2(json.Ethernets.Dns[1] || "");
    } else {
      loadingFinished();

      apiData = {
        IP: "",
        subnet: "",
        gateway: "",
        DNS1: "",
        DNS2: "",
      };
    }
  };

  const rebootDevice = async () => {
    loading();
    let arr = [];
    if (DNS1) arr.push(DNS1);
    if (DNS2) arr.push(DNS2);
    let obj = {
      Network_priority: "Ethernets",
      Ethernets: {
        Ip: IP,
        Subnet_mask: subnet,
        Gateway: gateway,
        Dns: arr,
      },
    };

    try {
      let response = await axios({
        method: "post",
        url: API_URL + "host/network/configure",
        timeout: 10000,
        data: obj,
      });
      if (response.status === 200) {
        loadingFinished();
        setisRestarting(true);
        setTimeout(() => {
          window.open("http://" + IP, "_self");
        }, 90000);
      }
    } catch (error) {
      loadingFinished();
      if (error.code === "ECONNABORTED") {
        setisRestarting(true);
        encryptStorage.removeItem("UID");
        setTimeout(() => {
          window.open("http://" + IP, "_self");
        }, 90000);
      } else {
        setisRestarting(false);
        close();
        msg = "IP address already assigned to other device!";
        setshowMsg(true);
        clearTimeout(timer);
        timer = setTimeout(() => {
          setshowMsg(false);
          close();
          getNetwork();
        }, 3000);
      }
    }
  };

  useEffect(() => {
    if (location.state) {
      if (location.state.showPop) {
        setShowPop(true);
      }
    }
    getSystemData();
    getNetwork();
  }, []);

  useEffect(() => {
    let arr = [];
    if (IP !== apiData.IP) {
      arr.push(true);
    }
    if (subnet !== apiData.subnet) {
      arr.push(true);
    }
    if (gateway !== apiData.gateway) {
      arr.push(true);
    }
    if (DNS1 !== apiData.DNS1) {
      arr.push(true);
    }
    if (DNS2 !== apiData.DNS2) {
      arr.push(true);
    }
    setResult([...arr]);
  }, [IP, subnet, gateway, DNS1, DNS2]);

  if (isRestarting) {
    return (
      <div className="restart">
        <p className="company">RDX</p>
        <CircularProgressBar2 style={{ position: "absolute" }} />
        <p className="shutdown">Restarting</p>
      </div>
    );
  }
  return (
    <div className="__auth_network__">
      <FormCard name="Network Settings">
        <div className="auth_form">
          <motion.ul variants={container} initial="hidden" animate="visible">
            <motion.li variants={item}>
              <IPInputbox
                id="ip_address"
                label="IP Address"
                error={errors["isIPEmpty"]}
                onClick={() => clearError("isIPEmpty")}
                defaultValue={IP ? IP : ""}
                exclude={[
                  "170",
                  "171",
                  "172",
                  "173",
                  "174",
                  "175",
                  "176",
                  "177",
                  "178",
                  "179",
                  "0",
                  "255",
                ]}
                onFocus={(event) => event.target.select()}
                onChange={(e) => {
                  setIP(e);
                }}
                disabled={isLoading}
                onBlur={() => {
                  let _errors = { ...errors };
                  let ipSplit = IP.split(".");
                  if (IP === "") {
                    _errors["isIPEmpty"] = true;
                  }
                  if (
                    ipSplit[0] === "172" ||
                    ipSplit[0] === "0" ||
                    ipSplit[0] === "255"
                  ) {
                    _errors["isIPEmpty"] = true;
                  }
                  setErrors({ ..._errors });
                }}
              />
            </motion.li>
            <motion.li variants={item}>
              <IPInputbox
                id="subnet"
                label="Subnet Mask"
                error={errors["isSubnetEmpty"]}
                onChange={(e) => setSubnet(e)}
                onClick={() => clearError("isSubnetEmpty")}
                defaultValue={subnet ? subnet : ""}
                onFocus={(event) => event.target.select()}
                disabled={isLoading}
                onBlur={() => {
                  let _errors = { ...errors };
                  if (subnet === "") {
                    _errors["isSubnetEmpty"] = true;
                  } else {
                    _errors["isSubnetEmpty"] = false;
                  }
                  setErrors({ ..._errors });
                }}
              />
            </motion.li>
            <motion.li variants={item}>
              <IPInputbox
                disabled={isLoading}
                id="gateway"
                label="Default Gateway"
                error={errors["isDefaultGateway"]}
                exclude={[
                  "170",
                  "171",
                  "172",
                  "173",
                  "174",
                  "175",
                  "176",
                  "177",
                  "178",
                  "179",
                  "0",
                  "255",
                ]}
                onChange={(e) => {
                  let newValue = e;
                  let splittedValue = newValue.split(".");
                  if (splittedValue.length === 4) {
                    if (newValue === IP) {
                      let _errors = { ...errors };
                      _errors["isIPEmpty"] = true;
                      _errors["isDefaultGateway"] = true;
                      setErrors({ ..._errors });
                      setGateway(newValue);
                    } else {
                      let _errors = { ...errors };
                      _errors["isIPEmpty"] = false;
                      _errors["isDefaultGateway"] = false;
                      setErrors({ ..._errors });
                      setGateway(e);
                    }
                  } else {
                    setGateway(e);
                  }
                }}
                onClick={() => clearError("isDefaultGateway")}
                defaultValue={gateway ? gateway : ""}
                IPValue={IP}
                onFocus={(event) => event.target.select()}
                onBlur={() => {
                  let _errors = { ...errors };
                  if (gateway === IP) {
                    _errors["isIPEmpty"] = true;
                    _errors["isDefaultGateway"] = true;
                  } else {
                    _errors["isIPEmpty"] = false;
                    _errors["isDefaultGateway"] = false;
                  }
                  setErrors({ ..._errors });
                  // let IPvalue = IP.split(".");
                  // let _value = IPvalue[2];
                  // let subnetIP = gateway.split(".");
                  // let _subValue = subnetIP[2];
                  // if (_value !== _subValue) {
                  //   let _errors = { ...errors };
                  //   _errors["isDefaultGateway"] = true;
                  //   setErrors({ ..._errors });
                  // }
                }}
                // helperText="3rd value of DG is different"
              />
            </motion.li>
            <motion.li variants={item}>
              <IPInputbox
                disabled={isLoading}
                id="dns1"
                label="D.N.S - 1"
                error={errors["isDNS1Empty"]}
                onChange={(e) => setDNS1(e)}
                onClick={() => clearError("isDNS1Empty")}
                defaultValue={DNS1 ? DNS1 : ""}
                onFocus={(event) => event.target.select()}
                exclude={[
                  "170",
                  "171",
                  "172",
                  "173",
                  "174",
                  "175",
                  "176",
                  "177",
                  "178",
                  "179",
                  "0",
                  "255",
                ]}
              />
            </motion.li>
            <motion.li variants={item}>
              <IPInputbox
                disabled={isLoading}
                id="dns2"
                label="D.N.S - 2"
                error={errors["isDNS2Empty"]}
                onChange={(e) => setDNS2(e)}
                onClick={() => clearError("isDNS2Empty")}
                defaultValue={DNS2 ? DNS2 : ""}
                onFocus={(event) => event.target.select()}
                exclude={[
                  "170",
                  "171",
                  "172",
                  "173",
                  "174",
                  "175",
                  "176",
                  "177",
                  "178",
                  "179",
                  "0",
                  "255",
                ]}
              />
            </motion.li>
          </motion.ul>

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
              onClick={postData}
              type="gradient"
              name="Submit"
              disabled={result.length === 0}
            />
            <Button
              onClick={() => history.push("/auth/accesskey")}
              style={{ width: "8vw" }}
              name="Skip"
              disabled={isLoading}
            />
          </div>
        </div>
      </FormCard>
      {modalOpen && (
        <Modal
          onConfirm={rebootDevice}
          modalOpen={modalOpen}
          handleClose={() => {
            close();
            getNetwork();
          }}
          type="confirm"
          errorHeader="Warning"
          errorText="Your device will reboot."
        />
      )}

      {showPop && (
        <Modal
          modalOpen={showPop}
          handleClose={() => {
            setShowPop(false);
            history.push("/auth/network");
          }}
          type="alert"
          errorHeader="Error"
          errorText="Internet connection not present!"
        />
      )}
      {isLoading && <Loading type={"transparent"} text={"Loading"} />}

      {showMsg && (
        <Modal
          handleClose={() => {
            setshowMsg(false);
          }}
          type="alert"
          errorHeader="Error"
          errorText={msg}
          className="transparent_modal"
        />
      )}
    </div>
  );
}
