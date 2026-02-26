import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { BlockchainProvider } from "./context/BlockchainContext";

import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "remixicon/fonts/remixicon.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BlockchainProvider>
      <Router>
        <App />
      </Router>
    </BlockchainProvider>
  </React.StrictMode>
);
