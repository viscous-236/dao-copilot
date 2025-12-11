"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeProposalRouter = void 0;
const express_1 = require("express");
const proposalAnalysis_1 = require("../llm/proposalAnalysis");
exports.analyzeProposalRouter = (0, express_1.Router)();
exports.analyzeProposalRouter.post("/", async (req, res) => {
    const { daoId, proposalId, proposalText } = req.body;
    if (!daoId || !proposalId || !proposalText) {
        return res.status(400).json({ error: "Missing required fields: daoId, proposalId, proposalText" });
    }
    console.log(`[analyzeProposal] Analyzing proposal for DAO ${daoId}, proposal ID ${proposalId}`);
    const result = await (0, proposalAnalysis_1.callLLMForProposalAnalysis)(daoId, proposalId, proposalText);
    res.json({ analysis: result });
});
//# sourceMappingURL=analyzeProposal.js.map