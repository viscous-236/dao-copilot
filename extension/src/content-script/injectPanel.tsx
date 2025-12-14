import React from "react";
import ReactDOM from "react-dom/client";
import App from "../ui/App";

console.log('[DAO Co-Pilot] Content script loaded');

// Inject wallet bridge script into page context
function injectWalletBridge() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected/walletBridge.js');
  script.onload = () => {
    console.log('[DAO Co-Pilot] Wallet bridge injected');
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// Inject the bridge as early as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectWalletBridge);
} else {
  injectWalletBridge();
}

// Check if we're on a Uniswap governance page
const isUniswapGovernancePage = () => {
  return window.location.hostname === "vote.uniswapfoundation.org";
};

// Check if we're on a Snapshot page
const isSnapshotPage = () => {
  return window.location.hostname === "snapshot.org";
};

// Check if we're on a create proposal page
const isCreatePage = (): boolean => {
  if (isSnapshotPage()) {
    // URL format: https://snapshot.org/#/s:{space}/create/{id}
    return window.location.hash.includes('/create/');
  }
  return false;
};

// Extract proposal ID from URL
const getProposalId = (): string | null => {
  if (isUniswapGovernancePage()) {
    // URL format: https://vote.uniswapfoundation.org/proposals/{id}
    const match = window.location.pathname.match(/\/proposals\/([^/]+)/);
    return match ? match[1] : null;
  }
  
  if (isSnapshotPage()) {
    // URL format for viewing: https://snapshot.org/#/{space}/proposal/{id}
    const viewMatch = window.location.hash.match(/\/proposal\/([^/]+)/);
    if (viewMatch) return viewMatch[1];
    
    // URL format for creating: https://snapshot.org/#/s:{space}/create/{id}
    const createMatch = window.location.hash.match(/\/create\/([^/]+)/);
    if (createMatch) return 'draft-' + createMatch[1];
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
  console.log('[DAO Co-Pilot] injectPanel() called');
  console.log('[DAO Co-Pilot] Current URL:', window.location.href);
  
  const proposalId = getProposalId();
  console.log('[DAO Co-Pilot] Proposal ID:', proposalId);
  
  // Remove existing panel if it exists
  const existingPanel = document.getElementById("dao-ai-panel");
  if (existingPanel) {
    console.log("[DAO Co-Pilot] Removing existing panel");
    existingPanel.remove();
  }
  
  // Only inject if we're on a proposal page
  if (!proposalId) {
    console.log("[DAO Co-Pilot] Not on a proposal page, panel removed");
    return;
  }

  console.log(`[DAO Co-Pilot] Injecting AI panel for proposal: ${proposalId}`);

  // Wait for document.head to be available
  if (!document.head) {
    console.log('[DAO Co-Pilot] document.head not ready, waiting...');
    setTimeout(() => injectPanel(), 100);
    return;
  }

  // Inject CSS (only once)
  if (!document.getElementById('dao-copilot-css')) {
    const cssLink = document.createElement("link");
    cssLink.id = 'dao-copilot-css';
    cssLink.rel = "stylesheet";
    cssLink.href = chrome.runtime.getURL("content-script/injectPanel.css");
    document.head.appendChild(cssLink);
    console.log('[DAO Co-Pilot] CSS injected');
  }

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

  if (!targetElement) {
    console.error("[DAO Co-Pilot] No target element available, aborting");
    return;
  }

  // Insert panel at the beginning of the target element
  targetElement.insertBefore(panelContainer, targetElement.firstChild);

  // Mount React app
  const root = ReactDOM.createRoot(panelContainer);
  const daoId = getDaoId();
  const isDraft = proposalId.startsWith('draft-');
  
  root.render(
    <React.StrictMode>
      <App proposalId={proposalId} daoId={daoId} isDraft={isDraft} />
    </React.StrictMode>
  );

  console.log("[DAO Co-Pilot] AI panel injected successfully!");
}

// Wait for DOM to be ready before injecting
if (document.readyState === 'loading') {
  console.log('[DAO Co-Pilot] DOM is loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[DAO Co-Pilot] DOMContentLoaded fired, injecting panel...');
    setTimeout(injectPanel, 500);
  });
} else {
  console.log('[DAO Co-Pilot] DOM already loaded, injecting panel...');
  setTimeout(injectPanel, 500);
}

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
