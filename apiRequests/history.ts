import { HistorySessionSummary, HistorySessionDetail } from '@/types/history';

export const listHistorySessions = async (): Promise<HistorySessionSummary[]> => {
    try {
        const res = await fetch('/api/history/sessions');
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data?.sessions) ? data.sessions : [];
    } catch (error) {
        console.error('Failed to list history sessions', error);
        return [];
    }
};

export const getHistorySession = async (sessionId: string): Promise<HistorySessionDetail | null> => {
    try {
        const res = await fetch(`/api/history/sessions?sessionId=${encodeURIComponent(sessionId)}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error(`Failed to fetch history session ${sessionId}`, error);
        return null;
    }
};

export const deleteHistorySession = async (sessionId: string): Promise<boolean> => {
    try {
        const res = await fetch(`/api/history/sessions?sessionId=${encodeURIComponent(sessionId)}`, {
            method: 'DELETE',
        });
        return res.ok;
    } catch (error) {
        console.error(`Failed to delete history session ${sessionId}`, error);
        return false;
    }
};
