/**
 * Ethereum bridge that communicates with injected page script via postMessage
 * This allows content scripts to access window.ethereum which is in page context
 */

interface EthRequest {
  method: string;
  params?: any[];
}

/**
 * Send ethereum request to injected bridge and get response
 */
export function sendEthRequest(payload: EthRequest): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2);
    
    console.log('[DAO Co-Pilot Bridge] Sending request:', id, payload);
    
    function onMessage(event: MessageEvent) {
      if (!event.data || event.data.__DAO_BRIDGE !== true) return;
      if (event.data.id !== id) return;

      console.log('[DAO Co-Pilot Bridge] Received response:', event.data);
      
      window.removeEventListener("message", onMessage);
      
      if (event.data.ok) {
        resolve(event.data.result);
      } else {
        if (event.data.error === "NO_WALLET") {
          reject(new Error('No wallet detected. Please install MetaMask or Coinbase Wallet and refresh the page.'));
        } else {
          console.error('[DAO Co-Pilot Bridge] Error from bridge:', event.data.error);
          reject(new Error(event.data.error || "unknown_error"));
        }
      }
    }
    
    window.addEventListener("message", onMessage);
    
    // send request to page-injected bridge
    window.postMessage({ __DAO_BRIDGE: true, id, type: "ETH_REQUEST", payload }, "*");

    // timeout after 30 seconds
    setTimeout(() => {
      window.removeEventListener("message", onMessage);
      console.error('[DAO Co-Pilot Bridge] Request timeout for:', payload.method);
      reject(new Error("Request timeout - wallet not responding"));
    }, 30000);
  });
}

/**
 * Check if the bridge is loaded
 */
export function isBridgeLoaded(): boolean {
  return !!(window as any).__DAO_INJECTED_ETH_BRIDGE;
}

/**
 * Wait for bridge to be ready
 */
export async function waitForBridge(timeout = 10000): Promise<void> {
  const start = Date.now();
  let attempts = 0;
  while (!isBridgeLoaded()) {
    attempts++;
    if (Date.now() - start > timeout) {
      console.error('[DAO Co-Pilot] Bridge not loaded after', attempts, 'attempts');
      console.error('[DAO Co-Pilot] Window object:', typeof window);
      console.error('[DAO Co-Pilot] __DAO_INJECTED_ETH_BRIDGE:', (window as any).__DAO_INJECTED_ETH_BRIDGE);
      throw new Error('Bridge not loaded. Please refresh the page and try again.');
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  console.log('[DAO Co-Pilot] Bridge is ready after', attempts, 'attempts');
}

/**
 * Create a proxy ethereum provider that uses the bridge
 */
export function createBridgedEthereumProvider() {
  return {
    request: async (args: { method: string; params?: any[] }) => {
      // Ensure bridge is loaded before making request
      await waitForBridge();
      return sendEthRequest(args);
    },
    // Add other methods as needed
    on: (event: string, handler: any) => {
      // Listen for forwarded events
      window.addEventListener("message", (e) => {
        if (e.data?.__DAO_BRIDGE && e.data.type === "ETH_EVENT" && e.data.event === event) {
          handler(e.data.accounts || e.data.chainId);
        }
      });
    },
  };
}
