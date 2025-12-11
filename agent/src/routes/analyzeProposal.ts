import { Router } from "express";
import { callLLMForProposalAnalysis } from "../llm/proposalAnalysis";

export const analyzeProposalRouter = Router();

analyzeProposalRouter.post("/",async (req,res) => {
    const {daoId, proposalId,proposalText} = req.body;

    if (!daoId || !proposalId || !proposalText) {
        return res.status(400).json({ error: "Missing required fields: daoId, proposalId, proposalText" });
    }

    console.log(`[analyzeProposal] Analyzing proposal for DAO ${daoId}, proposal ID ${proposalId}`);

    const result = await callLLMForProposalAnalysis(daoId, proposalId, proposalText);

    res.json({ analysis: result });
})