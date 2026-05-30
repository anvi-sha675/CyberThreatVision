import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuthStore, useThreatStore } from "./store/index.js";
import AppShell from "./components/shared/AppShell.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ScanPage from "./pages/ScanPage.jsx";
import MapPage from "./pages/MapPage.jsx";
import AlertsPage from "./pages/AlertsPage.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import DatasetPage from "./pages/DatasetPage.jsx";
import MalwarePage from "./pages/MalwarePage.jsx";
import LogsPage from "./pages/LogsPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

function SocketProvider({ children }) {
  const { token } = useAuthStore();
  const { addThreat, addAlert, setConnected } = useThreatStore();

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("new_threat", (t) => addThreat(t));
    socket.on("new_alert", (a) => addAlert(a));
    socket.on("critical_alert", (a) =>
      window.dispatchEvent(
        new CustomEvent("ctv:critical_alert", { detail: a }),
      ),
    );
    return () => {
      socket.disconnect();
      setConnected(false);
    };
  }, [token]);

  return children;
}

const Protected = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const { token } = useAuthStore();
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route
            path="/"
            element={
              <Protected>
                <AppShell />
              </Protected>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="scan" element={<ScanPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="datasets" element={<DatasetPage />} />
            <Route path="malware" element={<MalwarePage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}
