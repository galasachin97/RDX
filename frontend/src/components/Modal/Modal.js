import React from "react";
import "./modal.scss";
import { motion } from "framer-motion";

const dropIn = {
  hidden: {
    y: "-100vh",
    opacity: 0,
  },
  visible: {
    y: "0",
    opacity: 1,
    transition: {
      duration: 0.1,
      type: "spring",
      damping: 25,
      stiffness: 500,
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
  exit: {
    y: "100vh",
    opacity: 0,
  },
};

export default function Modal({
  children,
  onClick,
  handleClose,
  type,
  onConfirm,
  errorText,
  errorHeader,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
      }}
      exit={{ opacity: 0 }}
      className={className ? "_modal_wrapper_ " + className : "_modal_wrapper_"}
      onClick={handleClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
        className="modal"
        variants={dropIn}
        initial="hidden"
        animate="visible"
        exit={{
          opacity: 0,
        }}
      >
        {children}

        {type === "confirm" && (
          <motion.div
            className="modal_content"
            onClick={onClick}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: {
                duration: 0.8,
              },
            }}
            exit={{ opacity: 0 }}
          >
            <div style={{ display: "flex" }}>
              <i className="material-icons modal_icon" onClick={onConfirm}>
                warning
              </i>
              {/* <img src={error} className="modal_icon" /> */}
              <div className="warning_content">
                <h3>{errorHeader ? errorHeader : "Warning"}</h3>
                <p>{errorText ? errorText : "Your device will reboot."}</p>
              </div>
            </div>
            <div className="warning_options">
              <i className="material-icons success_icon" onClick={onConfirm}>
                done
              </i>
              <i className="material-icons warning_icon" onClick={handleClose}>
                close
              </i>
            </div>
          </motion.div>
        )}
        {type === "alert" && (
          <motion.div
            className="modal_content"
            onClick={onClick}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: {
                duration: 0.8,
              },
            }}
            exit={{ opacity: 0 }}
          >
            <div style={{ display: "flex" }}>
              <i className="material-icons modal_icon" onClick={onConfirm}>
                warning
              </i>
              {/* <img src={error} className="modal_icon" /> */}
              <div className="warning_content">
                <h3>Error</h3>
                <p>{errorText ? errorText : "Something went wrong!"}</p>
              </div>
            </div>
            <div className="warning_options">
              <i className="material-icons warning_icon" onClick={handleClose}>
                close
              </i>
            </div>
          </motion.div>
        )}

        {type === "success" && (
          <motion.div
            className="modal_content"
            onClick={onClick}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: {
                duration: 0.8,
              },
            }}
            exit={{ opacity: 0 }}
          >
            <div style={{ display: "flex" }}>
              <i className="material-icons success_icon">done</i>

              {/* <img src={error} className="modal_icon" /> */}
              <div className="warning_content">
                <h3>{errorHeader ? errorHeader : "Success"}</h3>
                <p>{errorText ? errorText : "Something went wrong!"}</p>
              </div>
            </div>
            <div className="warning_options">
              <i className="material-icons warning_icon" onClick={handleClose}>
                close
              </i>
            </div>
          </motion.div>
        )}
      </motion.div>
      {/* <motion.div
      className="backdrop"
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.div> */}
    </motion.div>
  );
}
