"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeDraftRouter = void 0;
const express_1 = require("express");
const proposalAnalysis_1 = require("../llm/proposalAnalysis");
exports.analyzeDraftRouter = (0, express_1.Router)();
exports.analyzeDraftRouter.post("/", async (req, res) => {
    const { daoId, draftText } = req.body;
    if (!daoId || !draftText) {
        return res.status(400).json({
            error: "Missing required fields: daoId, draftText"
        });
    }
    const result = await (0, proposalAnalysis_1.callLLMForProposalAnalysis)(daoId, "draft", draftText);
    res.json({ analysis: result });
});
//# sourceMappingURL=analyzeDraft.js.map