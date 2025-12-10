import express from "express";
import { analyzeDraftRouter } from "./routes/analyzeDraft";
import { analyzeProposalRouter } from "./routes/analyzeProposal";
import { healthRouter } from "./routes/health";

const app = express();
app.use(express.json());

app.use("/api/analyze-draft", analyzeDraftRouter);
app.use("/api/analyze-proposal", analyzeProposalRouter);
app.use("/api/health", healthRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AI Agent server listening on port ${PORT}`);
});
