import React, { useState, useEffect }  from "react";
import FormCard from "../../../components/FormCard/FormCard";
import "./type.scss";
import user from "../../../assets/images/user.png";
import manu from "../../../assets/images/manu.png";
import { API_URL } from "../../../helper/request";
import { motion } from "framer-motion";
import { container, item } from "../../../helper/motions";
import { Link, useHistory } from "react-router-dom";
import axios from "axios";


const TypeCard = ({ icon, name }) => {
  return (
    <motion.div
      whileHover={{
        scale: 1.1,
        boxShadow: "2px 3px 3px 0px rgba(0, 0, 0, 0.5)",
      }}
      variants={item}
      className="type_card"
    >
      <div className="image_holder">
        <img src={icon} />
      </div>
      <p>{name}</p>
    </motion.div>
  );
};


export default function AuthType() {
  let history = useHistory();

  const getSystemData = async () => {
    axios
      .get(API_URL + "base/startup")
      .then((res) => {
        if (res.data.detail === "success") {
          history.replace("/auth/login");
        }
      })
      .catch((err) => {
        if (err.response === undefined) {
          history.push("/auth/error");
        }
      });
  };

  useEffect(() => {
    getSystemData();
  }, []);

  return (
    <div className="__auth_type__">
      <FormCard name="Select Type Of User">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="auth_form"
        >
          <Link
            to={{
              pathname: "/auth/login",
              state: {
                callAPI: true,
                user: "end_user",
              },
            }}
          >
            <TypeCard icon={manu} name="Manufacturer" />
          </Link>
          <Link
            onClick={() => localStorage.setItem("type", "user")}
            to={{
              pathname: "/auth/login",
              state: {
                callAPI: false,
                user: "end_user",
              },
            }}
          >
            <TypeCard icon={user} name="End User" />
          </Link>
        </motion.div>
      </FormCard>
    </div>
  );
}
