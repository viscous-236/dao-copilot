"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callLLMForProposalAnalysis = callLLMForProposalAnalysis;
const local_client_1 = require("../rag/local-client");
/**
 * UPGRADE 1: Advanced pattern detection for risk classification
 */
const RISK_PATTERNS = {
    treasury: {
        keywords: ['budget', 'million', 'incentive', 'unlock', 'funding', 'treasury', 'disburse', 'grant', 'allocate', 'payment'],
        regex: /\$\s*\d+\.?\d*\s*([MmKk]|million|thousand)/,
        severity: 'High'
    },
    counterparty: {
        keywords: ['Sky', 'Spark', 'external', 'partner', 'third-party', 'vendor', 'service provider', 'contractor'],
        regex: /\b(partner|vendor|contractor|third-party)\b/i,
        severity: 'Medium'
    },
    custody: {
        keywords: ['custody', 'escrow', 'timelock', 'UAC', 'disbursement', 'multisig', 'wallet', 'control'],
        regex: /\b(escrow|timelock|multisig|custody)\b/i,
        severity: 'High'
    },
    verification: {
        keywords: ['verify', 'audit', 'proof', 'oracle', 'measurement', 'validation', 'attestation'],
        regex: /\b(audit|verify|oracle|proof)\b/i,
        severity: 'Medium'
    },
    technical: {
        keywords: ['upgrade', 'contract', 'deploy', 'implementation', 'protocol change', 'smart contract'],
        regex: /\b(upgrade|deploy|contract)\b/i,
        severity: 'Medium'
    },
    operational: {
        keywords: ['manage', 'operate', 'maintain', 'coordinate', 'oversee'],
        regex: /\b(manage|operate|maintain)\b/i,
        severity: 'Low'
    }
};
/**
 * Extract amount from treasury-related text
 */
function extractTreasuryAmount(text) {
    const match = text.match(/\$\s*(\d+\.?\d*)\s*([MmKk]|million|thousand)/);
    if (match) {
        return `$${match[1]}${match[2].toUpperCase().charAt(0)}`;
    }
    return null;
}
/**
 * Detect risk patterns with improved accuracy
 */
function detectRiskPattern(proposalText, patternType) {
    const pattern = RISK_PATTERNS[patternType];
    const textLower = proposalText.toLowerCase();
    if (pattern.regex && pattern.regex.test(proposalText)) {
        return true;
    }
    return pattern.keywords.some(keyword => textLower.includes(keyword.toLowerCase()));
}
/**
 * Get severity for a risk type
 */
function getRiskSeverity(riskType) {
    return RISK_PATTERNS[riskType].severity;
}
/**
 * Extract evidence sentences from proposal text for a given keyword/pattern
 */
function extractEvidence(proposalText, keywords) {
    const sentences = proposalText.split(/[.!?]\s+/);
    for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();
        if (keywords.some(keyword => lowerSentence.includes(keyword.toLowerCase()))) {
            return sentence.trim().substring(0, 150) + (sentence.length > 150 ? '...' : '');
        }
    }
    return proposalText.substring(0, 100) + '...';
}
/**
 * Run governance checklist on proposal text
 */
function runGovernanceChecklist(proposalText) {
    const textLower = proposalText.toLowerCase();
    return {
        hasEscrow: textLower.includes('escrow') || textLower.includes('timelock') || textLower.includes('multisig'),
        hasVerification: textLower.includes('on-chain proof') || textLower.includes('verify') || textLower.includes('oracle'),
        hasKPITiming: textLower.includes('quarter') || textLower.includes('monthly') || textLower.includes('30-day') || /\d+\s*months?/.test(textLower),
        hasAudit: textLower.includes('audit') || textLower.includes('security review'),
        hasBudget: /\$\d+/.test(proposalText) || textLower.includes('budget'),
        hasTimeline: textLower.includes('timeline') || textLower.includes('schedule') || textLower.includes('phases')
    };
}
/**
 * Generate clarifying questions based on missing checklist items
 */
