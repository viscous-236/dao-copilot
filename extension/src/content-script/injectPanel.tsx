import React from "react";
import ReactDOM from "react-dom/client";
import App from "../ui/App";


// Check if we're on a Uniswap governance page
const isUniswapGovernancePage = () => {
  return window.location.hostname === "vote.uniswapfoundation.org";
};

// Check if we're on a Snapshot page
const isSnapshotPage = () => {
  return window.location.hostname === "snapshot.org";
};

// Extract proposal ID from URL
const getProposalId = (): string | null => {
  if (isUniswapGovernancePage()) {
    // URL format: https://vote.uniswapfoundation.org/proposals/{id}
    const match = window.location.pathname.match(/\/proposals\/([^/]+)/);
    return match ? match[1] : null;
  }
  
  if (isSnapshotPage()) {
    // URL format: https://snapshot.org/#/{space}/proposal/{id}
    const match = window.location.hash.match(/\/proposal\/([^/]+)/);
    return match ? match[1] : null;
  }
  
  return null;
};

// Get DAO ID from the current page
const getDaoId = (): string => {
  if (isUniswapGovernancePage()) {
    return "uniswap";
  }
  
  if (isSnapshotPage()) {
    // Extract space name from URL
    const match = window.location.hash.match(/#\/([^/]+)/);
    return match ? match[1] : "unknown";
  }
  
  return "unknown";
};

// Inject the AI panel into the page
function injectPanel() {
  const proposalId = getProposalId();
  
  // Only inject if we're on a proposal page
  if (!proposalId) {
    console.log("[DAO Co-Pilot] Not on a proposal page, skipping injection");
    return;
  }

  // Check if panel already exists
  if (document.getElementById("dao-ai-panel")) {
    console.log("[DAO Co-Pilot] Panel already injected");
    return;
  }

  console.log(`[DAO Co-Pilot] Injecting AI panel for proposal: ${proposalId}`);

  // Create the container div
  const panelContainer = document.createElement("div");
  panelContainer.id = "dao-ai-panel";
  
  // Find where to inject the panel
  let targetElement: Element | null = null;

  if (isUniswapGovernancePage()) {
    // Look for the main content area
    // Uniswap uses different layouts, try multiple selectors
    targetElement = 
      document.querySelector('main') || 
      document.querySelector('.proposal-container') ||
      document.querySelector('[class*="proposal"]') ||
      document.querySelector('body > div');
  } else if (isSnapshotPage()) {
    // Snapshot typically has a main container
    targetElement = 
      document.querySelector('main') ||
      document.querySelector('.container') ||
      document.querySelector('body > div');
  }

  if (!targetElement) {
    console.warn("[DAO Co-Pilot] Could not find target element to inject panel");
    // Fallback: inject at the top of body
    targetElement = document.body;
  }

  // Insert panel at the beginning of the target element
  targetElement.insertBefore(panelContainer, targetElement.firstChild);

  // Mount React app
  const root = ReactDOM.createRoot(panelContainer);
  const daoId = getDaoId();
  
  root.render(
    <React.StrictMode>
      <App proposalId={proposalId} daoId={daoId} />
    </React.StrictMode>
  );

  console.log("[DAO Co-Pilot] AI panel injected successfully!");
}

// Try to inject immediately
injectPanel();

// Also watch for navigation changes (for SPAs)
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log("[DAO Co-Pilot] URL changed, attempting to inject panel...");
    
    // Wait a bit for the page to render
    setTimeout(injectPanel, 1000);
  }
});

// Observe URL changes
observer.observe(document, { subtree: true, childList: true });

// Also listen for popstate events (back/forward navigation)
window.addEventListener("popstate", () => {
  setTimeout(injectPanel, 500);
});

// Listen for hashchange (for Snapshot)
window.addEventListener("hashchange", () => {
  setTimeout(injectPanel, 500);
});

console.log("[DAO Co-Pilot] Content script loaded!");
