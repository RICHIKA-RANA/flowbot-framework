import { listSessionDocuments } from '@/apiRequests/ttt';

const JOB_SESSION_KEY = 'jobSessionId';

export const GRAPH_IDS_CHANGED_EVENT = 'graphids-changed';

export const notifyGraphIdsChanged = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(GRAPH_IDS_CHANGED_EVENT));
};

export const getJobSessionId = (): string => {
    if (typeof window === 'undefined') return '';

    let jobSessionId = sessionStorage.getItem(JOB_SESSION_KEY);
    if (!jobSessionId) {
        jobSessionId = crypto.randomUUID();
        sessionStorage.setItem(JOB_SESSION_KEY, jobSessionId);
    }
    return jobSessionId;
};

export const getGraphIds = async (): Promise<string[] | null> => {
    const docs = await listSessionDocuments(getJobSessionId());
    if (!Array.isArray(docs)) return null;
    return docs.filter((d: any) => d?.state === 'COMPLETED' && d?.result_graph_id).map((d: any) => d.result_graph_id);
};