function generateClarifications(checklist) {
    const clarifications = [];
    if (!checklist.hasEscrow) {
        clarifications.push('Where will funds be held? Recommend using an escrow contract or timelocked multisig controlled by the DAO.');
    }
    if (!checklist.hasVerification) {
        clarifications.push('How will KPIs be verified on-chain? Specify the proof format and independent verifier (oracle, Chainlink, or auditor multisig).');
    }
    if (!checklist.hasKPITiming) {
        clarifications.push('What are the exact measurement windows and data sources for KPIs? Define when and how metrics will be sampled.');
    }
    if (!checklist.hasAudit) {
        clarifications.push('Have external contracts/partners been audited? Provide audit reports or attestations for third-party components.');
    }
    if (checklist.hasBudget && !checklist.hasTimeline) {
        clarifications.push('What is the spending timeline and reporting cadence? Include milestones and how the DAO can pause/discontinue if needed.');
    }
    return clarifications;
}
/**
 * Calculate composite confidence score
 */
function calculateConfidence(checklist, avgSimilarity, baseConfidence) {
    const checklistValues = Object.values(checklist);
    const rulesCoverage = checklistValues.filter(v => v).length / checklistValues.length;
    const retrievalSupport = avgSimilarity;
    const score = Math.round(50 * rulesCoverage +
        30 * retrievalSupport +
        20 * (baseConfidence / 100));
    return {
        score: Math.min(95, Math.max(30, score)),
        breakdown: {
            rulesCoverage: Math.round(rulesCoverage * 100),
            retrievalSupport: Math.round(retrievalSupport * 100),
            baseConfidence: Math.round(baseConfidence)
        }
    };
}
/**
 * UPGRADE 3: Build transparent reasoning chain
 */
function buildReasoningChain(checklist, risks, benefits, treasuryAmount, similarCount) {
    const chain = [];
    let stepNum = 1;
    const missingCount = Object.values(checklist).filter(v => !v).length;
    if (missingCount > 0) {
        chain.push({
            step: stepNum++,
            category: 'governance',
            finding: `Governance check ${missingCount === 0 ? 'passed' : 'failed'} → Missing ${missingCount} of 6 required fields`,
            impact: missingCount > 2 ? 'negative' : missingCount > 0 ? 'neutral' : 'positive'
        });
    }
    const highRisks = risks.filter(r => r.severity === 'High');
    if (highRisks.length > 0 && treasuryAmount) {
        chain.push({
            step: stepNum++,
            category: 'treasury',
            finding: `High treasury impact → ${treasuryAmount} ${highRisks.length > 1 ? 'with multiple risk factors' : 'requested'}`,
            impact: 'negative'
        });
    }
    const hasStrongKPIs = benefits.some(b => b.text.toLowerCase().includes('measurable') || b.text.toLowerCase().includes('performance'));
    if (hasStrongKPIs) {
        chain.push({
            step: stepNum++,
            category: 'kpi',
            finding: 'Strong KPIs → measurable, performance-based metrics defined',
            impact: 'positive'
        });
    }
    const mediumRisks = risks.filter(r => r.severity === 'Medium');
    if (highRisks.length > 0 || mediumRisks.length > 1) {
        chain.push({
            step: stepNum++,
            category: 'risk',
            finding: `Risk factors: ${highRisks.length} High, ${mediumRisks.length} Medium → ${highRisks.map(r => r.text.split(':')[0]).join(', ')}`,
            impact: 'negative'
        });
    }
    if (similarCount > 0) {
        chain.push({
            step: stepNum++,
            category: 'similarity',
            finding: `Historical precedent → ${similarCount} similar proposal${similarCount > 1 ? 's' : ''} found in governance history`,
            impact: 'positive'
        });
    }
    return chain;
}
/**
 * UPGRADE 5: Formalized conditional logic for recommendations
 */
