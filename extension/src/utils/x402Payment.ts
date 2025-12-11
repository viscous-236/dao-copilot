import { wrapFetchWithPayment, createSigner, type Signer } from 'x402-fetch';
import { createWalletClient, custom } from 'viem';
import { baseSepolia } from 'viem/chains';
import { createBridgedEthereumProvider } from './ethereumBridge';

export interface PaymentConfig {
  apiUrl: string;
  facilitatorUrl?: string;
}

/**
 * Get the user's wallet signer from browser extension (MetaMask, Coinbase Wallet, etc.)
 * Uses message bridge to communicate with window.ethereum in page context
 */
async function getBrowserWalletSigner(): Promise<Signer> {
  // Use bridged ethereum provider that communicates via postMessage
  const ethereum = createBridgedEthereumProvider();

  // Request account access
  let accounts: string[];
  try {
    accounts = await ethereum.request({
      method: 'eth_requestAccounts',
      params: [],
    }) as string[];
  } catch (err: any) {
    if (err.message === 'NO_WALLET') {
      throw new Error('No wallet detected. Please install MetaMask or Coinbase Wallet and refresh the page.');
    }
    throw err;
  }

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Please connect your wallet.');
  }

  // Check if on Base Sepolia
  const chainId = await ethereum.request({ 
    method: 'eth_chainId',
    params: []
  }) as string;
  const baseSepoliaChainId = '0x14a34'; // 84532 in hex

  if (chainId !== baseSepoliaChainId) {
    // Try to switch to Base Sepolia
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: baseSepoliaChainId }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      const errorMessage = switchError?.message || '';
      if (errorMessage.includes('4902') || errorMessage.includes('Unrecognized chain')) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: baseSepoliaChainId,
            chainName: 'Base Sepolia',
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia-explorer.base.org'],
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  // Create wallet client
  const walletClient = createWalletClient({
    chain: baseSepolia,
    transport: custom(ethereum),
  });

  // Convert viem wallet client to x402 signer
  const signer = createSigner(walletClient);

  return signer;
}

/**
 * Makes a payment-protected API call using X402
 * Handles wallet connection and payment automatically
 */
export async function makeX402Request<T>(
  url: string,
  options: RequestInit,
  config: PaymentConfig
): Promise<T> {
  try {
    console.log('[DAO Co-Pilot] 🔄 Connecting wallet for X402 payment...');
    
    // Get wallet signer
    const signer = await getBrowserWalletSigner();
    
    console.log('[DAO Co-Pilot] ✅ Wallet connected');
    
    // Wrap fetch with X402 payment handling
    // maxValue set to 0.01 USDC (10000 base units = $0.01)
    const fetchWithPayment = wrapFetchWithPayment(
      fetch,
      signer,
      BigInt(10000), // 0.01 USDC max
      undefined, // use default payment selector
      config.facilitatorUrl ? { evmConfig: { rpcUrl: undefined } } : undefined
    );
    
    console.log('[DAO Co-Pilot] 📡 Making request with payment support...');
    
    // Make the request (payment will be handled automatically if needed)
    const response = await fetchWithPayment(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[DAO Co-Pilot] ✅ Request successful!');
    
    return data;
  } catch (error) {
    console.error('[DAO Co-Pilot] ❌ Payment error:', error);
    
    if (error instanceof Error) {
      // Provide user-friendly error messages
      if (error.message.includes('No wallet detected')) {
        throw new Error('Please install MetaMask or Coinbase Wallet to make micropayments.');
      } else if (error.message.includes('User rejected')) {
        throw new Error('Payment cancelled. Please approve the transaction to continue.');
      } else {
        throw error;
      }
    }
    
    throw error;
  }
}

/**
 * Simplified wrapper for POST requests with X402 payment
 */
export async function makeX402PostRequest<T>(
  url: string,
  body: any,
  config: PaymentConfig
): Promise<T> {
  return makeX402Request<T>(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    config
  );
}
