import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/config/mongodb';
import { UserHistoryModel } from '@/models/userHistoryModel';

const EMAIL_COOKIE = 'chatbot_email';

// ─── GET /api/history/sessions ────────────────────────────────────────────────
// Returns all sessions for the logged-in user sorted by createdAt desc.
// Each entry contains: sessionId, chatbotId, createdAt, firstQuestion.
//
// ─── GET /api/history/sessions?sessionId=session_xxx ─────────────────────────
// Returns full documents[] and chats[] for the given session.
// Scoped to the logged-in user — cannot read another user's session.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const rawEmail  = req.cookies[EMAIL_COOKIE];
    const email     = rawEmail ? decodeURIComponent(rawEmail) : null;

    if (!email) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    await dbConnect();

    const { sessionId } = req.query;

    // ── Detail: sessionId provided ────────────────────────────────────────────
    if (sessionId && typeof sessionId === 'string') {
        try {
            const record = await UserHistoryModel
                .findOne({ sessionId, email })  // email scope prevents cross-user reads
                .lean();

            if (!record) {
                return res.status(404).json({ error: 'Session not found' });
            }

            const response = {
                sessionId: record.sessionId,
                chatbotId: record.chatbotId,
                email:     record.email,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
                documents: record.documents,
                chats:     record.chats,
            };

            console.log(`[GET /api/history/sessions?sessionId=${sessionId}] user=${email}`);
            console.log(JSON.stringify(response, null, 2));

            return res.status(200).json(response);
        } catch (err: any) {
            console.error(`[GET /api/history/sessions?sessionId=${sessionId}] error:`, err);
            return res.status(500).json({ error: err.message || 'Something went wrong' });
        }
    }

    // ── List: no sessionId — return all sessions for this user ────────────────
    try {
        const sessions = await UserHistoryModel
            .find({ email })
            .sort({ createdAt: -1 })
            .select({
                sessionId: 1,
                chatbotId: 1,
                createdAt: 1,
                chats:     { $slice: 1 },  // only first chat entry for preview
            })
            .lean();

        const response = sessions.map((s) => ({
            sessionId:     s.sessionId,
            chatbotId:     s.chatbotId,
            createdAt:     s.createdAt,
            firstQuestion: s.chats?.[0]?.question || null,
        }));

        console.log(`[GET /api/history/sessions] user=${email} sessions=${response.length}`);
        console.log(JSON.stringify(response, null, 2));

        return res.status(200).json({ sessions: response });
    } catch (err: any) {
        console.error('[GET /api/history/sessions] error:', err);
        return res.status(500).json({ error: err.message || 'Something went wrong' });
    }
}

