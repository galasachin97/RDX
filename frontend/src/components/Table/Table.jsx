import { motion } from "framer-motion";
import React, { Component } from "react";
import "./table.scss";
// import loading from "../../images/loading.gif";
class Table extends Component {
  state = {};
  render() {
    if (this.props.isLoading) {
      return (
        <div id="loader">
          {/* <img src={loading} style={{ zIndex: 1, width: "10vw" }} /> */}
        </div>
      );
    } else {
      return (
        <motion.table
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{ duration: 0.5 }}
          className="tableContainer"
          style={this.props.style}
        >
          <tbody>{this.props.children}</tbody>
        </motion.table>
      );
    }
  }
}

export default Table;
