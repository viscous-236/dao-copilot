"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Ingest Uniswap governance data into local RAG
 */
const local_client_1 = require("../local-client");
async function main() {
    console.log('🚀 Ingesting Uniswap Governance Data into Local RAG\n');
    // Uniswap Proposals
    const proposals = [
        {
            id: 'uniswap-prop-001',
            daoId: 'uniswap',
            title: 'Deploy Uniswap V3 on BNB Chain',
            outcome: 'passed',
            text: `
Deploy Uniswap V3 to BNB Chain. This proposal seeks approval to deploy Uniswap V3 on BNB Chain.
The deployment will use the same V3 factory and router contracts that have been battle-tested on Ethereum mainnet.
BNB Chain offers lower gas fees and a large user base, making it an attractive expansion target.
The deployment will be handled by the Uniswap Foundation with oversight from the DAO.
No treasury funds are required for this deployment.
      `.trim()
        },
        {
            id: 'uniswap-prop-002',
            daoId: 'uniswap',
            title: 'Establish Grants Program ($25M)',
            outcome: 'passed',
            text: `
Establish a $25 million grants program to fund ecosystem growth. The program will distribute funds quarterly
based on measurable KPIs including TVL growth, new integrations, and developer activity.
Funds will be held in a 4-of-7 multisig controlled by elected community members.
Each grant will be reviewed by a committee and require on-chain voting for amounts over $500K.
The program will run for 2 years with quarterly reviews and the ability to pause if KPIs are not met.
      `.trim()
        },
        {
            id: 'uniswap-prop-003',
            daoId: 'uniswap',
            title: 'Lower Fee Switch Threshold to 33%',
            outcome: 'failed',
            text: `
Reduce the governance threshold for activating the protocol fee switch from 50% to 33% of UNI token supply.
This would make it easier to activate protocol fees without broad consensus.
Community concerns: Could lead to premature fee activation before the protocol is ready.
Risk of fragmenting governance and reducing the supermajority requirement.
The proposal failed to reach quorum and was rejected by the community.
      `.trim()
        },
        {
            id: 'uniswap-prop-004',
            daoId: 'uniswap',
            title: 'Deploy Uniswap V3 on Polygon',
            outcome: 'passed',
            text: `
Deploy Uniswap V3 on Polygon PoS chain. Following successful deployments on other L2s,
this proposal seeks to bring Uniswap V3 to Polygon's high-throughput environment.
Polygon offers sub-cent transaction fees and has a thriving DeFi ecosystem.
The deployment will use canonical bridge assets and the same contracts as Ethereum mainnet.
The Uniswap Foundation will handle the technical deployment with DAO oversight.
      `.trim()
        },
        {
            id: 'uniswap-prop-005',
            daoId: 'uniswap',
            title: 'Uniswap V4 Hooks Governance Framework',
            outcome: 'passed',
            text: `
Establish a governance framework for approving V4 hooks. Hooks allow developers to customize pool behavior
but introduce security risks. This framework requires:
1. Hooks must pass a security audit from approved auditors
2. Hooks handling >$10M TVL require DAO approval
3. Emergency pause functionality controlled by Security Council
4. Mandatory disclosure of all hook code and external dependencies
The framework aims to balance innovation with risk management.
      `.trim()
        }
    ];
    console.log('✅ Ingesting 5 Uniswap proposals...');
    for (const prop of proposals) {
        await (0, local_client_1.addDocumentLocal)(prop);
        console.log(`   ✅ ${prop.title} (${prop.outcome})`);
    }
    // Governance documents
    const docs = [
        {
            id: 'uniswap-gov-001',
            daoId: 'uniswap',
            title: 'Governance Overview',
            type: 'documentation',
            text: `
Uniswap Governance allows UNI token holders to vote on protocol changes, treasury allocations,
and governance parameters. Proposals go through multiple stages:
1. Temperature Check (Snapshot) - 7 day voting period, 25K UNI threshold
2. Consensus Check (Snapshot) - 7 days, 50K UNI threshold  
3. Governance Proposal (On-chain) - 7 days, 40M UNI quorum required
Delegates can vote on behalf of token holders who delegate their voting power.
The governance process emphasizes careful deliberation and broad consensus before making changes.
      `.trim()
        },
        {
            id: 'uniswap-gov-002',
            daoId: 'uniswap',
            title: 'Multi-Chain Deployment Guidelines',
            type: 'documentation',
            text: `
Guidelines for deploying Uniswap to new chains:
1. Chain must have a canonical bridge with >$500M TVL and 6+ months operating history
2. Smart contract code must be identical to Ethereum mainnet deployment
3. Governance retains ability to pause contracts via multisig
4. Bridge risks must be disclosed and documented
5. Community must have 2 weeks to review security considerations
These guidelines ensure consistent security standards across all Uniswap deployments.
      `.trim()
        }
    ];
    console.log('\n✅ Ingesting 2 governance documents...');
    for (const doc of docs) {
        await (0, local_client_1.addDocumentLocal)(doc);
        console.log(`   ✅ ${doc.title}`);
    }
    // Verify ingestion
    const response = await fetch('http://127.0.0.1:9000/stats');
    const stats = await response.json();
    console.log('\n📊 Vector Store Statistics:', stats);
    console.log('\n✅ Local RAG ingestion complete! Total:', stats.total_documents, 'documents');
}
main().catch(console.error);
//# sourceMappingURL=ingest-local.js.map