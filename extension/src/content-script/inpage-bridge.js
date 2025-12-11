// Injected into page context to access window.ethereum
(function () {
  // only inject once
  if (window.__DAO_INJECTED_ETH_BRIDGE) return;
  window.__DAO_INJECTED_ETH_BRIDGE = true;

  console.log('[DAO Co-Pilot Bridge] Injected into page context');

  // Listen for requests from the content script/page UI
  window.addEventListener("message", async (event) => {
    if (!event.data || event.data.__DAO_BRIDGE !== true) return;

    const { id, type, payload } = event.data;

    try {
      if (type === "ETH_REQUEST") {
        if (!window.ethereum) {
          // respond with special error marker
          window.postMessage({ __DAO_BRIDGE: true, id, ok: false, error: "NO_WALLET" }, "*");
          return;
        }
        // Example: payload = { method: 'eth_requestAccounts', params: [] }
        const result = await window.ethereum.request({
          method: payload.method,
          params: payload.params || [],
        });
        window.postMessage({ __DAO_BRIDGE: true, id, ok: true, result }, "*");
      }
    } catch (err) {
      window.postMessage({ __DAO_BRIDGE: true, id, ok: false, error: String(err) }, "*");
    }
  });

  // Optional: forward wallet events to the extension/page
  if (window.ethereum && window.ethereum.on) {
    window.ethereum.on("accountsChanged", (accounts) =>
      window.postMessage({ __DAO_BRIDGE: true, type: "ETH_EVENT", event: "accountsChanged", accounts }, "*")
    );
    window.ethereum.on("chainChanged", (chainId) =>
      window.postMessage({ __DAO_BRIDGE: true, type: "ETH_EVENT", event: "chainChanged", chainId }, "*")
    );
  }

  console.log('[DAO Co-Pilot Bridge] Ready, ethereum available:', !!window.ethereum);
})();
