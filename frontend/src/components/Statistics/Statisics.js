import React, { Component } from "react";
import Chart from "chart.js/auto";
import Dropdown from "../Dropdown/Dropdown";
import "./statistics.scss";
import { motion } from "framer-motion";
import { axiosApiInstance } from "../../helper/request";
import _ from "lodash";
// import dataa from "../assets/data.json";
let colors = [
  "rgba(255, 99, 132, 0.5)",
  "rgba(53, 162, 235, 0.5)",
  "rgba(249, 99, 5, 0.5)",
];
class Statistics extends Component {
  constructor(props) {
    super(props);
    this.myChart = null;
  }

  state = {
    data: {},
    data2: {
      type: this.props.type || "bar",
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
          title: {
            display: true,
            text: this.props.title || "Title",
            color: this.props.theme === "Light" ? "black" : "white",
            font: {
              size: 24,
            },
          },
        },
        scales: {
          // xAxes: [{ gridLines: { drawBorder: false } }],
          // yAxes: [{ gridLines: { drawBorder: false } }],
          x: {
            grid: {
              display: false,
            },
            ticks: {
              display: true, // remove y label
              color: this.props.theme === "Light" ? "black" : "white",
              font: {
                family: "Poppins", // Your font family
                size: 14,
              },
            },
          },
          y: {
            stepSize: 1,
            beginAtZero: true,
            grid: {
              display: false,
              drawBorder: false, // remove y-axis border
              color: "gray", //grid line
            },
            ticks: {
              fixedStepSize: 1,
              display: true, // remove y label
              color: this.props.theme === "Light" ? "black" : "white",
              font: {
                family: "Poppins", // Your font family
                size: 14,
              },
              // Include a dollar sign in the ticks
              callback: function (value, index, values) {
                // return "$" + value;
                return value;
              },
            },
          },
        },
      },
    },
    selectedOption: {
      name: "Day",
      id: "hrs_wise",
    },
  };

  chartRef = React.createRef();

  setData = (reff) => {
    this.myChart = new Chart(reff, { ...this.state.data2 });
  };

  getStatistics = (period = "hrs_wise") => {
    axiosApiInstance
      .get(this.props.link + "?" + period + "=true")
      .then((res) => {
        console.log(this.props.type);
        if (this.props.type === "bar") {
          let _data2 = { ...this.state.data2 };
          _data2.type = this.props.type;
          _data2.data.labels = res.data.detail.labels;
          let _data = [];
          for (let i = 0; i < res.data.detail.dataset.length; i++) {
            let obj = { ...res.data.detail.dataset[i] };
            obj.backgroundColor = colors[i];
            _data.push({ ...obj });
          }
          // console.log(_data);
          _data2.data.datasets = [..._data];
          this.setState({ data2: { ..._data2 } }, () => {
            const myChartRef = this.chartRef.current.getContext("2d");
            this.setData(myChartRef);
          });
        }
      });
  };

  componentDidMount() {
    this.getStatistics();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.theme !== this.props.theme) {
      let _data_ = _.cloneDeep(this.state.data2);
      _data_.options.plugins.title.color =
        this.props.theme === "Light" ? "black" : "white";
      _data_.options.scales.x.ticks.color =
        this.props.theme === "Light" ? "black" : "white";
      _data_.options.scales.y.ticks.color =
        this.props.theme === "Light" ? "black" : "white";
      this.myChart.destroy();
      this.setState({ data2: _data_ }, () => {
        const reff = this.chartRef.current.getContext("2d");
        this.setData(reff);
      });
    }
  }
  render() {
    return (
      <div className="statistics_card">
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "1.2vw",
            right: "1.2vw",
            alignItems: "center",
          }}
        >
          {this.props.filters.map((item) => (
            <div
              className="filter_name"
              style={{
                backgroundColor:
                  this.state.selectedOption.name === item.name
                    ? "var(--primary)"
                    : "#f4f7fe",
                color:
                  this.state.selectedOption.name === item.name
                    ? "white"
                    : "black",
              }}
              onClick={() => {
                let _data = {
                  name: item.name,
                  id: item.id,
                };
                this.setState({ selectedOption: { ..._data } }, () => {
                  this.myChart.destroy();
                  this.getStatistics(item.id);
                });
              }}
            >
              {item.name.substring(0, 1)}
            </div>
          ))}
          {!this.props.expand && (
            <i
              className="material-icons open_in_full"
              style={{ fontSize: "1vw" }}
              onClick={() => this.props.iconClick(this.props)}
            >
              open_in_full
            </i>
          )}
        </div>
        {/* <Dropdown
          className="adjust_dd"
          optionsList={this.props.filters}
          handleOption={(name, id) => {
            console.log(name, id);
            let _data = {
              name,
              id,
            };
            this.setState({ selectedOption: { ..._data } }, () => {
              this.myChart.destroy();
              this.getStatistics(id);
            });
          }}
          defaultText={this.state.selectedOption.name}
          label="Alert Name"
          isObject
        /> */}
        <canvas id={this.props.id} ref={this.chartRef} />
      </div>
    );
  }
}

export default Statistics;
