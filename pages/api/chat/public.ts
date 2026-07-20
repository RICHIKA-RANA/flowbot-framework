import type { NextApiRequest, NextApiResponse } from 'next';
import { createPublicChat, getPublicChatById } from '@/models/publicChat';
import { getHistoryDocumentBySessionId } from '@/models/userHistoryModel';
import { getVerifiedEmail } from '@/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // generate a public chat url
    if (req.method === 'POST') {
      const { sessionId } = req.body;
      const email = getVerifiedEmail(req)
      const response = await createPublicChat(String(sessionId), String(email));
      return res.status(200).json(response);

    // retrieve chathistory with the public chat id;
    } else if (req.method === 'GET') {
      const { publicChatId } = req.query;
      const publicChat = await getPublicChatById(String(publicChatId));

      if (!publicChat) {
        return res.status(404).json({
          error: 'Public chat not found',
        });
      }
      const userHistoryDoc = await getHistoryDocumentBySessionId(publicChat?.sessionId);

      if (!userHistoryDoc) {
        return res.status(404).json({
          error: 'Chat history not found',
        });
      }

      const response = {
        publicChatId,
        sessionId: publicChat.sessionId,
        sharedAt: publicChat.publishedAt,
        documents: userHistoryDoc.documents.filter(
          (doc) => doc.uploadedAt <= publicChat.publishedAt,
        ),
        chats: userHistoryDoc.chats.filter(
          (chat) => chat.askedAt <= publicChat.publishedAt,
        ),
      };

      return res.status(200).json(response);

    // blocking any other http methods;
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Something went wrong' });
  }
}
