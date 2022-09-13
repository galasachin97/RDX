import React from "react";
import Scrollbars from "react-custom-scrollbars";
import { BoxCard } from "../card/Card";
import "./status.scss";
export const statusData = [
  {
    name: "Baygate 1",
    status: "Active",
  },
  {
    name: "Baygate 2",
    status: "Inactive",
  },
  {
    name: "Baygate 3",
    status: "InOperation",
  },
  {
    name: "Baygate 4",
    status: "Inactive",
  },
  {
    name: "Baygate 5",
    status: "Active",
  },
  {
    name: "Baygate 6",
    status: "InOperation",
  },
  {
    name: "Baygate 7",
    status: "Inactive",
  },
  {
    name: "Baygate 8",
    status: "Active",
  },
  {
    name: "Baygate 1",
    status: "Active",
  },
  {
    name: "Baygate 2",
    status: "Inactive",
  },
  {
    name: "Baygate 3",
    status: "InOperation",
  },
  {
    name: "Baygate 4",
    status: "Inactive",
  },
  {
    name: "Baygate 5",
    status: "Active",
  },
  {
    name: "Baygate 6",
    status: "InOperation",
  },
  {
    name: "Baygate 7",
    status: "Inactive",
  },
  {
    name: "Baygate 8",
    status: "Active",
  },
  {
    name: "Baygate 1",
    status: "Active",
  },
  {
    name: "Baygate 2",
    status: "Inactive",
  },
  {
    name: "Baygate 3",
    status: "InOperation",
  },
  {
    name: "Baygate 4",
    status: "Inactive",
  },
  {
    name: "Baygate 5",
    status: "Active",
  },
  {
    name: "Baygate 6",
    status: "InOperation",
  },
  {
    name: "Baygate 7",
    status: "Inactive",
  },
  {
    name: "Baygate 8",
    status: "Active",
  },
  {
    name: "Baygate 1",
    status: "Active",
  },
  {
    name: "Baygate 2",
    status: "Inactive",
  },
  {
    name: "Baygate 3",
    status: "InOperation",
  },
  {
    name: "Baygate 4",
    status: "Inactive",
  },
  {
    name: "Baygate 5",
    status: "Active",
  },
  {
    name: "Baygate 6",
    status: "InOperation",
  },
  {
    name: "Baygate 7",
    status: "Inactive",
  },
  {
    name: "Baygate 8",
    status: "Active",
  },
];
export default function StatusCard({ name, dataa, iconClick }) {
  return (
    <BoxCard
      style={{
        padding: "10px 25px",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        paddingRight: "4px",
        // display: "flex",
        // alignItems: "center",
      }}
    >
      <div className="status_card">
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1>{name}</h1>
          <i
            className="material-icons"
            style={{ fontSize: "1vw", paddingRight: "10px" }}
            onClick={iconClick}
          >
            open_in_full
          </i>
        </div>
        <div className="stat_data">
          <Scrollbars autoHeight autoHeightMax="17vh">
            {statusData.map((item) => {
              if (item.status === "Active") {
                return (
                  <div className="status">
                    <p>{item.name}</p>
                    <p
                      className="active__"
                      style={{ backgroundColor: "green" }}
                    >
                      Active
                    </p>
                  </div>
                );
              } else if (item.status === "Inactive") {
                return (
                  <div className="status">
                    <p> {item.name}</p>
                    <p className="active__" style={{ backgroundColor: "red" }}>
                      {" "}
                      Inactive
                    </p>
                  </div>
                );
              } else {
                return (
                  <div className="status">
                    <p> {item.name}</p>
                    <p
                      className="active__"
                      style={{ backgroundColor: "orange" }}
                    >
                      {" "}
                      In Operation
                    </p>
                  </div>
                );
              }
            })}
          </Scrollbars>
        </div>
      </div>
    </BoxCard>
  );
}
