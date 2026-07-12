import { listSessionDocuments } from '@/apiRequests/ttt';

const SESSION_ID_KEY = 'currentSessionId';
const JOB_SESSION_KEY = 'jobSessionId';

export const GRAPH_IDS_CHANGED_EVENT = 'graphids-changed';

export const notifyGraphIdsChanged = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(GRAPH_IDS_CHANGED_EVENT));
};

// ─── Session ID ───────────────────────────────────────────────────────────
// Written by useChatbot when currentSession is first generated so that
// useTrainPDF can read it without prop threading.

export const setCurrentSessionId = (sessionId: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
};

export const getCurrentSessionId = (): string => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(SESSION_ID_KEY) || '';
};

// ─── Job Session ID ───────────────────────────────────────────────────────
// Groups this tab's document uploads so the TTT backend can hand the list
// back via GET /v1/documents?session_id=XXX

export const getJobSessionId = (): string => {
    if (typeof window === 'undefined') return '';
    let jobSessionId = sessionStorage.getItem(JOB_SESSION_KEY);
    if (!jobSessionId) {
        jobSessionId = crypto.randomUUID();
        sessionStorage.setItem(JOB_SESSION_KEY, jobSessionId);
    }
    return jobSessionId;
};

// currentSessionId instead of living for the lifetime of the browser tab.
export const resetJobSessionId = (): string => {
    if (typeof window === 'undefined') return '';
    const jobSessionId = crypto.randomUUID();
    sessionStorage.setItem(JOB_SESSION_KEY, jobSessionId);
    return jobSessionId;
};

// currentSessionId's, which is already regenerated on every fresh mount.
if (typeof window !== 'undefined') {
    resetJobSessionId();
}

// ─── Graph IDs ────────────────────────────────────────────────────────────
// Derived on demand from the backend's session document list (source of
// truth) rather than tracked in a local sessionStorage array, so it stays
// correct across reloads and doesn't drift from server state.

export const getGraphIds = async (): Promise<string[] | null> => {
    const docs = await listSessionDocuments(getJobSessionId());
    if (!Array.isArray(docs)) return null;
    return docs.filter((d: any) => d?.state === 'COMPLETED' && d?.result_graph_id).map((d: any) => d.result_graph_id);
};
