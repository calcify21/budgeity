import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.Suspense fallback={<div />}>
    <App />
  </React.Suspense>,
);

// Service Worker Update Handling
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (installingWorker) {
        installingWorker.onstatechange = () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New content is available; force a simple page reload
            // This is the simplest way to ensure users are updated
            window.location.reload();
          }
        };
      }
    };
  });
}
