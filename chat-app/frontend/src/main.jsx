import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Initialize socket if user is already logged in
import { initSocket } from "./utils/socket";
const token = localStorage.getItem("chat_token");
if (token) initSocket(token);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
