const GRAPH_KEY = 'graphIds';
const JOB_KEY = 'jobIds';
const SESSION_ID_KEY = 'currentSessionId';

// Fired whenever the set of session graph ids changes, so same-tab consumers
// (e.g. the namespace gate in useChatbot) can react to upload completion.
export const GRAPH_IDS_CHANGED_EVENT = 'graphids-changed';

const notifyGraphIdsChanged = () => {
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

// ─── Graph IDs ────────────────────────────────────────────────────────────

export const addGraphId = (graphId: string) => {
    if (typeof window === 'undefined') return;

    const graphIds = getGraphIds();   
    // making sure it is not already there;
    if (!graphIds.includes(graphId)) {
        graphIds.push(graphId);
        sessionStorage.setItem(GRAPH_KEY, JSON.stringify(graphIds));
        notifyGraphIdsChanged();
    }
};
// fetching all stored graphids from the session storage
export const getGraphIds = (): string[] => {
    if (typeof window === 'undefined') return [];
  
    const value = sessionStorage.getItem(GRAPH_KEY);
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)? parsed.filter(id => typeof id === 'string'): [];
    } catch {
        return [];
    }
};
// clearing the sessionstorage of graphids
export const clearGraphIds = () => {
    if (typeof window === 'undefined') return;

    sessionStorage.removeItem(GRAPH_KEY);
    notifyGraphIdsChanged();
};

// ─── Job IDs

export const addJobId = (jobId: string) => {
    if (typeof window === 'undefined') return;

    const jobIds = getJobIds();
    if (!jobIds.includes(jobId)) {
        jobIds.push(jobId);
        sessionStorage.setItem(JOB_KEY, JSON.stringify(jobIds));
    }
};

export const getJobIds = (): string[] => {
    if (typeof window === 'undefined') return [];

    const value = sessionStorage.getItem(JOB_KEY);
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)? parsed.filter(id => typeof id === 'string'): [];
    } catch {
        return [];
    }
};

export const clearJobIds = () => {
    if (typeof window === 'undefined') return;

    sessionStorage.removeItem(JOB_KEY);
};
