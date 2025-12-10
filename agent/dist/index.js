"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyzeDraft_1 = require("./routes/analyzeDraft");
const analyzeProposal_1 = require("./routes/analyzeProposal");
const health_1 = require("./routes/health");
const app = (0, express_1.default)();
// Enable CORS for browser extension
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    // Handle preflight requests
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});
app.use(express_1.default.json());
app.use("/api/analyze-draft", analyzeDraft_1.analyzeDraftRouter);
app.use("/api/analyze-proposal", analyzeProposal_1.analyzeProposalRouter);
app.use("/api/health", health_1.healthRouter);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`AI Agent server listening on port ${PORT}`);
});
//# sourceMappingURL=index.js.map