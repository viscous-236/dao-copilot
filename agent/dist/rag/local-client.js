"use strict";
/**
 * Local RAG Client - TypeScript client for Python RAG server
 * No API costs, runs on localhost:9000
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLocalRAGAvailable = isLocalRAGAvailable;
exports.embedLocal = embedLocal;
exports.searchLocal = searchLocal;
exports.summarizeLocal = summarizeLocal;
exports.addDocumentLocal = addDocumentLocal;
const LOCAL_RAG_URL = process.env.LOCAL_RAG_URL || 'http://127.0.0.1:9000';
/**
 * Check if local RAG server is available
 */
async function isLocalRAGAvailable() {
    try {
        const response = await fetch(`${LOCAL_RAG_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        });
        const data = await response.json();
        return response.ok && data.status === 'ok';
    }
    catch (error) {
        return false;
    }
}
/**
 * Generate embedding for text
 */
async function embedLocal(text) {
    const response = await fetch(`${LOCAL_RAG_URL}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    if (!response.ok) {
        throw new Error(`Embed failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.embedding;
}
/**
 * Search for similar documents
 */
async function searchLocal(daoId, text, topK = 5) {
    const response = await fetch(`${LOCAL_RAG_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daoId, text, topK })
    });
    if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.results;
}
/**
 * Generate extractive summary using TextRank
 */
async function summarizeLocal(text) {
    const response = await fetch(`${LOCAL_RAG_URL}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    if (!response.ok) {
        throw new Error(`Summarize failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.summary;
}
/**
 * Add document to vector store
 */
async function addDocumentLocal(doc) {
    const response = await fetch(`${LOCAL_RAG_URL}/add_doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
    });
    if (!response.ok) {
        throw new Error(`Add document failed: ${response.statusText}`);
    }
}
//# sourceMappingURL=local-client.js.map