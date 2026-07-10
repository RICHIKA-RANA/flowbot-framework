export interface HistorySessionSummary {
    sessionId: string;
    chatbotId: string;
    createdAt: string;
    firstQuestion: string | null;
}

export interface HistoryChatEntry {
    question: string;
    answer: string;
    graphIds: string[];
    askedAt: string;
}

export interface HistoryDocumentEntry {
    name: string;
    size: number;
    type: string;
    jobId: string;
    graphId: string;
    uploadedAt: string;
}

export interface HistorySessionDetail {
    sessionId: string;
    chatbotId: string;
    email: string | null;
    createdAt: string;
    updatedAt: string;
    documents: HistoryDocumentEntry[];
    chats: HistoryChatEntry[];
}
