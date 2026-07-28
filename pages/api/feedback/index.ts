import type { NextApiRequest, NextApiResponse } from 'next';
import { createFeedback, getFeedbacks } from '@/models/feedback';
import { getVerifiedEmail } from '@/utils/auth';
import { FeedbackPayload } from '@/types/feedback';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    try {
        if (req.method === 'POST') {
            const email = getVerifiedEmail(req);
            
            const {
                rating,
                category,
                message,
                sessionId
            }: FeedbackPayload = req.body;

            if (!message?.trim()) {
                return res.status(400).json({
                    error: 'Feedback message is required',
                });
            }

            const feedback = await createFeedback(
                {
                    email,
                    rating,
                    category,
                    message,
                    sessionId,
                    createdAt: new Date(),

                }
            )

            return res.status(201).json(feedback);
        } else if (req.method === 'GET') {
            const feedbacks = await getFeedbacks()
            return res.status(200).json(feedbacks);
        }

        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error: any) {
        return res.status(500).json({
            error: error.message || 'Something went wrong',
        });
    }
}