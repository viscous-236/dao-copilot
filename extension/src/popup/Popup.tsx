import React from "react";
import ReactDOM from "react-dom/client";

/**
 * Extension popup UI
 */

const Popup: React.FC = () => {
  return (
    <div style={{ 
      width: "300px", 
      padding: "20px", 
      fontFamily: "system-ui, -apple-system, sans-serif" 
    }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>🤖 DAO Co-Pilot</h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
          AI-Powered Governance Assistant
        </p>
      </div>

      <div style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "16px",
        borderRadius: "10px",
        marginBottom: "16px"
      }}>
        <p style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
          How it works:
        </p>
        <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", lineHeight: "1.6" }}>
          <li>Visit a DAO proposal page</li>
          <li>Click "Ask AI" in the floating panel</li>
          <li>Get instant AI analysis</li>
          <li>Vote with confidence!</li>
        </ol>
      </div>

      <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.6" }}>
        <p style={{ margin: "0 0 10px 0", fontWeight: "600" }}>Supported DAOs:</p>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          <li>Uniswap DAO</li>
          <li>Snapshot (various DAOs)</li>
        </ul>
      </div>

      <div style={{ 
        marginTop: "20px", 
        paddingTop: "16px", 
        borderTop: "1px solid #e5e7eb",
        textAlign: "center"
      }}>
        <p style={{ margin: 0, fontSize: "11px", color: "#999" }}>
          Powered by X402 Micropayments
        </p>
      </div>
    </div>
  );
};

// Mount popup
const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}
