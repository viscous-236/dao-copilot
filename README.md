# 🗳️ DORA-AI (Chrome Extension)

**AI-powered governance analysis with X402 micropayments**

A universal Chrome extension that provides delegate-grade analysis of DAO proposals using RAG (Retrieval-Augmented Generation) and X402 micropayments. Analyze Uniswap and 1inch governance proposals for just $0.001 USDC.

**Agent Deployment:** https://dora-ai-ya10.onrender.com  
**Cost:** $0.001 USDC per analysis via X402  
**Network:** Base Sepolia  

---

## 🎯 Problem It Solves

DAO governance today is high-stakes but cognitively expensive. Delegates are expected to read long, technical proposals and make funding or protocol decisions under time pressure, often without structured tools to assess risk, precedent, or alignment with DAO norms.

### Key Problems

**Information overload**  
Governance proposals are lengthy, unstructured, and time-consuming to evaluate during active voting windows.

**Lack of precedent awareness**  
Delegates rarely have instant access to similar past proposals and their outcomes when voting.

**Inconsistent risk evaluation**  
Critical governance safeguards (e.g. escrow, timelocks, KPI verification) are often overlooked or evaluated subjectively.

**Low participation quality**  
Many token holders abstain or vote heuristically due to the complexity of governance decisions.

### How This Project Helps

This project provides a governance-native AI co-pilot that:

- **Summarizes proposals in seconds**

- **Surfaces relevant historical precedents**

- **Flags missing governance safeguards and risks**

- **Produces an evidence-backed vote recommendation with confidence**

All without relying on paid APIs or opaque LLM reasoning.

### TL;DR

The project reduces governance friction by turning long, complex DAO proposals into clear, risk-aware, and precedent-informed decisions at the point of voting.

---

## ✨ Features

### Delegate-Grade Analysis
- **Benefits with Evidence:** Extracts key benefits with direct proposal quotes
- **Risk Assessment:** Identifies risks with color-coded severity badges
- **Budget Justification:** Analyzes financial requests and spending rationale
- **Delegate Predictions:** Forecasts how different delegate groups will vote
- **Probability of Passing:** Statistical prediction based on historical data
- **Governance Quality Check:** Flags missing fields and required clarifications
- **Draft Proposal Analysis:** Help authors improve proposals before submission with feedback on structure, clarity, and governance requirements

### X402 Micropayments
- **Pay-per-use:** Only $0.001 USDC per analysis
- **Instant:** No subscriptions, no registration
- **Censorship-resistant:** Decentralized payment rails
- **MetaMask integration:** Sign and pay in one click

### Local RAG (Precomputed Mode)
- **36 governance documents** (17 Uniswap + 19 1inch)
- **Precomputed embeddings** (384D, optimized for production)
- **TextRank summarization** (lightweight, fast)

### Improving Efficiency (Future Work)
- Expand governance corpus by ingesting more historical proposals across DAOs to improve precedent matching and confidence calibration.
- Hybrid retrieval strategy combining vector similarity with governance-specific rules (e.g. treasury size, escrow presence) for more accurate analysis.
- Optional local model augmentation using small on-device LLMs to improve explanation clarity while keeping retrieval and risk checks deterministic.

### Multi-DAO Support
## Can be extended to new DAOs by adding documents
- Uniswap governance
- 1inch governance

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Content Script (injected into Snapshot/DAO sites)   │   │
│  │  • Detects proposals                                 │   │
│  │  • Injects analysis UI                               │   │
│  │  • Handles X402 payments                             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS (X402 payment)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Render Web Service (Single Container)          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Node.js Express (Public - Port auto-assigned)       │   │
│  │  • X402 payment verification                         │   │
│  │  • Proposal analysis orchestration                   │   │
│  │  • CORS enabled for extension                        │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │ localhost:9000                          │
│                   ▼                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Python FastAPI (Private - localhost only)           │   │
│  │  • Precomputed embeddings (no ML models)             │   │
│  │  • Keyword-based search                              │   │
│  │  • TextRank summarization                            │   │
│  │  • Reads data/vecstore.json                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **Precomputed embeddings:** All document embeddings generated locally, stored in `vecstore.json`
- **No ML in production:** Removed `sentence-transformers` to fit Render free tier (512MB RAM)
- **Keyword search:** Fast, lightweight, no GPU required
- **Single container:** Node spawns Python process, shared filesystem access

---

## 🚀 Tech Stack

### Frontend (Chrome Extension)
- **React 18** - UI components
- **TypeScript** - Type safety
- **Webpack 5** - Bundling
- **Viem** - Ethereum interactions
- **X402 SDK** - Micropayment client

### Backend (Node.js)
- **Express 4.19** - HTTP server
- **x402-express** - Payment verification middleware
- **TypeScript** - Type safety
- **Child process** - Python spawning

### RAG (Python)
- **FastAPI** - Async HTTP server
- **NumPy** - Vector operations
- **scikit-learn** - Keyword matching
- **Sumy** - TextRank summarization
- **No sentence-transformers** - Precomputed mode

### Blockchain
- **Base Sepolia** - Testnet for X402
- **USDC** - Payment token
- **X402** - Micropayment protocol

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.9+
- Chrome browser
- MetaMask extension
- Base Sepolia USDC (get from faucet)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/dao-copilot.git
cd dao-copilot
```

2. **Set up the agent (backend + RAG)**
```bash
cd agent
npm install
pip install -r requirements.txt
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your settings:
# - FACILITATOR_URL=https://x402.org/facilitator
# - PAY_TO_ADDRESS=0xYourWalletAddress
# - ENABLE_LOCAL_RAG=true
# - LOCAL_RAG_URL=http://127.0.0.1:9000
```

4. **Start the agent server**
```bash
npm run dev
# This starts Node.js on port 4000
# Python RAG auto-starts on port 9000
```

5. **Build the Chrome extension**
```bash
cd ../extension
npm install
npm run build
```

6. **Load the extension in Chrome**
- Open `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select `extension/dist` folder

