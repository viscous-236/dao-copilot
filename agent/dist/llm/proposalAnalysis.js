"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callLLMForProposalAnalysis = callLLMForProposalAnalysis;
async function callLLMForProposalAnalysis(daoId, proposalId, proposalText) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const textLower = proposalText.toLowerCase();
    const risks = [];
    if (textLower.includes("treasury") || textLower.includes("fund")) {
        risks.push("Financial risk: Involves treasury/funding allocation");
    }
    if (textLower.includes("governance") || textLower.includes("voting")) {
        risks.push("Governance risk: Changes to voting mechanisms or governance structure");
    }
    if (textLower.includes("upgrade") || textLower.includes("contract")) {
        risks.push("Technical risk: Smart contract changes or upgrades");
    }
    if (risks.length === 0) {
        risks.push("Low risk: No major concerns identified");
    }
    const benefits = [];
    if (textLower.includes("improve") || textLower.includes("enhance")) {
        benefits.push("Enhancement: Aims to improve existing systems");
    }
    if (textLower.includes("community") || textLower.includes("user")) {
        benefits.push("Community benefit: Focuses on user/community value");
    }
    if (textLower.includes("efficiency") || textLower.includes("optimize")) {
        benefits.push("Efficiency: Optimizes processes or reduces costs");
    }
    if (benefits.length === 0) {
        benefits.push("General improvement: Contributes to DAO operations");
    }
    let recommendation;
    let confidence;
    let reasoning;
    if (risks.length > 3) {
        recommendation = "NO";
        confidence = 75;
        reasoning = "High risk factors detected. Recommend voting NO due to significant concerns that need addressing.";
    }
    else if (benefits.length >= 2 && risks.length <= 2) {
        recommendation = "YES";
        confidence = 80;
        reasoning = "Clear benefits with manageable risks. Proposal aligns well with DAO objectives.";
    }
    else {
        recommendation = "ABSTAIN";
        confidence = 60;
        reasoning = "Mixed signals. More community discussion needed before taking a clear stance.";
    }
    const summary = `This proposal for ${daoId} (ID: ${proposalId}) presents ${benefits.length} key benefit(s) and ${risks.length} risk factor(s). ${reasoning}`;
    const similarProposals = [
        "Similar proposal from 3 months ago had 65% support",
        "Related governance change was approved with 72% votes",
        "Comparable treasury allocation passed with community consensus"
    ];
    return {
        summary,
        benefits,
        risks,
        similarProposals,
        recommendation,
        confidence,
        reasoning
    };
}
//# sourceMappingURL=proposalAnalysis.js.map