import React from "react";
import ReactDOM from "react-dom/client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import App from "./App.jsx";
import "./styles/globals.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
);
ChartJS.defaults.color = "#3a5a74";
ChartJS.defaults.borderColor = "rgba(0,220,180,0.07)";
ChartJS.defaults.font.family = "'JetBrains Mono',monospace";
ChartJS.defaults.font.size = 11;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
if (typeof window.__onAppReady === "function") window.__onAppReady();