---

## 🎮 Usage

### For End Users

1. **Install the extension** (load unpacked in developer mode)

2. **Get Base Sepolia USDC**
   - Visit https://faucet.circle.com
   - Request testnet USDC on Base Sepolia

3. **Visit a DAO proposal
   - Go to vote.uniswapfoundation.org or 1inch snapshot page
   - Go to https://snapshot.org/#/uniswapgovernance.eth
   - Or https://snapshot.org/#/1inch.eth
   - Open any proposal

4. **Click the DAO Co-Pilot button**
   - Minimized round button appears on the page
   - Click to expand the analysis panel

5. **Connect your wallet**
   - Click "Connect Wallet"
   - Approve MetaMask connection

6. **Analyze the proposal**
   - For published proposals: Click "🔍 Ask AI About This Proposal"
   - For draft proposals: Click "📝 Analyze My Draft" to get feedback before submission
   - Sign the X402 payment ($0.001 USDC)
   - Get comprehensive analysis in seconds

## 💰 X402 Integration

### How It Works

1. **User requests analysis** → Extension initiates X402 flow
2. **X402 SDK generates payment proof** → User signs in MetaMask
3. **Extension sends request + payment proof** → Backend receives
4. **x402-express middleware verifies** → Checks signature, amount, recipient
5. **Backend processes request** → Calls Python RAG, generates analysis
6. **Response sent to extension** → User sees results

### Payment Flow
```typescript
// Extension (App.tsx)
const response = await fetchWithPayment(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(proposalData),
});

// Backend verifies automatically via x402-express middleware
// No additional code needed!
```

### Configuration
- **Amount:** 0.001 USDC (1000 micro-USDC)
- **Network:** Base Sepolia (Chain ID 84532)
- **Token:** USDC contract on Base Sepolia
- **Recipient:** Set in `PAY_TO_ADDRESS` env var
- **Facilitator:** https://x402.org/facilitator

---

## 📊 RAG System

### Precomputed Embeddings

**Documents in vecstore.json:**
- 17 Uniswap governance documents (proposals, delegation guides, voting docs, treasury management)
- 19 1inch governance documents (proposals, tokenomics, voting mechanics, security audits, grants)
- Total: 36 documents with 384-dimensional embeddings

**Why precomputed?**
- Embeddings generated once using `sentence-transformers` locally
- Production server just reads pre-embedded vectors
- No GPU, no PyTorch, no 4GB model loading
- Fits Render free tier (512MB RAM)

### Keyword Search (Production)

```python
# local_rag_server.py - Keyword matching
query_words = set(payload.text.lower().split())
text_words = set(val["text"].lower().split())
overlap = len(query_words & text_words)
score = overlap / max(len(query_words), 1)
```

**Advantages:**
- Fast (~10ms per query)
- Lightweight (no ML dependencies)
- Deterministic (same input = same output)
- Works great for governance text (high keyword overlap)
  
---

## 🛠️ Development

### Project Structure
```
dao-copilot/
├── agent/                      # Backend + RAG
│   ├── src/
│   │   ├── index.ts           # Express server (spawns Python)
│   │   ├── routes/            # API endpoints
│   │   ├── llm/               # Analysis logic
│   │   └── config/            # DAO configurations
│   ├── local_rag_server.py    # Python RAG (precomputed mode)
│   ├── data/
│   │   └── vecstore.json      # Precomputed embeddings (36 docs)
│   ├── requirements.txt       # Python deps (no ML in prod)
│   └── package.json
├── extension/                  # Chrome extension
│   ├── src/
│   │   ├── ui/
│   │   │   ├── App.tsx        # Main React component
│   │   │   └── components/    # UI components
│   │   ├── content-script/    # Page injection
│   │   ├── background/        # X402 payment handling
│   │   └── manifest.json      # Extension config
│   └── package.json
└── README.md
```

## 🎯 Roadmap

### Phase 1: Core Features 
- [x] Chrome extension with Snapshot integration
- [x] X402 micropayment integration
- [x] Local RAG with precomputed embeddings
- [x] Uniswap governance support
- [x] 1inch governance support
- [x] Draft proposal analysis (helps authors improve proposals before submission)
- [x] Render deployment

### Phase 2: Enhanced Analysis 
- [ ] Historical voting pattern analysis
- [ ] Delegate reputation scoring
- [ ] Proposal outcome predictions (ML-based)
- [ ] Gas cost estimation for on-chain votes

### Phase 3: Multi-DAO Expansion 
- [ ] Arbitrum governance
- [ ] Compound governance
- [ ] MakerDAO governance
- [ ] Generic Snapshot space support

### Phase 4: Advanced Features 
- [ ] Real-time proposal monitoring
- [ ] Delegate notification system
- [ ] DAO analytics dashboard

---

## 🤝 Contributing

Contributions welcome! Please follow these guidelines:

1. **Fork the repo**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit your changes:** `git commit -m 'Add amazing feature'`
4. **Push to the branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Style
- TypeScript: Follow ESLint rules
- Python: Follow PEP 8
- React: Functional components with hooks
- Commits: Conventional commits format

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


**No setup required. No backend to run. Just install and use.** 🚀
