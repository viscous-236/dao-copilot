// This script runs in the page context and has access to window.ethereum
(function() {
  console.log('[Wallet Bridge] Initializing wallet bridge...');
  
  // Listen for requests from content script
  window.addEventListener('message', async (event) => {
    // Only accept messages from same origin
    if (event.source !== window) return;
    
    const { type, requestId } = event.data;
    
    if (type === 'REQUEST_WALLET_CONNECTION') {
      console.log('[Wallet Bridge] Received wallet connection request');
      
      try {
        // Check if MetaMask is installed
        if (!window.ethereum) {
          throw new Error('MetaMask is not installed');
        }
        
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        const address = accounts[0];
        console.log('[Wallet Bridge] Connected to wallet:', address);
        
        // Send success response back to content script
        window.postMessage({
          type: 'WALLET_CONNECTED',
          address: address,
          requestId: requestId
        }, '*');
        
      } catch (error) {
        console.error('[Wallet Bridge] Wallet connection error:', error);
        
        // Send error response back to content script
        window.postMessage({
          type: 'WALLET_ERROR',
          error: error.message || 'Failed to connect wallet',
          requestId: requestId
        }, '*');
      }
    }
    
    // Handle generic RPC requests (for viem)
    if (type === 'RPC_REQUEST') {
      const { method, params } = event.data;
      console.log('[Wallet Bridge] Received RPC request:', method, params);
      
      try {
        if (!window.ethereum) {
          throw new Error('MetaMask is not installed');
        }
        
        // Forward request to MetaMask
        const result = await window.ethereum.request({
          method,
          params: params || []
        });
        
        console.log('[Wallet Bridge] RPC response:', result);
        
        window.postMessage({
          type: 'RPC_RESPONSE',
          result: result,
          requestId: requestId
        }, '*');
        
      } catch (error) {
        console.error('[Wallet Bridge] RPC error:', error);
        
        window.postMessage({
          type: 'RPC_ERROR',
          error: error.message || 'RPC request failed',
          requestId: requestId
        }, '*');
      }
    }
    
    // Handle network switch requests
    if (type === 'REQUEST_SWITCH_NETWORK') {
      const { chainId } = event.data;
      console.log('[Wallet Bridge] Received network switch request to chainId:', chainId);
      
      try {
        if (!window.ethereum) {
          throw new Error('MetaMask is not installed');
        }
        
        // Try to switch to the requested network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + chainId.toString(16) }],
        });
        
        console.log('[Wallet Bridge] Successfully switched to network:', chainId);
        
        window.postMessage({
          type: 'NETWORK_SWITCHED',
          chainId: chainId,
          requestId: requestId
        }, '*');
        
      } catch (error) {
        console.error('[Wallet Bridge] Network switch error:', error);
        
        // If network doesn't exist, try to add it
        if (error.code === 4902 && chainId === 84532) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x14a34',
                chainName: 'Base Sepolia',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://sepolia.base.org'],
                blockExplorerUrls: ['https://sepolia.basescan.org']
              }],
            });
            
            console.log('[Wallet Bridge] Added and switched to Base Sepolia');
            
            window.postMessage({
              type: 'NETWORK_SWITCHED',
              chainId: chainId,
              requestId: requestId
            }, '*');
            
          } catch (addError) {
            console.error('[Wallet Bridge] Failed to add network:', addError);
            window.postMessage({
              type: 'NETWORK_SWITCH_ERROR',
              error: addError.message || 'Failed to add network',
              requestId: requestId
            }, '*');
          }
        } else {
          window.postMessage({
            type: 'NETWORK_SWITCH_ERROR',
            error: error.message || 'Failed to switch network',
            requestId: requestId
          }, '*');
        }
      }
    }
  });
  
  console.log('[Wallet Bridge] Wallet bridge initialized successfully');
})();
