import type { NextApiRequest, NextApiResponse } from 'next';
import { makeChain } from '@/utils/makechain';
import dbConnect from '@/config/mongodb';
import { upsertSubscription } from '@/models/subscriptionModel';
import { IUser, upsertUserByEmail } from '@/models/userModel';
import { upsertUserHistory, pushChatEntry } from '@/models/userHistoryModel';
import axios from 'axios';
import { BigQuery } from '@google-cloud/bigquery';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { GoogleAuth } from 'google-auth-library';
const parser = require('@babel/parser');
const generator = require('@babel/generator');
const fs = require('fs-extra');
const FormData = require('form-data');
const json5 = require('json5');
import path from 'path';
const { htmlToText } = require('html-to-text');

export const config = { api: { bodyParser: { sizeLimit: '100mb' } } };

import { SESSION_COOKIE, USER_COOKIE, EMAIL_COOKIE } from '@/pages/api/auth/session';


async function botRequiresAuth(chatBotId: string): Promise<boolean> {
  const loadOpenId = async (id: string) => {
    try {
      const mod: any = await import(`@/configuration/${id}/webapp`);
      return mod?.openid;
    } catch {
      return undefined;
    }
  };
  const openid = (await loadOpenId(chatBotId)) ?? (await loadOpenId('default'));
  return !!(openid?.authorization_endpoint && openid?.client_id);
}

/**
 * Resolve the logged-in user from session cookies.
 * Returns the user doc if email is present, null for anonymous sessions.
 */
async function resolveUser(req: NextApiRequest): Promise<IUser | null> {
    const rawEmail = req.cookies[EMAIL_COOKIE];
    const rawName  = req.cookies[USER_COOKIE];
    const email    = rawEmail ? decodeURIComponent(rawEmail) : null;
    const name     = rawName  ? decodeURIComponent(rawName)  : '';

    if (!email) return null;

    // One user record per person keyed by email.
    // This is idempotent — safe to call on every chat request.
    return upsertUserByEmail(email, name);
}

/**
 * Persists one Q&A pair to user_histories after a successful response.
 * Non-fatal — a DB write failure must never break the chat response.
 */
async function saveChatHistory(
    sessionId: string,
    chatbotId: string,
    user: IUser | null,
    question: string,
    answer: string,
    graphIds: string[]
): Promise<void> {
    try {
        const email  = user?.email  || null;
        const userId = user?._id    || null;

        await upsertUserHistory(sessionId, chatbotId, email, userId);
        await pushChatEntry(sessionId, {
            question,
            answer,
            graphIds: graphIds.filter(Boolean), // drop empty strings
        });
    } catch (err) {
        console.error('saveChatHistory failed (non-fatal):', err);
    }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const {
    question,
    history,
    enablegptfallback,
    session,
    graphIds, 
    reqQuery,
    chainStatus = false,
  } = req.body;
  const chatBotId = String(req.query.chatBotId || 'default');

  await dbConnect();

  //only accept post requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Enforce authentication for bots that have OpenID configured.
  if ((await botRequiresAuth(chatBotId)) && !req.cookies[SESSION_COOKIE]) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = question;
  // const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  try {
    //create chain
    const chain = new makeChain(chatBotId);
    if (chainStatus) {
      const response = await chain.run(question);
      return res.status(200).json(response);
    }

        // Single user record per person — no session-keyed user records any more.
        // Anonymous users (no email cookie) get null; the chat still works, just
        // not linked to a persistent user profile.
        const user = await resolveUser(req);

    const sessionToken = req.cookies[SESSION_COOKIE];
    const headers = {
      ...req.headers,
      ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {}),
    };

        // TODO: when "New Chat" button is implemented, pass the new sessionId from
        //       the frontend so user_histories creates a fresh record for that session.
    return new Promise((resolve) => {
      import(`@/configuration/${chatBotId}/server`)
        .then(async (module) => {
          try {
            const response = await module.start(
              {
                chain,
                axiosInstance: axios,
                user,
                graphIds,
                BigQuery,
                DocumentProcessorServiceClient,
                GoogleAuth,
                fs,
                path,
                FormData,
                reqQuery,
                reqBody: req.body,
                chatBotId,
                headers,
                parser,
                generator,
                json5,
                htmlToText,
              },
              sanitizedQuestion,
            );

            // Save Q&A only when there is an actual question and answer
            if (sanitizedQuestion && response?.text) {
                await saveChatHistory(
                    session,
                    chatBotId,
                    user,
                    sanitizedQuestion,
                    response.text,
                    graphIds || []
                );
            }

            res.status(200).json(response);
            resolve(response);
          } catch (error: any) {
            const upstream = error?.status ?? error?.response?.status;
            const status =
              Number.isInteger(upstream) && upstream >= 400 && upstream <= 599
                ? upstream
                : 500;
            res
              .status(status)
              .json({ error: error?.message || 'Something went wrong' });
            resolve(error);
          }
        })
        .catch((error) => {
    // Fallback to default server config when chatbot-specific one is missing
          import(`@/configuration/default/server`).then(async (module) => {
            const response = await module.start(
              {
                chain,
                axiosInstance: axios,
                user,
                graphIds,
                BigQuery,
                DocumentProcessorServiceClient,
                GoogleAuth,
                fs,
                path,
                FormData,
                reqQuery,
                chatBotId,
                headers,
                parser,
                generator,
                json5,
                htmlToText,
              },
              sanitizedQuestion,
            );

        // Save Q&A — fallback path
        if (sanitizedQuestion && response?.text) {
            await saveChatHistory(
                session,
                chatBotId,
                user,
                sanitizedQuestion,
                response.text,
                graphIds || []
            );
        }

            res.status(200).json(response);
            resolve(response);
          });
        });
    });
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
