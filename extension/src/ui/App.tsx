import React, { useState } from "react";
import "./App.css";
import { wrapFetchWithPayment, createSigner } from 'x402-fetch';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { baseSepolia } from 'viem/chains';
import type { Account } from 'viem';

interface AppProps {
  proposalId: string;
  daoId: string;
}

interface AnalysisResult {
  summary: string;
  benefits: string[];
  risks: string[];
  recommendation: "YES" | "NO" | "ABSTAIN";
  confidence: number;
  reasoning: string;
}

interface ProposalContent {
  text: string;
  images: string[];
  title: string;
  topics: string[];
  author: string;
  type: string;
}

const App: React.FC<AppProps> = ({ proposalId, daoId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      const requestId = Math.random().toString(36).substring(7);
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.requestId !== requestId) return;
        
        if (event.data.type === 'WALLET_CONNECTED') {
          console.log('[DAO Co-Pilot] Wallet connected:', event.data.address);
          setWalletAddress(event.data.address);
          setError(null);
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'WALLET_ERROR') {
          console.error('[DAO Co-Pilot] Wallet error:', event.data.error);
          setError(event.data.error);
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      console.log('[DAO Co-Pilot] Requesting wallet connection...');
      window.postMessage({ 
        type: 'REQUEST_WALLET_CONNECTION',
        requestId: requestId
      }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
      }, 30000);
      
    } catch (err) {
      console.error('[DAO Co-Pilot] Connect wallet error:', err);
      setError("Failed to connect wallet");
    }
  };

  const createBridgedProvider = () => {
    return {
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        return new Promise((resolve, reject) => {
          const requestId = Math.random().toString(36).substring(7);
          
          const handleMessage = (event: MessageEvent) => {
            if (event.data.requestId !== requestId) return;
            
            if (event.data.type === 'RPC_RESPONSE') {
              console.log(`[DAO Co-Pilot] RPC response for ${method}:`, event.data.result);
              resolve(event.data.result);
              window.removeEventListener('message', handleMessage);
            } else if (event.data.type === 'RPC_ERROR') {
              console.error(`[DAO Co-Pilot] RPC error for ${method}:`, event.data.error);
              reject(new Error(event.data.error));
              window.removeEventListener('message', handleMessage);
            }
          };
          
          window.addEventListener('message', handleMessage);
          
          console.log(`[DAO Co-Pilot] Sending RPC request: ${method}`, params);
          window.postMessage({
            type: 'RPC_REQUEST',
            method,
            params,
            requestId
          }, '*');
          
          setTimeout(() => {
            window.removeEventListener('message', handleMessage);
            reject(new Error(`RPC timeout for ${method}`));
          }, 60000);
        });
      },
    };
  };

  const getViemWalletClient = (): WalletClient => {
    console.log('[DAO Co-Pilot] Creating viem wallet client with bridged provider...');
    const provider = createBridgedProvider();
    console.log('[DAO Co-Pilot] Bridged provider created:', provider);
    const account: Account = {
      address: walletAddress as `0x${string}`,
      type: 'json-rpc',
    };
    
    console.log('[DAO Co-Pilot] Creating wallet client for account:', account);
    return createWalletClient({
      account,
      chain: baseSepolia,
      transport: custom(provider),
    });
  };

  const switchToBaseSepolia = async (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(7);
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.requestId !== requestId) return;
        
        if (event.data.type === 'NETWORK_SWITCHED') {
          console.log('[DAO Co-Pilot] Network switched successfully');
          resolve(true);
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'NETWORK_SWITCH_ERROR') {
          console.error('[DAO Co-Pilot] Network switch error:', event.data.error);
          reject(new Error(event.data.error));
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      console.log('[DAO Co-Pilot] Requesting network switch to Base Sepolia (84532)');
      window.postMessage({
        type: 'REQUEST_SWITCH_NETWORK',
        chainId: 84532,
        requestId: requestId
      }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        reject(new Error('Network switch timeout'));
      }, 30000);
    });
  };

  const handleAnalyze = async () => {
    if (!walletAddress) {
      setError("Please connect your wallet first");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      console.log("[DAO Co-Pilot] Switching to Base Sepolia network...");
      try {
        await switchToBaseSepolia();
        console.log("[DAO Co-Pilot] Successfully switched to Base Sepolia");
      } catch (err) {
        throw new Error("Please switch to Base Sepolia network in MetaMask to continue");
      }
      
      const proposalContent = extractProposalContent();
      setExtractedImages(proposalContent.images);

      console.log("[DAO Co-Pilot] Extracted content:", {
        textLength: proposalContent.text.length,
        imageCount: proposalContent.images.length,
        title: proposalContent.title,
      });

      const requestBody = JSON.stringify({
        daoId,
        proposalId,
        proposalText: proposalContent.text,
        proposalTitle: proposalContent.title,
        proposalTopics: proposalContent.topics,
        proposalAuthor: proposalContent.author,
        proposalType: proposalContent.type,
        images: proposalContent.images,
      });

      console.log("[DAO Co-Pilot] Sending analysis request to API...");
      const walletClient = getViemWalletClient();
      console.log("[DAO Co-Pilot] Viem wallet client created");
      
      const fetchWithPayment = wrapFetchWithPayment(
        fetch,
        walletClient as any, // Pass wallet client directly - x402-fetch should handle it
        BigInt(60000) // 60 second timeout
      );

      console.log("[DAO Co-Pilot] Making X402-enabled request...");
      const response = await fetchWithPayment("http://localhost:4000/api/analyze-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("[DAO Co-Pilot] Analysis received successfully!");
      setAnalysis(data.analysis);
    } catch (err) {
      console.error("[DAO Co-Pilot] Analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze proposal");
    } finally {
      setIsLoading(false);
    }
  };

  const extractProposalContent = (): ProposalContent => {
    let title = "";
    const titleElement = document.querySelector("h1");
    if (titleElement) {
      title = titleElement.textContent?.trim() || "";
    }

    const texts: string[] = [];
    let proposalBody = 
      document.querySelector('[class*="proposalDescription"]') ||
      document.querySelector('[class*="proposal_description"]') ||
      document.querySelector('[class*="markdown"]') ||
      document.querySelector('[id*="summary"]') || 
      document.querySelector('[class*="Summary"]') ||
      document.querySelector('[class*="proposal-body"]') ||
      document.querySelector('[class*="ProposalBody"]');

    if (!proposalBody) {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        const contentBlocks = Array.from(mainElement.querySelectorAll('div'));
        proposalBody = contentBlocks.find(block => {
          const text = block.textContent || "";
          return text.length > 200;
        }) || mainElement;
      }
    }

    if (!proposalBody) {
      proposalBody = document.body;
    }

    const textElements = proposalBody.querySelectorAll("p, h2, h3, h4, h5, h6, li");
    const seenTexts = new Set<string>();
    
    textElements.forEach((el) => {
      const text = el.textContent?.trim();
      if (!text || text.length < 20 || seenTexts.has(text)) return;
      const isFromOurPanel = el.closest('[id="dao-ai-panel"]') || el.closest('[class*="dao-copilot"]');
      if (isFromOurPanel) return;
      
      seenTexts.add(text);
      texts.push(text);
    });

    const fullText = texts.join("\n\n").substring(0, 8000);

    const images: string[] = [];
    const imgElements = proposalBody.querySelectorAll("img");
    imgElements.forEach((img) => {
      const src = img.src;
      if (src && !src.includes("emoji") && !src.includes("icon")) {
        images.push(src);
      }
    });

    const topics: string[] = [];
    const topicElements = document.querySelectorAll('[class*="tag"], [class*="label"], [class*="badge"]');
    topicElements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length < 30) topics.push(text);
    });

    let author = "";
    const authorElement = document.querySelector('[class*="author"]');
    if (authorElement) {
      author = authorElement.textContent?.trim() || "";
    }

    let type = "Standard";
    const typeElement = document.querySelector('[class*="type"]');
    if (typeElement) {
      type = typeElement.textContent?.trim() || "Standard";
    }

    return {
      text: fullText,
      images: images.slice(0, 5),
      title,
      topics: topics.slice(0, 10),
      author,
      type,
    };
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "YES": return "#10b981";
      case "NO": return "#ef4444";
      case "ABSTAIN": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  return (
    <div className="dao-copilot-panel">
      <div className="dao-copilot-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="dao-copilot-title">
          <span className="dao-copilot-icon">🤖</span>
          <span className="dao-copilot-text">DAO Governance Co-Pilot</span>
          <span className="dao-copilot-badge">AI-Powered</span>
        </div>
        <button className="dao-copilot-toggle">
          {isExpanded ? "▼" : "▲"}
        </button>
      </div>

      {isExpanded && (
        <div className="dao-copilot-content">
          <p className="dao-copilot-description">
            Get AI-powered analysis for this {daoId.toUpperCase()} proposal
          </p>

          {!walletAddress ? (
            <button
              onClick={connectWallet}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Connect Wallet
            </button>
          ) : (
            <>
              <div style={{
                padding: '8px 12px',
                background: '#10b981',
                color: 'white',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '12px',
              }}>
                ✅ Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
              {!analysis && !isLoading && (
                <button
                  className="dao-copilot-analyze-btn"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                >
                  🔍 Ask AI About This Proposal
                </button>
              )}
            </>
          )}

          {isLoading && (
            <div className="dao-copilot-loading">
              <div className="dao-copilot-spinner"></div>
              <p>Analyzing proposal with AI...</p>
            </div>
          )}

          {error && (
            <div className="dao-copilot-error">
              <p>⚠️ {error}</p>
              <button className="dao-copilot-retry-btn" onClick={handleAnalyze}>
                Try Again
              </button>
            </div>
          )}

          {analysis && (
            <div className="dao-copilot-analysis">
              <div className="dao-copilot-recommendation">
                <div
                  className="dao-copilot-recommendation-badge"
                  style={{ backgroundColor: getRecommendationColor(analysis.recommendation) }}
                >
                  {analysis.recommendation}
                </div>
                <div className="dao-copilot-confidence">
                  Confidence: {analysis.confidence}%
                </div>
              </div>

              <div className="dao-copilot-section">
                <h4>📋 Summary</h4>
                <p>{analysis.summary}</p>
              </div>

              <div className="dao-copilot-section">
                <h4>✅ Benefits</h4>
                <ul>
                  {analysis.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <div className="dao-copilot-section">
                <h4>⚠️ Risks</h4>
                <ul>
                  {analysis.risks.map((risk, idx) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              </div>

              <div className="dao-copilot-section">
                <h4>💡 AI Reasoning</h4>
                <p>{analysis.reasoning}</p>
              </div>
            </div>
          )}

          <div className="dao-copilot-footer">
            <small>Proposal: {proposalId.substring(0, 8)}...</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
