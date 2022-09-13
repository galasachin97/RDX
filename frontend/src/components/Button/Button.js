import React from "react";
import { motion } from "framer-motion";
import "./btn.scss";
export default function Button({ disabled, name, type, onClick, style}) {
  return (
    <motion.button
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{ duration: 0.5 }}
      disabled={disabled}
      className={type === "gradient" ? "btn btn_gradient" : "btn"}
      onClick={onClick}
      style={style}
    >
      {name}
    </motion.button>
  );
}
