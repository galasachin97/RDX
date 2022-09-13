import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./lineGraph.scss";

const options = {
  responsive: true,
  lineTension: 0.4,
  scales: {
    x: {
      ticks: {
        color: "black",
      },
      grid: {
        drawBorder: false,
      },
    },
    y: {
      ticks: {
        color: "black",
      },
      grid: {
        display: false,
        drawBorder: false,
      },
    },
  },

  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Alerts",
    },
  },
};

const labels = ["January", "February", "March", "April", "May", "June", "July"];
const data = {
  labels,
  datasets: [
    {
      label: "Mask",
      data: ["0.4", "0.2", "0.8", "2", "1", "0.2", "1.8"],
      borderColor: "rgb(255, 99, 132)",
      backgroundColor: "rgba(255, 99, 132, 0.5)",
    },
    {
      label: "Person",
      data: ["0.2", "1.2", "0.4", "1.2", "0.2", "0.8", "0.2"],
      borderColor: "rgb(53, 162, 235)",
      backgroundColor: "rgba(53, 162, 235, 0.5)",
    },
  ],
};

export default function LineGraph() {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

  return (
    <div className="LineGraph">
      <Line options={options} data={data} />
    </div>
  );
}
