/**
 * Local RAG Client - TypeScript client for Python RAG server
 * No API costs, runs on localhost:9000
 */
export interface LocalSearchResult {
    id: string;
    title: string;
    text: string;
    outcome: string;
    type: string;
    score: number;
}
export interface LocalDocument {
    id: string;
    daoId: string;
    title: string;
    text: string;
    outcome?: string;
    type?: string;
}
/**
 * Check if local RAG server is available
 */
export declare function isLocalRAGAvailable(): Promise<boolean>;
/**
 * Generate embedding for text
 */
export declare function embedLocal(text: string): Promise<number[]>;
/**
 * Search for similar documents
 */
export declare function searchLocal(daoId: string, text: string, topK?: number): Promise<LocalSearchResult[]>;
/**
 * Generate extractive summary using TextRank
 */
export declare function summarizeLocal(text: string): Promise<string>;
/**
 * Add document to vector store
 */
export declare function addDocumentLocal(doc: LocalDocument): Promise<void>;
//# sourceMappingURL=local-client.d.ts.map