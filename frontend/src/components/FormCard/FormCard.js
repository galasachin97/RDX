import React, { useEffect, useState } from "react";
import "./fc.scss";
import { motion } from "framer-motion";

import back from "../../assets/images/back.png";

import f1 from "../../assets/images/f1.png";
import f2 from "../../assets/images/f2.png";
import f3 from "../../assets/images/f3.png";
import f4 from "../../assets/images/f4.png";
import f5 from "../../assets/images/f5.png";
import { container, parentContainer, xMotion } from "../../helper/motions";
import { useHistory } from "react-router";
import { SOCKET_URL } from "../../helper/request";
const Features = ({ name, icon }) => {
  return (
    <motion.li variants={xMotion} className="__features__">
      <div className="feature_icon">
        <img src={icon} alt="feature1" />
      </div>
      <div className="feature_text">{name}</div>
    </motion.li>
  );
};

export default function FormCard(props) {
  let history = useHistory();
  const [ThemeData, setThemeData] = useState({
    label: "Diycam123",
    logo_white_theme: "",
  });

  const getTheme = async () => {
    let res = await fetch("http://" + window.location.host + "/Theme.json");
    let jsonData = await res.json();
    setThemeData({ ...jsonData });
  };

  useEffect(() => {
    getTheme();
    const html = document.querySelector("html");
    if (!localStorage.getItem("theme")) {
      localStorage.setItem("theme", "Light");
      html.classList.add("light-theme");
    } else {
      html.classList.add("light-theme");
    }
  }, []);

  return (
    <motion.div
      variants={parentContainer}
      exit="exit"
      animate="visible"
      initial="hidden"
      className="__form_Card__"
    >
      {/* {props.copyright && ( */}
      <p className="cp-text2">
        © Copyright 2022 {ThemeData.label} All rights reserved.
      </p>
      {/* )} */}
      <div className="company_info">
        <motion.img
          src={SOCKET_URL + ThemeData?.logo_white_theme}
          alt="logo"
          className="logo"
          initial={{
            x: -500,
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          transition={{ duration: 0.8 }}
        />

        <motion.ul
          className="_feature_wrapper_"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <Features name="No Code AI" icon={f1} />
          <Features name="Easy Camera Management" icon={f2} />
          <Features name="AI Marketplace" icon={f3} />
          <Features name="Real-time Alerts" icon={f4} />
          <Features name="Schedule AI Activity" icon={f5} />
        </motion.ul>

        {/* <motion.img
          src={mask2}
          alt="mask2"
          className="mask2"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{ duration: 0.5 }}
        /> */}

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{ duration: 0.5 }}
          className="mask2"
        >
          <svg
            id="b"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 211.12 209"
          >
            <g id="c">
              <path
                id="Path_10237"
                data-name="Path 10237"
                d="M0,0H211.12V209a346.33,346.33,0,0,1-60.62-29.23C79.65,137.16,28.5,78.04,0,0Z"
              />
            </g>
          </svg>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{ duration: 0.5 }}
          className="mask1"
        >
          <svg id="b" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 169 166">
            <g id="c">
              <path
                id="Path_10235"
                data-name="Path 10235"
                d="M0,0H169V166a299.811,299.811,0,0,1-60.06-30.46C85.76,120.16,64.89,102.2,47.08,80.67,35.54,66.72,24.76,52.28,16.62,36.11,10.67,24.28,5.51,12.05,0,0Z"
              />
            </g>
          </svg>
        </motion.div>
        {/* <motion.img
          src={mask1}
          alt="mask1"
          className="mask1"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{ duration: 0.5 }}
        /> */}

        <motion.div
          initial={{
            x: -500,
            y: 500,
            opacity: 0,
          }}
          animate={{
            x: 0,
            y: 0,
            opacity: 1,
          }}
          transition={{ duration: 0.5 }}
          className="mask3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 328 275.883">
            <g id="b" transform="translate(-0.5 -0.497)">
              <g id="c">
                <path
                  id="Path_10242"
                  data-name="Path 10242"
                  d="M.5,1.38v275h328S299.5-17.62.5,1.38Z"
                />
              </g>
            </g>
          </svg>
        </motion.div>

        {/* <motion.img
          src={mask3}
          alt="mask3"
          className="mask3"
          initial={{
            x: -500,
            y: 500,
            opacity: 0,
          }}
          animate={{
            x: 0,
            y: 0,
            opacity: 1,
          }}
          transition={{ duration: 0.5 }}
        /> */}

        {/* <div className="brand_name">
          <img src={r} alt="r" className="r" />
          <img src={d} alt="d" className="d" />
          <img src={x} alt="x" className="x" />
        </div> */}
        {/* {props.copyright && (
          <p className="cp-text">
            © Copyright 2022 Diycam India Pvt Ltd. All rights reserved.
          </p>
        )} */}
      </div>
      <div className="d_data">
        <motion.header
          initial={{
            y: -100,
          }}
          animate={{
            y: 0,
          }}
        >
          {props.arrow && (
            <img
              onClick={() => history.goBack()}
              src={back}
              className="back"
              alt="back"
            />
          )}

          {props.name}
        </motion.header>
        {props.name && (
          <motion.hr
            initial={{
              x: -100,
            }}
            animate={{
              x: 0,
            }}
          />
        )}
        {props.children}
      </div>
    </motion.div>
  );
}
