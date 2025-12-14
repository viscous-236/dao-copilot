import React, { useState } from "react";
import "./App.css";
import { wrapFetchWithPayment, createSigner } from 'x402-fetch';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { baseSepolia } from 'viem/chains';
import type { Account } from 'viem';

interface AppProps {
  proposalId: string;
  daoId: string;
  isDraft?: boolean;
}

interface EvidencedPoint {
  text: string;
  evidence: string;
  severity?: 'High' | 'Medium' | 'Low';
}

interface ReasoningStep {
  step: number;
  category: 'governance' | 'treasury' | 'kpi' | 'risk' | 'similarity';
  finding: string;
  impact: 'positive' | 'negative' | 'neutral';
}

interface BudgetItem {
  category: string;
  amount: string;
  justification?: string;
}

interface BudgetJustification {
  breakdown: BudgetItem[];
  totalAmount: string;
  flags: string[];
}

interface DelegateReaction {
  delegateType: string;
  expectedVote: 'YES' | 'NO' | 'ABSTAIN';
  reasoning: string;
}

interface AnalysisResult {
  summary: string;
  benefits: EvidencedPoint[];
  risks: EvidencedPoint[];
  recommendation: "YES" | "NO" | "ABSTAIN";
  confidence: number;
  reasoning: string;
  similarProposals?: string[];
  missingFields?: string[];
  requiredClarifications?: string[];
  confidenceBreakdown?: {
    rulesCoverage: number;
    retrievalSupport: number;
    baseConfidence: number;
  };
  reasoningChain?: ReasoningStep[];
  conditionalPath?: string;
  budgetJustification?: BudgetJustification;
  delegateReactions?: DelegateReaction[];
  probabilityOfPassing?: number;
}

interface ProposalContent {
  text: string;
  images: string[];
  title: string;
  topics: string[];
  author: string;
  type: string;
}

