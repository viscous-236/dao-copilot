import React, { useState } from "react";
import "./App.css";

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

const App: React.FC<AppProps> = ({ proposalId, daoId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the proposal text from the page
      const proposalText = extractProposalText();

      // Call the AI agent API
      const response = await fetch("http://localhost:4000/api/analyze-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          daoId,
          proposalId,
          proposalText,
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

  const extractProposalText = (): string => {
    // Try to extract proposal text from the page
    // This is a basic implementation - adjust selectors based on actual page structure
    const textElements = document.querySelectorAll("p, h1, h2, h3, li");
    const texts: string[] = [];
    
    textElements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length > 20) {
        texts.push(text);
      }
    });

    return texts.join("\n").substring(0, 5000); // Limit to 5000 chars
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

          {!analysis && !isLoading && (
            <button
              className="dao-copilot-analyze-btn"
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              🔍 Ask AI About This Proposal
            </button>
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
