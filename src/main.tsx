import { Provider } from "@/components/ui/provider";
import { WorkflowRunProvider } from "@/contexts/WorkflowRunProvider";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./i18n/config";
import "./styles/scrollbar.css";
import "./styles/accessibility.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider>
      <WorkflowRunProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </WorkflowRunProvider>
    </Provider>
  </React.StrictMode>,
);
