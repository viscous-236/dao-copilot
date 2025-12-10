/**
 * Background service worker for DAO Governance Co-Pilot
 * Handles X402 micropayment events and communication
 */

console.log("[DAO Co-Pilot] Background service worker started");

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[DAO Co-Pilot] Received message:", request);

  if (request.type === "ANALYZE_PROPOSAL") {
    // Handle proposal analysis request
    handleProposalAnalysis(request.data)
      .then(sendResponse)
      .catch((error) => {
        console.error("[DAO Co-Pilot] Analysis error:", error);
        sendResponse({ error: error.message });
      });
    
    return true; // Keep message channel open for async response
  }

  if (request.type === "PAYMENT_REQUIRED") {
    // Handle X402 micropayment
    handleMicropayment(request.data)
      .then(sendResponse)
      .catch((error) => {
        console.error("[DAO Co-Pilot] Payment error:", error);
        sendResponse({ error: error.message });
      });
    
    return true;
  }
});

async function handleProposalAnalysis(data: any) {
  // This will integrate with X402 micropayment later
  console.log("[DAO Co-Pilot] Analyzing proposal:", data);
  
  // For now, just pass through to the API
  return { success: true };
}

async function handleMicropayment(data: any) {
  // TODO: Integrate with X402 micropayment contract
  console.log("[DAO Co-Pilot] Processing micropayment:", data);
  
  return { success: true, txHash: "0x..." };
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log("[DAO Co-Pilot] Extension installed:", details.reason);
  
  if (details.reason === "install") {
    // Show welcome page or setup instructions
    console.log("[DAO Co-Pilot] Welcome to DAO Governance Co-Pilot!");
  }
});
