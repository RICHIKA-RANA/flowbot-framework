import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/config/mongodb';
import { upsertUserHistory, pushDocumentEntry } from '@/models/userHistoryModel';
import UserModel from '@/models/userModel';

const EMAIL_COOKIE = 'chatbot_email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { sessionId, chatbotId, graphId, name, size, type, jobId } = req.body || {};

    if (!sessionId || !graphId || !name) {
        return res.status(400).json({ error: 'sessionId, graphId and name are required' });
    }

    try {
        await dbConnect();

        // Read user identity from the session cookie (set at Google login).
        // Falls back to null for anonymous / non-logged-in users.
        const rawEmail = req.cookies[EMAIL_COOKIE];
        const email    = rawEmail ? decodeURIComponent(rawEmail) : null;

        // Resolve the users._id for the foreign key if we have an email
        let userId = null;
        if (email) {
            const user = await UserModel.findOne({ email }).select('_id').lean();
            if (user) userId = user._id;
        }

        // Ensure the history document for this session exists, then push the doc entry
        await upsertUserHistory(sessionId, chatbotId || '', email, userId);
        await pushDocumentEntry(sessionId, { name, size: size || 0, type: type || '', jobId: jobId || '', graphId });

        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error('Failed to record document upload in history:', err);
        return res.status(500).json({ error: err.message || 'Something went wrong' });
    }
}