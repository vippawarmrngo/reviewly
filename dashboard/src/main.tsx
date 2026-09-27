import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "@fontsource-variable/inter";
import { MotionProvider } from "./motion/MotionProvider";
import { migrateLegacyHash } from "./route";
import "./styles.css";

migrateLegacyHash();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MotionProvider>
        <App />
      </MotionProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
