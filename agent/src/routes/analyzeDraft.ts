import { Router } from "express";
import { callLLMForProposalAnalysis } from "../llm/proposalAnalysis";

export const analyzeDraftRouter = Router();

analyzeDraftRouter.post("/", async (req, res) => {
  const { daoId, draftText } = req.body;

  if (!daoId || !draftText) {
    return res.status(400).json({ 
      error: "Missing required fields: daoId, draftText" 
    });
  }

  console.log(`[analyzeDraft] Analyzing draft for DAO ${daoId}`);

  const result = await callLLMForProposalAnalysis(daoId, "draft", draftText);

  res.json({ analysis: result });
});
