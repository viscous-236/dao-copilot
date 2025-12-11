import React, { useState } from "react";
import "./App.css";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { wrapFetchWithPayment } from 'x402-fetch';
import { createSigner } from 'x402-fetch';

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

  // Wagmi hooks
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleAnalyze = async () => {
    if (!isConnected || !connector) {
      setError("Please connect your wallet first");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Extract proposal content (text + images)
      const proposalContent = extractProposalContent();
      setExtractedImages(proposalContent.images);

      console.log("[DAO Co-Pilot] Extracted content:", {
        textLength: proposalContent.text.length,
        imageCount: proposalContent.images.length,
        title: proposalContent.title,
        topics: proposalContent.topics,
        author: proposalContent.author,
        type: proposalContent.type
      });

      // Get wallet client from connector
      const walletClient = await (connector as any).getWalletClient();

      // Create X402 signer from wallet client
      const signer = createSigner(walletClient);

      // Wrap fetch with X402 payment handling
      const fetchWithPayment = wrapFetchWithPayment(
        fetch,
        signer,
        BigInt(10000), // 0.01 USDC max
      );

      // Call the AI agent API with X402 payment
      const response = await fetchWithPayment("http://localhost:4000/api/analyze-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          daoId,
          proposalId,
          proposalText: proposalContent.text,
          proposalTitle: proposalContent.title,
          proposalTopics: proposalContent.topics,
          proposalAuthor: proposalContent.author,
          proposalType: proposalContent.type,
          images: proposalContent.images,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error("[DAO Co-Pilot] Analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze proposal");
    } finally {
      setIsLoading(false);
    }
  };

  const extractProposalContent = (): ProposalContent => {
    // Extract title
    let title = "";
    const titleElement = document.querySelector("h1");
    
    if (titleElement) {
      title = titleElement.textContent?.trim() || "";
    }

    // Extract main proposal text - Target the specific proposal description container
    const texts: string[] = [];
    
    // For Uniswap/Tally: Find the proposal description markdown container
    let proposalBody = 
      document.querySelector('[class*="proposalDescription"]') ||
      document.querySelector('[class*="proposal_description"]') ||
      document.querySelector('[class*="markdown"]') ||
      document.querySelector('[id*="summary"]') || 
      document.querySelector('[class*="Summary"]') ||
      document.querySelector('[class*="proposal-body"]') ||
      document.querySelector('[class*="ProposalBody"]');
    
    console.log("[DAO Co-Pilot] Found proposal body container:", proposalBody?.className);


    if (!proposalBody) {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        const contentBlocks = Array.from(mainElement.querySelectorAll('div'));
        proposalBody = contentBlocks.find(block => {
          const rect = block.getBoundingClientRect();
          const text = block.textContent || "";
          return text.length > 200 && rect.left < window.innerWidth * 0.7;
        }) || mainElement;
      }
    }

    if (!proposalBody) {
      proposalBody = document.body;
    }

    const textElements = proposalBody.querySelectorAll("p, h2, h3, h4, h5, h6, li");
    
    const seenTexts = new Set<string>(); // Prevent duplicates
    
    textElements.forEach((el) => {
      const text = el.textContent?.trim();
      
      // Skip if already added or too short
      if (!text || text.length < 20 || seenTexts.has(text)) {
        return;
      }
      
      const excludePatterns = [
        /^\d+,\d+/,  // Numbers like "5,253,360"
        /\.eth$/i,     // ENS names ending in .eth
        /\.eth\d/i,    // ENS names with numbers
        /Connect wallet/i,
        /^Vote$/i,
        /^FOR -/i,
        /^AGAINST -/i,
        /Quorum/i,
        /EXECUTED/i,
        /View contract/i,
        /Expand all actions/i,
        /attest\(/,   // Contract signatures
        /tuple\(/,
        /bytes/,
        /Simulate transactions/i,
        /Proposal Visualization/i,
        /Timeline|Map|Bubble/i
      ];
      
      // Additional checks
      const isShortUIText = (text.includes("Actions") || text.includes("Summary") || text.includes("Raw")) && text.length < 30;
      
      const shouldExclude = excludePatterns.some(pattern => 
        text && pattern.test(text)
      ) || isShortUIText;
      
      // Also check if element is in sidebar (voting activity area) or action sections
      const inSidebar = el.closest('[class*="voting"]') || 
                       el.closest('[class*="Voting"]') ||
                       el.closest('aside') ||
                       el.closest('[class*="sidebar"]') ||
                       el.closest('[class*="Actions"]') ||
                       el.closest('[class*="action"]');
      
      if (text && 
          !shouldExclude &&
          !inSidebar &&
          !el.closest('nav') && 
          !el.closest('header') &&
          !el.closest('footer') &&
          !el.closest('button')) {
        texts.push(text);
        seenTexts.add(text);
      }
    });

    // Extract images from proposal body only
    const images: string[] = [];
    const imgElements = proposalBody.querySelectorAll("img");
    
    imgElements.forEach((img) => {
      const src = img.src;
      const alt = img.alt || "";
      
      // Filter out icons, logos, avatars, and tiny images
      if (src && 
          !src.includes("icon") && 
          !src.includes("logo") &&
          !src.includes("avatar") &&
          img.width > 100 && 
          img.height > 100) {
        
        images.push(src);
        
        // Add alt text to proposal text if meaningful
        if (alt && alt.length > 10) {
          texts.push(`[Image: ${alt}]`);
        }
      }
    });

    // Also check for background images in divs within proposal body
    const divsWithBg = proposalBody.querySelectorAll("div[style*='background-image']");
    divsWithBg.forEach((div) => {
      const style = (div as HTMLElement).style.backgroundImage;
      const urlMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (urlMatch && urlMatch[1]) {
        images.push(urlMatch[1]);
      }
    });

    const text = texts.join("\n\n").substring(0, 8000); // Increased limit to 8000 chars

    // Extract topics/tags - Look for h2 headings as they often contain proposal topics
    const topics: string[] = [];
    
    // First, try to get the main topic from h2 heading (like "Unichain Co-Incentives Growth Management Plan")
    const h2Elements = document.querySelectorAll('h2');
    h2Elements.forEach((h2) => {
      const topicText = h2.textContent?.trim();
      const isFromOurPanel = h2.closest('[id="dao-ai-panel"]') || h2.closest('[class*="dao-copilot"]');
      
      if (topicText && 
          !isFromOurPanel &&
          topicText.length > 10 && 
          topicText.length < 150 &&
          !topicText.includes("Background") &&
          !topicText.includes("Summary") &&
          !topicText.includes("Motivation")) {
        topics.push(topicText);
      }
    });
    
    const topicElements = document.querySelectorAll('[class*="tag"], [class*="badge"], [class*="category"], [class*="label"]');
    topicElements.forEach((el) => {
      const topicText = el.textContent?.trim();
      
      const isFromOurPanel = el.closest('[id="dao-ai-panel"]') || el.closest('[class*="dao-copilot"]');
      
      if (topicText && 
          !isFromOurPanel &&
          topicText.length > 2 && 
          topicText.length < 50 && 
          !topicText.includes("FOR") && 
          !topicText.includes("AGAINST") &&
          !topicText.includes("AI-POWERED") &&
          !topicText.includes("AI") &&
          !topicText.includes("YES") &&
          !topicText.includes("NO") &&
          !topicText.includes("ABSTAIN") &&
          !topicText.includes("Powered")) {
        topics.push(topicText);
      }
    });

    // Extract author/proposer
    let author = "";
    const authorElement = document.querySelector('[class*="author"]') ||
                         document.querySelector('[class*="proposer"]') ||
                         document.querySelector('[href*="uf.eek.eth"]');
    if (authorElement) {
      author = authorElement.textContent?.trim() || "";
      // Clean up author text
      author = author.replace(/^by\s+/i, "").replace(/\s+/g, " ").trim();
    }

    // Extract proposal type (Standard, Temperature Check, etc.)
    let type = "";
    const typeElement = document.querySelector('[class*="Proposal"]') ||
                       document.querySelector('[class*="type"]');
    if (typeElement) {
      const typeText = typeElement.textContent?.trim() || "";
      if (typeText.includes("Standard")) type = "Standard Proposal";
      else if (typeText.includes("Temperature")) type = "Temperature Check";
      else if (typeText.includes("Consensus")) type = "Consensus Check";
      else if (typeText.length < 50) type = typeText;
    }

    console.log("[DAO Co-Pilot] Extracted text content:", text.substring(0, 200) + "...");

    console.log("[DAO Co-Pilot] Extracted:", {
      title,
      textLength: text.length,
      imageCount: images.length,
      topics: topics.slice(0, 5),
      author,
      type,
      images: images.slice(0, 3) // Log first 3 image URLs
    });

    return {
      text,
      images,
      title: title || `Proposal ${proposalId}`,
      topics: Array.from(new Set(topics)), // Remove duplicates
      author: author || "Unknown",
      type: type || "Standard Proposal"
    };
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "YES":
        return "#22c55e";
      case "NO":
        return "#ef4444";
      case "ABSTAIN":
        return "#f59e0b";
      default:
        return "#6b7280";
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

          {!isConnected ? (
            <div style={{ marginBottom: '12px' }}>
              {connectors.map((conn) => (
                <button
                  key={conn.id}
                  onClick={() => connect({ connector: conn })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Connect {conn.name}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div style={{
                padding: '8px 12px',
                background: '#10b981',
                color: 'white',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>✅ Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <button
                  onClick={() => disconnect()}
                  style={{
                    background: 'transparent',
                    border: '1px solid white',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Disconnect
                </button>
              </div>
              {!analysis && !isLoading && (
                <button
                  className="dao-copilot-analyze-btn"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                >
                  🔍 Ask AI About This Proposal ($0.001 USDC)
                </button>
              )}
            </>
          )}

          {isLoading && (
            <div className="dao-copilot-loading">
              <div className="dao-copilot-spinner"></div>
              <p>Analyzing proposal with AI...</p>
              <small>Extracting text and images from proposal...</small>
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

          {extractedImages.length > 0 && (
            <div className="dao-copilot-images-info">
              <small>📸 Extracted {extractedImages.length} image{extractedImages.length !== 1 ? 's' : ''} from proposal</small>
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

              <div className="dao-copilot-actions">
                <button className="dao-copilot-vote-btn dao-copilot-vote-yes">
                  Vote YES (Follow AI)
                </button>
                <button className="dao-copilot-vote-btn dao-copilot-vote-no">
                  Vote NO (Follow AI)
                </button>
                <button className="dao-copilot-reanalyze-btn" onClick={handleAnalyze}>
                  🔄 Re-analyze
                </button>
              </div>
            </div>
          )}

          <div className="dao-copilot-footer">
            <small>
              Powered by X402 Micropayments • Proposal: {proposalId.substring(0, 8)}...
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
