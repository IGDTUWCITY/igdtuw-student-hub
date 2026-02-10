import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  localStorage.setItem("vite-ui-theme", "light");
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add("light");
} catch {
  // Ignore storage access issues (private mode, disabled storage, etc.)
}

createRoot(document.getElementById("root")!).render(<App />);
