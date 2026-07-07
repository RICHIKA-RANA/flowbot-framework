import type { NextApiRequest } from 'next';
import { SESSION_COOKIE } from '@/pages/api/auth/session';

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

/**
 * Verifies the Google access token from the session cookie and returns the
 * email address that Google associates with it.
 *
 * Throws an object { status, message } if the token is missing or invalid so
 * API routes can return the right HTTP status directly.
 *
 * Usage in any API route:
 *   const email = await getVerifiedEmail(req);
 */
export async function getVerifiedEmail(req: NextApiRequest): Promise<string> {
    const token = req.cookies[SESSION_COOKIE];

    if (!token) {
        throw { status: 401, message: 'Not authenticated' };
    }

    const response = await fetch(
        `${GOOGLE_TOKENINFO_URL}?access_token=${encodeURIComponent(token)}`
    );

    if (!response.ok) {
        // Token is expired or invalid
        throw { status: 401, message: 'Session expired, please log in again' };
    }

    const data = await response.json();

    if (!data.email) {
        throw { status: 401, message: 'Could not verify identity' };
    }

    return data.email as string;
}