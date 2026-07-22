import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Safely suppress MetaMask and other third-party extension errors in sandboxed iframe environment
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (event.message && (
      event.message.toLowerCase().includes("metamask") ||
      event.message.toLowerCase().includes("ethereum") ||
      event.message.toLowerCase().includes("web3")
    )) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (reason) {
      const reasonStr = String(reason.message || reason).toLowerCase();
      if (reasonStr.includes("metamask") || reasonStr.includes("ethereum") || reasonStr.includes("web3")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


