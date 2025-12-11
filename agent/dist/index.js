"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyzeDraft_1 = require("./routes/analyzeDraft");
const analyzeProposal_1 = require("./routes/analyzeProposal");
const health_1 = require("./routes/health");
const dotenv_1 = require("dotenv");
const x402_express_1 = require("x402-express");
const cors_1 = __importDefault(require("cors"));
(0, dotenv_1.config)();
const app = (0, express_1.default)();
/**
 * 1) CORS – MUST be first so it runs for all responses
 */
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Payment-TxHash",
        "X-Payment-Network",
        "X-Payment-Amount",
        "X-Payment-Token",
    ],
    exposedHeaders: [
        "X-Payment-Required",
        "X-Payment-Address",
        "X-Payment-Amount",
        "X-Payment-Network",
        "X-Payment-Token",
    ],
}));
// handle preflight globally
app.options("*", (0, cors_1.default)());
/**
 * 2) JSON body parser
 */
app.use(express_1.default.json());
/**
 * 3) X402 payment middleware – AFTER CORS, BEFORE ROUTES
 */
const payTo = process.env.PAY_TO_ADDRESS;
const enableX402 = process.env.ENABLE_X402 === "true" && !!payTo;
if (enableX402) {
    console.log("🔒 X402 Payment Middleware ENABLED");
    console.log(`💰 Payments to: ${payTo}`);
    const facilitatorUrl = (process.env.FACILITATOR_URL ||
        "https://facilitator.x402.org");
    app.use((0, x402_express_1.paymentMiddleware)(payTo, {
        "POST /api/analyze-draft": {
            price: "$0.001",
            network: "base-sepolia",
        },
        "POST /api/analyze-proposal": {
            price: "$0.001",
            network: "base-sepolia",
        },
    }, {
        url: facilitatorUrl,
    }));
}
else {
    console.log("⚠️ X402 Payment Middleware DISABLED (set ENABLE_X402=true and PAY_TO_ADDRESS to enable)");
}
/**
 * 4) Routes
 */
app.use("/api/analyze-draft", analyzeDraft_1.analyzeDraftRouter);
app.use("/api/analyze-proposal", analyzeProposal_1.analyzeProposalRouter);
app.use("/api/health", health_1.healthRouter);
/**
 * 5) Debug: log headers of every response (helps you verify CORS)
 */
app.use((req, res, next) => {
    res.on("finish", () => {
        // This will show you what headers actually went out
        console.log("Response headers:", res.getHeaders());
    });
    next();
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`AI Agent server listening on port ${PORT}`);
});
//# sourceMappingURL=index.js.map