function determineRecommendation(checklist, risks, benefits, passedSimilar, failedSimilar) {
    const missingCritical = !checklist.hasEscrow || !checklist.hasVerification;
    const highRisks = risks.filter(r => r.severity === 'High').length;
    const hasBudget = checklist.hasBudget;
    if (missingCritical && hasBudget && highRisks >= 2) {
        return {
            recommendation: 'NO',
            conditionalPath: 'Would change to ABSTAIN if: escrow mechanism + verification process specified'
        };
    }
    if (missingCritical || Object.values(checklist).filter(v => !v).length >= 2) {
        return {
            recommendation: 'ABSTAIN',
            conditionalPath: 'Would change to YES if: all governance fields addressed (escrow, verification, timeline)'
        };
    }
    if (passedSimilar >= 2 && Object.values(checklist).filter(v => !v).length <= 1) {
        return {
            recommendation: 'YES',
            conditionalPath: benefits.length >= 3 ? 'Strong approval - all governance safeguards present' : 'Approval with monitoring recommended'
        };
    }
    if (benefits.length > risks.length && Object.values(checklist).filter(v => !v).length <= 1) {
        return {
            recommendation: 'YES',
            conditionalPath: 'Approval - benefits outweigh risks with adequate safeguards'
        };
    }
    return {
        recommendation: 'ABSTAIN',
        conditionalPath: 'Would change to YES if: proposer clarifies missing fields and addresses top 2 risks'
    };
}
/**
 * Extract budget breakdown from proposal text
 */
function extractBudgetJustification(proposalText, treasuryAmount) {
    if (!treasuryAmount)
        return undefined;
    const breakdown = [];
    const flags = [];
    const lines = proposalText.split('\n');
    // Common budget patterns
    const budgetKeywords = ['backend', 'frontend', 'infrastructure', 'ops', 'maintenance', 'development', 'design', 'audit', 'security', 'marketing', 'operations'];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        // Look for budget line items
        const amountMatch = line.match(/[\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*([kmb]|thousand|million|billion)?/i);
        if (amountMatch) {
            const keyword = budgetKeywords.find(kw => line.includes(kw));
            if (keyword) {
                const amount = amountMatch[0];
                const category = line.split(':')[0].trim() || keyword.charAt(0).toUpperCase() + keyword.slice(1);
                breakdown.push({
                    category: category.length > 50 ? keyword.charAt(0).toUpperCase() + keyword.slice(1) : category,
                    amount: amount
                });
            }
        }
    }
    // Check for benchmarking
    const hasBenchmark = proposalText.toLowerCase().includes('similar') &&
        proposalText.toLowerCase().includes('grant') ||
        proposalText.toLowerCase().includes('benchmark') ||
        proposalText.toLowerCase().includes('comparable');
    if (!hasBenchmark) {
        flags.push('No benchmark against similar infra grants');
    }
    // If no breakdown found, create a generic one
    if (breakdown.length === 0) {
        breakdown.push({
            category: 'Total requested',
            amount: treasuryAmount
        });
    }
    return {
        breakdown,
        totalAmount: treasuryAmount,
        flags
    };
}
/**
 * Generate delegate reaction predictions
 */
