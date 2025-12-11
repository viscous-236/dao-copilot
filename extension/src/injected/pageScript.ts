/**
 * Injected page script - has access to window.ethereum
 * Handles wallet connection and X402 payments
 */

(function() {
  console.log('[DAO Co-Pilot] Page script injected');

  // Handle wallet connection requests
  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    
    const { type, requestId } = event.data;
    
    try {
      if (type === 'WALLET_CONNECT_REQUEST') {
        console.log('[DAO Co-Pilot] Wallet connect request received');
        
        if (!window.ethereum) {
          throw new Error('No wallet detected. Please install MetaMask or Coinbase Wallet.');
        }
        
        // Request accounts
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        // Get chain ID
        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        });
        
        console.log('[DAO Co-Pilot] Wallet connected:', accounts[0]);
        
        window.postMessage({
          type: 'WALLET_CONNECT_RESPONSE',
          requestId,
          data: {
            address: accounts[0],
            chainId
          }
        }, '*');
        
      } else if (type === 'SWITCH_NETWORK_REQUEST') {
        console.log('[DAO Co-Pilot] Switch network request:', event.data.chainId);
        
        if (!window.ethereum) {
          throw new Error('No wallet detected');
        }
        
        const targetChainId = event.data.chainId;
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }]
          });
        } catch (switchError: any) {
          // Chain not added, try to add it
          if (switchError.code === 4902 && targetChainId === '0x14a34') {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetChainId,
                chainName: 'Base Sepolia',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://sepolia.base.org'],
                blockExplorerUrls: ['https://sepolia-explorer.base.org']
              }]
            });
          } else {
            throw switchError;
          }
        }
        
        console.log('[DAO Co-Pilot] Network switched');
        
        window.postMessage({
          type: 'SWITCH_NETWORK_RESPONSE',
          requestId,
          data: {}
        }, '*');
        
      } else if (type === 'PAYMENT_REQUEST') {
        console.log('[DAO Co-Pilot] Payment request received');
        
        // Import x402-fetch dynamically
        const { wrapFetchWithPayment, createSigner } = await import('x402-fetch');
        const { createWalletClient, custom } = await import('viem');
        const { baseSepolia } = await import('viem/chains');
        
        if (!window.ethereum) {
          throw new Error('No wallet detected');
        }
        
        // Create wallet client
        const walletClient = createWalletClient({
          chain: baseSepolia,
          transport: custom(window.ethereum)
        });
        
        // Create signer
        const signer = createSigner(walletClient);
        
        // Wrap fetch with payment
        const fetchWithPayment = wrapFetchWithPayment(
          fetch,
          signer,
          BigInt(10000) // 0.01 USDC max
        );
        
        // Make request
        const response = await fetchWithPayment(event.data.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event.data.body)
        });
        
        if (!response.ok) {
          throw new Error(`Request failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('[DAO Co-Pilot] Payment completed successfully');
        
        window.postMessage({
          type: 'PAYMENT_RESPONSE',
          requestId,
          data
        }, '*');
      }
      
    } catch (error: any) {
      console.error('[DAO Co-Pilot] Error:', error);
      
      window.postMessage({
        type: `${type.replace('_REQUEST', '_RESPONSE')}`,
        requestId,
        error: error?.message || 'Unknown error'
      }, '*');
    }
  });
  
  console.log('[DAO Co-Pilot] Page script ready');
})();