const App: React.FC<AppProps> = ({ proposalId, daoId, isDraft = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

    // For draft proposals, check if form has content
    if (isDraft) {
      const titleInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      
      console.log('[DAO Co-Pilot] Draft validation - Title:', titleInput?.value, 'Body:', textarea?.value?.substring(0, 50));
      
      if (!titleInput?.value?.trim() || !textarea?.value?.trim()) {
        setError("Please fill in the proposal title and description before analyzing");
        return;
      }
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
      
      const proposalContent = isDraft ? extractDraftContent() : extractProposalContent();
      setExtractedImages(proposalContent.images);

      console.log(`[DAO Co-Pilot] Extracted ${isDraft ? 'draft' : 'proposal'} content:`, {
        textLength: proposalContent.text.length,
        imageCount: proposalContent.images.length,
        title: proposalContent.title,
      });

      console.log("Extracted content text preview:", proposalContent.text);

      const requestBody = JSON.stringify({
        daoId,
        proposalId,
        proposalText: proposalContent.text,
        proposalTitle: proposalContent.title,
        proposalTopics: proposalContent.topics,
        proposalAuthor: proposalContent.author,
        proposalType: proposalContent.type,
        images: proposalContent.images,
        isDraft: isDraft,
      });

      console.log("[DAO Co-Pilot] Sending analysis request to API...");
      const walletClient = getViemWalletClient();
      console.log("[DAO Co-Pilot] Viem wallet client created");
      
      const fetchWithPayment = wrapFetchWithPayment(
        // Use background fetch to bypass ad blockers
        async (url: string | URL | Request, init?: RequestInit) => {
          console.log("[DAO Co-Pilot] Using background fetch to bypass ad blockers");
          return new Promise<Response>((resolve, reject) => {
            const urlString = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
            
            chrome.runtime.sendMessage(
              {
                type: 'BACKGROUND_FETCH',
                data: {
                  url: urlString,
                  method: init?.method || 'GET',
                  headers: init?.headers || {},
                  body: init?.body
                }
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                  return;
                }
                
                if (response.error) {
                  reject(new Error(response.error));
                  return;
                }
                
                // Create a Response object from the background fetch result
                const responseObj = new Response(
                  JSON.stringify(response.data),
                  {
                    status: response.status,
                    statusText: response.statusText,
                    headers: new Headers(response.headers)
                  }
                );
                
                resolve(responseObj);
              }
            );
          });
        },
        walletClient as any,
        BigInt(60000)
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

  const extractDraftContent = (): ProposalContent => {
    // Extract content from Snapshot create form - use more generic selectors
    let title = "";
    
    // Try multiple selectors for title input
    const titleInput = 
      document.querySelector('input[type="text"]') as HTMLInputElement ||
      document.querySelector('input[placeholder*="Title"]') as HTMLInputElement ||
      document.querySelector('input[placeholder*="title"]') as HTMLInputElement;
    
    if (titleInput) {
      title = titleInput.value.trim();
    }

    // Extract proposal body from textarea
    let proposalText = "";
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      proposalText = textarea.value.trim();
    }

    // Extract discussion link if any
    const discussionInputs = document.querySelectorAll('input[type="text"]');
    let discussionLink = "";
    discussionInputs.forEach((input) => {
      const htmlInput = input as HTMLInputElement;
      const placeholder = htmlInput.placeholder?.toLowerCase() || "";
      if (placeholder.includes('forum') || placeholder.includes('discussion')) {
        discussionLink = htmlInput.value.trim();
      }
    });

    const fullText = discussionLink 
      ? `${proposalText}\n\nDiscussion: ${discussionLink}`.trim()
      : proposalText;

    console.log('[DAO Co-Pilot] Extracted draft content:', { 
      titleLength: title.length, 
      textLength: fullText.length 
    });

    return {
      text: fullText.substring(0, 8000),
      images: [],
      title: title || "Untitled Draft",
      topics: [],
      author: walletAddress || "Unknown",
      type: "Draft Proposal",
    };
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
    <div className={`dao-copilot-panel${!isExpanded ? ' minimized' : ''}`}>
      <div className="dao-copilot-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="dao-copilot-title">
          <span className="dao-copilot-icon">🤖</span>
          <span className="dao-copilot-text">DORA-AI</span>
          <span className="dao-copilot-badge">AI-Powered</span>
        </div>
        <button className="dao-copilot-toggle">
          {isExpanded ? "▼" : "▲"}
        </button>
      </div>

      {isExpanded && (
        <div className="dao-copilot-content">
          <p className="dao-copilot-description">
            {isDraft 
              ? `📝 Get AI-powered analysis for your draft ${daoId.toUpperCase()} proposal`
              : `Get AI-powered analysis for this ${daoId.toUpperCase()} proposal`
            }
          </p>

          {!walletAddress ? (
            <button
              onClick={connectWallet}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '12px',
                background: '#000000',
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
                background: '#000000',
                color: 'white',
                border: '1px solid #ffffff',
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
                  {isDraft ? '📝 Analyze My Draft' : '🔍 Ask AI About This Proposal'}
                </button>
              )}
            </>
          )}

          {isLoading && (
            <div className="dao-copilot-loading">
              <div className="dao-copilot-spinner"></div>
              <p>{isDraft ? 'Analyzing your draft with AI...' : 'Analyzing proposal with AI...'}</p>
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
                  {analysis.confidenceBreakdown && (
                    <div style={{ fontSize: '11px', marginTop: '4px', color: '#6b7280' }}>
                      Rules: {analysis.confidenceBreakdown.rulesCoverage}% | 
                      Retrieval: {analysis.confidenceBreakdown.retrievalSupport}% | 
                      Base: {analysis.confidenceBreakdown.baseConfidence}%
                    </div>
                  )}
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
                    <li key={idx}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>{benefit.text}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginLeft: '12px' }}>
                        📝 "{benefit.evidence}"
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {analysis.missingFields && analysis.missingFields.length > 0 && (
                <div className="dao-copilot-section" style={{ background: '#fee2e2', borderLeft: '4px solid #ef4444', padding: '12px' }}>
                  <h4 style={{ color: '#991b1b', margin: '0 0 8px 0' }}>🔴 Missing Governance Fields</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {analysis.missingFields.map((field, idx) => (
                      <li key={idx} style={{ color: '#991b1b', fontSize: '13px' }}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="dao-copilot-section">
                <h4>⚠️ Risks</h4>
                <ul>
                  {analysis.risks.map((risk, idx) => {
                    const severityColor = 
                      risk.severity === 'High' ? '#ef4444' :
                      risk.severity === 'Medium' ? '#f59e0b' :
                      '#10b981';
                    const severityBg = 
                      risk.severity === 'High' ? '#fee2e2' :
                      risk.severity === 'Medium' ? '#fef3c7' :
                      '#d1fae5';
                    return (
                      <li key={idx}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          {risk.severity && (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              color: severityColor,
                              background: severityBg,
                              border: `1px solid ${severityColor}`
                            }}>
                              {risk.severity.toUpperCase()}
                            </span>
                          )}
                          <strong>{risk.text}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginLeft: '12px' }}>
                          📝 "{risk.evidence}"
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {analysis.requiredClarifications && analysis.requiredClarifications.length > 0 && (
                <div className="dao-copilot-section" style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                  <h4 style={{ color: '#92400e' }}>📝 Required Clarifications</h4>
                  <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    {analysis.requiredClarifications.map((q, idx) => (
                      <li key={idx} style={{ color: '#92400e', fontSize: '13px', marginBottom: '8px' }}>{q}</li>
                    ))}
                  </ol>
                </div>
              )}

              {analysis.reasoningChain && analysis.reasoningChain.length > 0 && (
                <div className="dao-copilot-section">
                  <details>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                      🧠 Reasoning Chain ({analysis.reasoningChain.length} steps)
                    </summary>
                    <ol style={{ paddingLeft: '20px' }}>
                      {analysis.reasoningChain.map((step) => {
                        const impactColor = 
                          step.impact === 'positive' ? '#10b981' :
                          step.impact === 'negative' ? '#ef4444' :
                          '#6b7280';
                        const icon = 
                          step.impact === 'positive' ? '✅' :
                          step.impact === 'negative' ? '⚠️' : 'ℹ️';
                        return (
                          <li key={step.step} style={{
                            marginBottom: '8px',
                            paddingLeft: '8px',
                            borderLeft: `3px solid ${impactColor}`,
                            fontSize: '13px'
                          }}>
                            <strong style={{ textTransform: 'uppercase', fontSize: '11px', color: '#6b7280' }}>
                              [{step.category}]
                            </strong> {icon} {step.finding}
                          </li>
                        );
                      })}
                    </ol>
                  </details>
                </div>
              )}

              {analysis.conditionalPath && (
                <div className="dao-copilot-section" style={{ background: '#dbeafe', borderLeft: '4px solid #3b82f6' }}>
                  <h4 style={{ color: '#1e40af', margin: '0 0 8px 0' }}>🔄 Conditional Path</h4>
                  <p style={{ color: '#1e40af', fontSize: '13px', margin: 0 }}>{analysis.conditionalPath}</p>
                </div>
              )}

              {analysis.budgetJustification && (
                <div className="dao-copilot-section" style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                  <h4 style={{ color: '#92400e', margin: '0 0 8px 0' }}>💰 Budget Justification</h4>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#92400e' }}>Total: {analysis.budgetJustification.totalAmount}</strong>
                  </div>
                  {analysis.budgetJustification.breakdown.length > 0 && (
                    <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '13px' }}>
                      {analysis.budgetJustification.breakdown.map((item, idx) => (
                        <li key={idx} style={{ color: '#92400e', marginBottom: '4px' }}>
                          <strong>{item.category}:</strong> {item.amount}
                        </li>
                      ))}
                    </ul>
                  )}
                  {analysis.budgetJustification.flags.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', background: '#fee2e2', borderRadius: '4px' }}>
                      {analysis.budgetJustification.flags.map((flag, idx) => (
                        <div key={idx} style={{ color: '#991b1b', fontSize: '12px', fontWeight: 'bold' }}>
                          🚩 {flag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {analysis.delegateReactions && analysis.delegateReactions.length > 0 && (
                <div className="dao-copilot-section">
                  <h4>🗳️ Expected Delegate Reactions</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analysis.delegateReactions.map((reaction, idx) => {
                      const voteColor = 
                        reaction.expectedVote === 'YES' ? '#10b981' :
                        reaction.expectedVote === 'NO' ? '#ef4444' : '#f59e0b';
                      return (
                        <div key={idx} style={{ 
                          padding: '10px', 
                          background: '#f9fafb', 
                          borderRadius: '6px',
                          borderLeft: `4px solid ${voteColor}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13px' }}>{reaction.delegateType}</strong>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px', 
                              fontWeight: 'bold',
                              color: 'white',
                              background: voteColor
                            }}>
                              {reaction.expectedVote}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                            {reaction.reasoning}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {analysis.probabilityOfPassing !== undefined && (
                <div className="dao-copilot-section" style={{ 
                  background: analysis.probabilityOfPassing >= 60 ? '#d1fae5' : analysis.probabilityOfPassing >= 40 ? '#fef3c7' : '#fee2e2',
                  borderLeft: `4px solid ${analysis.probabilityOfPassing >= 60 ? '#10b981' : analysis.probabilityOfPassing >= 40 ? '#f59e0b' : '#ef4444'}`,
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>📊 Estimated Probability of Passing</h4>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold',
                    color: analysis.probabilityOfPassing >= 60 ? '#059669' : analysis.probabilityOfPassing >= 40 ? '#d97706' : '#dc2626'
                  }}>
                    {analysis.probabilityOfPassing}%
                  </div>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '8px 0 0 0' }}>
                    Based on: historical success, budget size, delegate alignment, governance completeness
                  </p>
                </div>
              )}

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