function generateDelegateReactions(recommendation, risks, checklist, treasuryAmount) {
    const reactions = [];
    const highRisks = risks.filter(r => r.severity === 'High').length;
    const missingFields = Object.values(checklist).filter(v => !v).length;
    // Risk-averse delegates
    if (highRisks >= 2 || missingFields >= 3) {
        reactions.push({
            delegateType: 'Risk-averse delegates',
            expectedVote: 'NO',
            reasoning: `${highRisks} High-severity risks and ${missingFields} missing governance safeguards exceed risk tolerance`
        });
    }
    else if (highRisks >= 1 || missingFields >= 2) {
        reactions.push({
            delegateType: 'Risk-averse delegates',
            expectedVote: 'ABSTAIN',
            reasoning: `Some risk factors present; will wait for proposer clarifications before supporting`
        });
    }
    else {
        reactions.push({
            delegateType: 'Risk-averse delegates',
            expectedVote: recommendation === 'NO' ? 'NO' : 'ABSTAIN',
            reasoning: 'Conservative stance; prefer waiting for community consensus'
        });
    }
    // Growth-focused delegates
    const hasGrowthBenefits = risks.some(r => r.text.toLowerCase().includes('expansion') || r.text.toLowerCase().includes('deploy'));
    if (treasuryAmount && missingFields <= 2) {
        reactions.push({
            delegateType: 'Growth-focused delegates',
            expectedVote: missingFields === 0 ? 'YES' : 'ABSTAIN',
            reasoning: missingFields === 0
                ? 'Investment in ecosystem growth with proper safeguards'
                : 'Willing to support if safeguards added (escrow, verification)'
        });
    }
    else {
        reactions.push({
            delegateType: 'Growth-focused delegates',
            expectedVote: 'ABSTAIN',
            reasoning: 'Need clearer growth metrics and risk mitigation before supporting'
        });
    }
    // Security-focused delegates
    const hasAudit = checklist.hasAudit;
    const hasEscrow = checklist.hasEscrow;
    if (!hasAudit && treasuryAmount) {
        reactions.push({
            delegateType: 'Security-focused delegates',
            expectedVote: 'NO',
            reasoning: 'Treasury allocation without security audit is unacceptable; audits must be provided'
        });
    }
    else if (!hasEscrow && treasuryAmount) {
        reactions.push({
            delegateType: 'Security-focused delegates',
            expectedVote: 'NO',
            reasoning: 'Missing escrow/timelock mechanism for fund protection'
        });
    }
    else if (highRisks >= 1) {
        reactions.push({
            delegateType: 'Security-focused delegates',
            expectedVote: 'ABSTAIN',
            reasoning: 'Need additional risk mitigation measures before approval'
        });
    }
    else {
        reactions.push({
            delegateType: 'Security-focused delegates',
            expectedVote: recommendation === 'NO' ? 'NO' : 'YES',
            reasoning: 'Security safeguards appear adequate'
        });
    }
    return reactions;
}
/**
 * Calculate probability of proposal passing
 */
function calculateProbabilityOfPassing(recommendation, passedSimilar, failedSimilar, treasuryAmount, delegateReactions, missingFields) {
    let probability = 50; // Base 50%
    // Factor 1: Historical success rate (30% weight)
    if (passedSimilar + failedSimilar > 0) {
        const historicalRate = passedSimilar / (passedSimilar + failedSimilar);
        probability += (historicalRate - 0.5) * 30;
    }
    // Factor 2: Budget size (-20% weight for large budgets)
    if (treasuryAmount) {
        const amountNum = parseFloat(treasuryAmount.replace(/[^0-9.]/g, ''));
        if (amountNum > 500)
            probability -= 15; // Very large budget
        else if (amountNum > 100)
            probability -= 10; // Large budget
        else if (amountNum < 50)
            probability += 5; // Small budget
    }
    // Factor 3: Delegate alignment (25% weight)
    const yesVotes = delegateReactions.filter(d => d.expectedVote === 'YES').length;
    const noVotes = delegateReactions.filter(d => d.expectedVote === 'NO').length;
    const delegateScore = ((yesVotes - noVotes) / delegateReactions.length) * 25;
    probability += delegateScore;
    // Factor 4: Governance completeness (15% weight)
    const governanceScore = ((6 - missingFields) / 6) * 15;
    probability += governanceScore;
    // Factor 5: AI recommendation (10% weight)
    if (recommendation === 'YES')
        probability += 10;
    else if (recommendation === 'NO')
        probability -= 10;
    return Math.round(Math.max(15, Math.min(95, probability)));
}
/**
 * Analyze proposal using Local RAG (free, no API costs)
 */
