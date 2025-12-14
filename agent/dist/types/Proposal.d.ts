export interface EvidencedPoint {
    text: string;
    evidence: string;
    severity?: 'High' | 'Medium' | 'Low';
}
export interface GovernanceCheckItem {
    field: string;
    status: 'present' | 'missing';
    importance: 'critical' | 'recommended';
}
export interface ReasoningStep {
    step: number;
    category: 'governance' | 'treasury' | 'kpi' | 'risk' | 'similarity';
    finding: string;
    impact: 'positive' | 'negative' | 'neutral';
}
export interface BudgetItem {
    category: string;
    amount: string;
    justification?: string;
}
export interface BudgetJustification {
    breakdown: BudgetItem[];
    totalAmount: string;
    flags: string[];
}
export interface DelegateReaction {
    delegateType: string;
    expectedVote: 'YES' | 'NO' | 'ABSTAIN';
    reasoning: string;
}
export interface ProposalAnalysis {
    summary: string;
    benefits: EvidencedPoint[];
    risks: EvidencedPoint[];
    similarProposals: string[];
    recommendation: "YES" | "NO" | "ABSTAIN";
    confidence: number;
    reasoning: string;
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
export interface Proposal {
    id: string;
    title: string;
    body: string;
    author: string;
    created: number;
    start: number;
    end: number;
    state: string;
    choices: string[];
    scores: number[];
    scores_total: number;
}
//# sourceMappingURL=Proposal.d.ts.map