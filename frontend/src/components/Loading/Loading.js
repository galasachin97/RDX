import { motion } from "framer-motion";
import React from "react";
import "./loading.scss";
export default function Loading({ type, text }) {
  return (
    <motion.div
      className={
        type === "transparent"
          ? "__loading__ __loading__adjust__"
          : "__loading__"
      }
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
      }}
      id="loading_frame"
    >
      <div className="loading_wrapper">
        <h2>{text !== null ? text : "Breath"}</h2>
        <span>
          <i></i>
          <i></i>
        </span>
      </div>
    </motion.div>
  );
}
