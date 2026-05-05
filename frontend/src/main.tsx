import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
// Mock API disabled to use real backend

setBaseUrl(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000");
setAuthTokenGetter(() => localStorage.getItem("nazabarber_token"));

document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