function isValidProposalContent(text, title) {
    // Check if content is meaningful (not just random characters)
    const cleanText = text.trim().toLowerCase();
    const cleanTitle = title?.trim().toLowerCase() || '';
    // Must have minimum length
    if (cleanText.length < 50)
        return false;
    // Check for actual words (at least 5 words of 3+ characters)
    const words = cleanText.split(/\s+/).filter(w => w.length >= 3);
    if (words.length < 5)
        return false;
    // Check if text contains common proposal keywords
    const proposalKeywords = [
        'propose', 'request', 'allocate', 'fund', 'budget', 'treasury',
        'deploy', 'implement', 'upgrade', 'governance', 'vote', 'approval',
        'community', 'dao', 'protocol', 'contract', 'grant', 'ecosystem',
        'timeline', 'milestone', 'objective', 'goal', 'benefit', 'purpose',
        'team', 'project', 'development', 'audit', 'security', 'integration'
    ];
    const hasKeywords = proposalKeywords.some(keyword => cleanText.includes(keyword) || cleanTitle.includes(keyword));
    // Check for repetitive nonsense patterns
    const hasRepetitiveChars = /(.)\1{5,}/.test(cleanText); // 6+ repeated chars
    const isRandomKeyboard = /^[qwertyuiopasdfghjklzxcvbnm\s]+$/.test(cleanText) &&
        !hasKeywords;
    return hasKeywords && !hasRepetitiveChars && !isRandomKeyboard;
}
async function callLLMForProposalAnalysis(daoId, proposalId, proposalText, proposalTitle, isDraft = false) {
    const type = isDraft ? "draft proposal" : "proposal";
    console.log(`[LLM] Analyzing ${type} ${proposalId} for ${daoId}`);
    if (proposalTitle)
        console.log(`[LLM] Title: ${proposalTitle}`);
    // Validate proposal content is meaningful
    if (!isValidProposalContent(proposalText, proposalTitle)) {
        console.warn(`[LLM] Invalid or insufficient proposal content detected`);
        return {
            summary: "Unable to analyze: Proposal content appears incomplete or invalid. Please provide a detailed proposal with clear objectives, budget, timeline, and rationale.",
            benefits: [],
            risks: [{
                    text: "Incomplete proposal: Missing substantive content",
                    evidence: "Proposal does not contain sufficient detail for governance analysis",
                    severity: 'High'
                }],
            recommendation: "NO",
            confidence: 0,
            reasoning: "Cannot recommend approval for proposals lacking clear description, objectives, or governance details. A valid proposal should include: purpose, implementation plan, budget breakdown, timeline, success metrics, and risk mitigation strategies.",
            similarProposals: [],
            missingFields: [
                'Proposal objective and rationale',
                'Implementation specification',
                'Budget breakdown (if applicable)',
                'Timeline and milestones',
                'Success metrics',
                'Risk analysis'
            ],
            requiredClarifications: [
                'What is the specific purpose of this proposal?',
                'What problem does it solve for the DAO?',
                'What are the expected outcomes and how will they be measured?'
            ],
            confidenceBreakdown: {
                rulesCoverage: 0,
                retrievalSupport: 0,
                baseConfidence: 0
            }
        };
    }
    const ragAvailable = await (0, local_client_1.isLocalRAGAvailable)();
    if (!ragAvailable) {
        console.warn(`[LLM] Local RAG server not available. Using basic analysis.`);
        return fallbackAnalysis(daoId, proposalId, proposalText, isDraft);
    }
    try {
        console.log('[LLM] Searching local RAG for similar proposals...');
        const similar = await (0, local_client_1.searchLocal)(daoId, proposalText, 5);
        console.log(`[LLM] Found ${similar.length} similar documents`);
        console.log('[LLM] Generating extractive summary...');
        const summary = await (0, local_client_1.summarizeLocal)(proposalText);
        const analysis = analyzeWithLocalRAG(proposalText, similar, summary, isDraft);
        console.log(`[LLM] ✅ Local RAG ${type} analysis complete`);
        return analysis;
    }
    catch (error) {
        console.error('[LLM] Error during Local RAG analysis:', error);
        console.log('[LLM] Falling back to basic analysis');
        return fallbackAnalysis(daoId, proposalId, proposalText, isDraft);
    }
}
function analyzeWithLocalRAG(proposalText, similarDocs, summary, isDraft = false) {
    const textLower = proposalText.toLowerCase();
    const checklist = runGovernanceChecklist(proposalText);
    const missingFields = [];
    if (!checklist.hasEscrow)
        missingFields.push('Escrow/timelock mechanism');
    if (!checklist.hasVerification)
        missingFields.push('On-chain verification process');
    if (!checklist.hasKPITiming)
        missingFields.push('KPI measurement timeline');
    if (!checklist.hasAudit && textLower.includes('contract'))
        missingFields.push('Security audit');
    const requiredClarifications = generateClarifications(checklist);
    const benefits = [];
    if (textLower.includes("measurable") || textLower.includes("kpi") || textLower.includes("metric")) {
        benefits.push({
            text: "Measurable goals: Includes specific success metrics",
            evidence: extractEvidence(proposalText, ["KPI", "metric", "measurable", "goal"])
        });
    }
    if (textLower.includes("performance-based") || textLower.includes("conditional")) {
        benefits.push({
            text: "Performance-based: Payments tied to results",
            evidence: extractEvidence(proposalText, ["performance", "conditional", "milestone"])
        });
    }
    if (textLower.includes("improve") || textLower.includes("enhance")) {
        benefits.push({
            text: "Enhancement: Aims to improve existing systems",
            evidence: extractEvidence(proposalText, ["improve", "enhance", "better"])
        });
    }
    if (textLower.includes("community") || textLower.includes("user")) {
        benefits.push({
            text: "Community benefit: Focuses on user/community value",
            evidence: extractEvidence(proposalText, ["community", "user", "ecosystem"])
        });
    }
    if (textLower.includes("deploy") || textLower.includes("expand")) {
        benefits.push({
            text: "Expansion: Grows protocol presence and reach",
            evidence: extractEvidence(proposalText, ["deploy", "expand", "growth"])
        });
    }
    if (benefits.length === 0) {
        benefits.push({
            text: "General improvement: Contributes to DAO operations",
            evidence: summary.substring(0, 100) + "..."
        });
    }
    const risks = [];
    let treasuryAmount = null;
    if (detectRiskPattern(proposalText, 'treasury')) {
        treasuryAmount = extractTreasuryAmount(proposalText);
        const amountStr = treasuryAmount ? ` (${treasuryAmount})` : '';
        risks.push({
            text: `Treasury exposure: Significant funding requested from DAO treasury${amountStr}`,
            evidence: extractEvidence(proposalText, RISK_PATTERNS.treasury.keywords),
            severity: 'High'
        });
    }
    if (!checklist.hasEscrow && checklist.hasBudget) {
        risks.push({
            text: "Custody risk: No explicit escrow or timelock mechanism mentioned",
            evidence: "Missing governance safeguard: escrow/timelock not specified in proposal",
            severity: 'High'
        });
    }
    if (!checklist.hasVerification && (textLower.includes("kpi") || textLower.includes("metric"))) {
        risks.push({
            text: "Verification risk: Unclear measurement and verification process for KPIs",
            evidence: extractEvidence(proposalText, RISK_PATTERNS.verification.keywords),
            severity: 'Medium'
        });
    }
    if (detectRiskPattern(proposalText, 'counterparty')) {
        risks.push({
            text: "Counterparty risk: Dependence on external partners or protocols",
            evidence: extractEvidence(proposalText, RISK_PATTERNS.counterparty.keywords),
            severity: 'Medium'
        });
    }
    if (detectRiskPattern(proposalText, 'technical')) {
        risks.push({
            text: "Technical risk: Smart contract changes or upgrades required",
            evidence: extractEvidence(proposalText, RISK_PATTERNS.technical.keywords),
            severity: 'Medium'
        });
    }
    if (textLower.includes("bridge") || textLower.includes("cross-chain")) {
        risks.push({
            text: "Bridge risk: Cross-chain security considerations",
            evidence: extractEvidence(proposalText, ["bridge", "cross-chain", "multi-chain"]),
            severity: 'Medium'
        });
    }
    if (textLower.includes("incentive") || textLower.includes("reward")) {
        risks.push({
            text: "Gaming risk: Incentive structure may be gameable without proper safeguards",
            evidence: extractEvidence(proposalText, ["incentive", "reward", "distribute"]),
            severity: 'Low'
        });
    }
    if (detectRiskPattern(proposalText, 'operational') && risks.length < 3) {
        risks.push({
            text: "Operational risk: Requires ongoing management and coordination",
            evidence: extractEvidence(proposalText, RISK_PATTERNS.operational.keywords),
            severity: 'Low'
        });
    }
    if (risks.length === 0) {
        risks.push({
            text: "Low risk: No major concerns identified",
            evidence: "Standard proposal structure without unusual risk factors",
            severity: 'Low'
        });
    }
    const similarProposals = [];
    for (const doc of similarDocs.slice(0, 3)) {
        const outcomeStr = doc.outcome ? ` (${doc.outcome.toUpperCase()})` : '';
        const scorePercent = (doc.score * 100).toFixed(0);
        similarProposals.push(`${doc.title}${outcomeStr} - ${scorePercent}% similar`);
    }
    if (similarProposals.length === 0) {
        similarProposals.push("No directly similar past proposals found");
    }
    const avgScore = similarDocs.length > 0
        ? similarDocs.reduce((sum, doc) => sum + doc.score, 0) / similarDocs.length
        : 0;
    const passedSimilar = similarDocs.filter(doc => doc.outcome === 'passed' && doc.score > 0.6).length;
    const failedSimilar = similarDocs.filter(doc => doc.outcome === 'failed' && doc.score > 0.6).length;
    const { recommendation, conditionalPath } = determineRecommendation(checklist, risks, benefits, passedSimilar, failedSimilar);
    let baseConfidence;
    let reasoning;
    const highRisks = risks.filter(r => r.severity === 'High');
    if (recommendation === 'NO') {
        baseConfidence = 40;
        reasoning = `Critical issues prevent approval: ${highRisks.length} High-severity risks, ${missingFields.length} missing governance fields. ${failedSimilar > 0 ? `Similar to ${failedSimilar} failed proposal(s).` : 'Substantial revisions needed.'} ${conditionalPath}`;
    }
    else if (recommendation === 'ABSTAIN') {
        baseConfidence = 55;
        reasoning = `Governance safeguards missing: ${missingFields.join(', ')}. ${passedSimilar > 0 ? `Aligns with ${passedSimilar} similar passed proposal(s)` : 'Some merit'}, but requires clarifications before proceeding. ${conditionalPath}`;
    }
    else {
        baseConfidence = 75;
        reasoning = `Strong approval: ${benefits.length} benefits vs ${risks.length} risks (${highRisks.length} High-severity). ${passedSimilar > 0 ? `Precedent from ${passedSimilar} similar passed proposals.` : 'Sound governance structure.'} ${conditionalPath}`;
    }
    const confidenceResult = calculateConfidence(checklist, avgScore, baseConfidence);
    const reasoningChain = buildReasoningChain(checklist, risks, benefits, treasuryAmount, passedSimilar + failedSimilar);
    // New features for demo
    const budgetJustification = extractBudgetJustification(proposalText, treasuryAmount);
    const delegateReactions = generateDelegateReactions(recommendation, risks, checklist, treasuryAmount);
    const probabilityOfPassing = calculateProbabilityOfPassing(recommendation, passedSimilar, failedSimilar, treasuryAmount, delegateReactions, missingFields.length);
    return {
        summary,
        benefits,
        risks,
        similarProposals,
        recommendation,
        confidence: confidenceResult.score,
        reasoning,
        missingFields: missingFields.length > 0 ? missingFields : undefined,
        requiredClarifications: requiredClarifications.length > 0 ? requiredClarifications : undefined,
        confidenceBreakdown: confidenceResult.breakdown,
        reasoningChain,
        conditionalPath,
        budgetJustification,
        delegateReactions,
        probabilityOfPassing
    };
}
function fallbackAnalysis(daoId, proposalId, proposalText, isDraft = false) {
    const textLower = proposalText.toLowerCase();
    const checklist = runGovernanceChecklist(proposalText);
    const missingFields = [];
    if (!checklist.hasEscrow)
        missingFields.push('Escrow/timelock mechanism');
    if (!checklist.hasVerification)
        missingFields.push('On-chain verification process');
    if (!checklist.hasKPITiming)
        missingFields.push('KPI measurement timeline');
    if (!checklist.hasAudit && textLower.includes('contract'))
        missingFields.push('Security audit');
    const requiredClarifications = generateClarifications(checklist);
    const risks = [];
    let treasuryAmount = null;
    if (detectRiskPattern(proposalText, 'treasury')) {
        treasuryAmount = extractTreasuryAmount(proposalText);
        risks.push({
            text: "Treasury exposure: Involves treasury/funding allocation",
            evidence: extractEvidence(proposalText, RISK_PATTERNS.treasury.keywords),
            severity: 'High'
        });
    }
    if (!checklist.hasEscrow && checklist.hasBudget) {
        risks.push({
            text: "Custody risk: No explicit escrow or timelock mechanism",
            evidence: "Missing governance safeguard: escrow/timelock not specified",
            severity: 'High'
        });
    }
    if (textLower.includes("governance") || textLower.includes("voting")) {
        risks.push({
            text: "Governance risk: Changes to voting mechanisms or governance structure",
            evidence: extractEvidence(proposalText, ["governance", "voting", "power"]),
            severity: 'Medium'
        });
    }
    if (detectRiskPattern(proposalText, 'technical')) {
        risks.push({
            text: "Technical risk: Smart contract changes or upgrades",
            evidence: extractEvidence(proposalText, RISK_PATTERNS.technical.keywords),
            severity: 'Medium'
        });
    }
    if (risks.length === 0) {
        risks.push({
            text: "Low risk: No major concerns identified",
            evidence: "Standard proposal structure without unusual risk factors",
            severity: 'Low'
        });
    }
    const benefits = [];
    if (textLower.includes("improve") || textLower.includes("enhance")) {
        benefits.push({
            text: "Enhancement: Aims to improve existing systems",
            evidence: extractEvidence(proposalText, ["improve", "enhance", "better"])
        });
    }
    if (textLower.includes("community") || textLower.includes("user")) {
        benefits.push({
            text: "Community benefit: Focuses on user/community value",
            evidence: extractEvidence(proposalText, ["community", "user", "ecosystem"])
        });
    }
    if (textLower.includes("efficiency") || textLower.includes("optimize")) {
        benefits.push({
            text: "Efficiency: Optimizes processes or reduces costs",
            evidence: extractEvidence(proposalText, ["efficiency", "optimize", "reduce"])
        });
    }
    if (textLower.includes("measurable") || textLower.includes("kpi")) {
        benefits.push({
            text: "Measurable goals: Includes specific success metrics",
            evidence: extractEvidence(proposalText, ["KPI", "metric", "measurable"])
        });
    }
    if (benefits.length === 0) {
        benefits.push({
            text: "General improvement: Contributes to DAO operations",
            evidence: proposalText.substring(0, 100) + "..."
        });
    }
    const { recommendation, conditionalPath } = determineRecommendation(checklist, risks, benefits, 0, 0);
    let baseConfidence = 45;
    let reasoning = `Limited historical context without RAG. ${conditionalPath}`;
    const confidenceResult = calculateConfidence(checklist, 0, baseConfidence);
    const reasoningChain = buildReasoningChain(checklist, risks, benefits, treasuryAmount, 0);
    // New features for demo
    const budgetJustification = extractBudgetJustification(proposalText, treasuryAmount);
    const delegateReactions = generateDelegateReactions(recommendation, risks, checklist, treasuryAmount);
    const probabilityOfPassing = calculateProbabilityOfPassing(recommendation, 0, 0, treasuryAmount, delegateReactions, missingFields.length);
    return {
        summary: `Basic analysis for ${daoId} proposal ${proposalId}. ${benefits.length} potential benefit(s) and ${risks.length} risk factor(s) identified. Governance checklist: ${6 - missingFields.length}/6 fields present.`,
        benefits,
        risks,
        similarProposals: ["Full governance history not loaded. Enable RAG for similar proposal analysis."],
        recommendation,
        confidence: confidenceResult.score,
        reasoning,
        missingFields: missingFields.length > 0 ? missingFields : undefined,
        requiredClarifications: requiredClarifications.length > 0 ? requiredClarifications : undefined,
        confidenceBreakdown: confidenceResult.breakdown,
        reasoningChain,
        conditionalPath,
        budgetJustification,
        delegateReactions,
        probabilityOfPassing
    };
}
//# sourceMappingURL=proposalAnalysis.js.map