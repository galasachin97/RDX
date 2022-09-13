import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import Button from "../../../../components/Button/Button";
import { BoxCard } from "../../../../components/card/Card";
import IPInputbox from "../../../../components/IPInputbox/IPInputbox";
import Loading from "../../../../components/Loading/Loading";
import Modal from "../../../../components/Modal/Modal";
import { xMotion } from "../../../../helper/motions";
import { API_URL, axiosApiInstance } from "../../../../helper/request";
import useLoading from "../../../../helper/useLoading";
import useModal from "../../../../helper/useModal";
import "./network.scss";
let apiData = {
  IP: "",
  subnet: "",
  gateway: "",
  DNS1: "",
  DNS2: "",
};
let msg = "";
let timer = null;

export default function NetworkSetting({ networkData, handleLoading }) {
  let history = useHistory();
  const { modalOpen, close, open } = useModal();
  const { isLoading, loadingFinished, loading } = useLoading();
  const [showMsg, setshowMsg] = useState(false);

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

  const clearError = (name) => {
    let _errors = { ...errors };
    _errors[name] = false;
    setErrors({ ..._errors });
  };

  const validateIP = () => {
    const _data = [IP, subnet, gateway];
    //console.log(_data);
    let _errors = { ...errors };
    //console.log(_errors);
    let _errorKey = Object.keys(errors);
    let res = [];
    for (let [index, dataEle] of _data.entries()) {
      //console.log(dataEle);
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
    // //console.log(IPvalue, _value, subnetIP, _subValue);
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
        setshowMsg(false);
      }, 3000);
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
      console.log("ALL OK");
      handleLoading(true);
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
      //console.log(_error_);
      if (_error_.includes(true)) {
        axiosApiInstance
          .get("/host/network/test?ip=" + IP)
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
            handleLoading(false);
          });
      }
      else {
        open();
        handleLoading(false);
      }
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

    networkData(obj);

    // try {
    //   let response = await axios({
    //     method: "post",
    //     url: API_URL + "host/network/configure",
    //     timeout: 10000,
    //     data: obj,
    //   });
    // } catch (error) {
    //   if (error.code === "ECONNABORTED") {
    //     window.open("http://" + IP, "_blank").focus();
    //     window.close();
    //   } else {
    //     close();
    //     msg = "IP address already assigned to other device!";
    //     setshowMsg(true);
    //     clearTimeout(timer);
    //     timer = setTimeout(() => {
    //       setshowMsg(false);
    //       close();
    //       getNetwork();
    //     }, 3000);
    //   }
    // }
  };

  const getNetwork = async () => {
    loading();
    let res = await fetch(API_URL + "host/network");
    if (res.status === 200) {
      loadingFinished();
      let json = await res.json();
      //console.log(json);

      var _ip = json.Ethernets.Ip.split(".");
      var _subnet = json.Ethernets.Subnet_mask.split(".");
      var _gateway = json.Ethernets.Gateway.split(".");

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
      //console.log(apiData);
      setIP(json.Ethernets.Ip);
      setSubnet(json.Ethernets.Subnet_mask);
      setGateway(json.Ethernets.Gateway);
      setDNS1(json.Ethernets.Dns[0] || "");
      setDNS2(json.Ethernets.Dns[1] || "");
    } else {
      msg = "Failed to fetch Network Setting!";
      setshowMsg(true);
      setTimeout(() => {
        setshowMsg(false);
      }, 3000);
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

  useEffect(() => {
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
    //console.log(arr);
    setResult([...arr]);
  }, [IP, subnet, gateway, DNS1, DNS2]);

  return (
    <motion.div
      variants={xMotion}
      exit="exit"
      initial="hidden"
      animate="visible"
      className="_network_setting_"
    >
      <BoxCard className="card_size">
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
            //console.log(ipSplit, IP);
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
            //console.log(_errors);
            setErrors({ ..._errors });
          }}
        />
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
            //console.log(_errors);
            setErrors({ ..._errors });
          }}
        />
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
          {/* <Button
            style={{ width: "8vw" }}
            name="Default"
            onClick={getNetwork}
            disabled={isLoading}
          /> */}
          <Button
            style={{ width: "8vw" }}
            onClick={postData}
            type="gradient"
            name="Save"
            disabled={isLoading || result.length === 0}
          />
        </div>
      </BoxCard>
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
      {isLoading && <Loading type={"transparent"} text={"Loading"} />}
    </motion.div>
  );
}
