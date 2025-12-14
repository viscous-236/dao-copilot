import { Router } from "express";
import { callLLMForProposalAnalysis } from "../llm/proposalAnalysis";

export const analyzeProposalRouter = Router();

analyzeProposalRouter.post("/",async (req,res) => {
    const {daoId, proposalId, proposalText, proposalTitle, isDraft} = req.body;

    if (!daoId || !proposalId || !proposalText) {
        return res.status(400).json({ error: "Missing required fields: daoId, proposalId, proposalText" });
    }

    const type = isDraft ? "draft" : "proposal";
    console.log(`[analyzeProposal] Analyzing ${type} for DAO ${daoId}, ID ${proposalId}`);
    console.log(`[analyzeProposal] Title: ${proposalTitle || 'N/A'}`);

    const result = await callLLMForProposalAnalysis(daoId, proposalId, proposalText, proposalTitle, isDraft);

    res.json({ analysis: result });
})