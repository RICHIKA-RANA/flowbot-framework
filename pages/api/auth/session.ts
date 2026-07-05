import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/config/mongodb';
import { upsertUserByEmail } from '@/models/userModel';

const SESSION_COOKIE = 'chatbot_session';
const USER_COOKIE = 'chatbot_user';
const EMAIL_COOKIE = 'chatbot_email';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function buildSetCookieHeader(name: string, value: string, maxAge: number): string {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return `${name}=${value}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

// Security boundary: the OAuth token endpoint is the only place the server ever
// sends the authorization code together with NEXT_GOOGLE_CLIENT_SECRET. Because
// the endpoint arrives in the request body, an attacker could otherwise point it
// at their own server and exfiltrate the client secret (and use the route for
// SSRF). We therefore only ever talk to an explicit allowlist of HTTPS hosts.
function getAllowedTokenHosts(): string[] {
    return (process.env.OAUTH_TOKEN_ENDPOINT_ALLOWLIST || '')
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean);
}

function isAllowedTokenEndpoint(endpoint: unknown): endpoint is string {
    if (typeof endpoint !== 'string') return false;
    try {
        const url = new URL(endpoint);
        return (
            url.protocol === 'https:' &&
            getAllowedTokenHosts().includes(url.hostname.toLowerCase())
        );
    } catch {
        return false;
    }
}

// Extract the display name and email from a Google ID token (JWT) without
// verifying the signature — used only for showing the signed-in user in the UI.
function getUserFromIdToken(idToken?: string): { name: string; email: string } {
    if (!idToken) return { name: '', email: '' };
    try {
        const payload = JSON.parse(
            Buffer.from(idToken.split('.')[1], 'base64').toString('utf8'),
        );
        return {
            name: payload.name || payload.email || '',
            email: payload.email || '',
        };
    } catch {
        return { name: '', email: '' };
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'GET') {
            const token = req.cookies[SESSION_COOKIE];
            const rawName = req.cookies[USER_COOKIE];
            const rawEmail = req.cookies[EMAIL_COOKIE];
            const name = rawName ? decodeURIComponent(rawName) : '';
            const email = rawEmail ? decodeURIComponent(rawEmail) : '';
            return res.status(200).json({ isLoggedIn: !!token, name, email });
        }

        // ── POST — exchange authorization code for tokens ─────────────────────
        if (req.method === 'POST') {
            const { code, tokenEndpoint, clientId, redirectUri } = req.body || {};

            if (!code || !tokenEndpoint || !clientId || !redirectUri) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Never send the authorization code or client secret to an
            // arbitrary, client-supplied URL (SSRF / secret exfiltration).
            if (!isAllowedTokenEndpoint(tokenEndpoint)) {
                console.error('Blocked disallowed token endpoint:', tokenEndpoint);
                return res.status(400).json({ error: 'Invalid token endpoint' });
            }

            const clientSecret = process.env.CLIENT_SECRET;

            const params: Record<string, string> = {
                grant_type: 'authorization_code',
                client_id: clientId,
                code,
                redirect_uri: redirectUri,
            };
            if (clientSecret) params.client_secret = clientSecret;

            const tokenResponse = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(params),
            });

            if (!tokenResponse.ok) {
                const detail = await tokenResponse.json().catch(() => ({}));
                console.error('Token exchange failed:', detail);
                return res.status(401).json({ error: 'Token exchange failed', detail });
            }

            const { access_token, id_token } = await tokenResponse.json();
            const { name: displayName, email } = getUserFromIdToken(id_token);

            // ── Write user to MongoDB right after successful token exchange ────
            // This is the earliest point we have a confirmed identity.
            // upsertUserByEmail creates the record if it doesn't exist yet, or
            // updates the name if it does (e.g. user changed their Google display name).
            if (email) {
                try {
                    await dbConnect();
                    const savedUser = await upsertUserByEmail(email, displayName);
                    console.log('#############################################')
                    console.log('User upserted:', savedUser._id,savedUser.email)
                } catch (dbErr) {
                    // Non-fatal — log and continue. The session cookie is still set
                    // so the user can keep using the app; we'll retry on next login.
                    console.error('Failed to upsert user in MongoDB after login:', dbErr);
                }
            }

            // Set the three HttpOnly session cookies
            res.setHeader('Set-Cookie', [
                buildSetCookieHeader(SESSION_COOKIE, access_token, SESSION_MAX_AGE),
                buildSetCookieHeader(USER_COOKIE, encodeURIComponent(displayName), SESSION_MAX_AGE),
                buildSetCookieHeader(EMAIL_COOKIE, encodeURIComponent(email), SESSION_MAX_AGE),
            ]);
            return res.status(200).json({ success: true });
        }

        // ── DELETE — clear session cookies (logout) ───────────────────────────
        if (req.method === 'DELETE') {
            res.setHeader('Set-Cookie', [
                buildSetCookieHeader(SESSION_COOKIE, '', 0),
                buildSetCookieHeader(USER_COOKIE, '', 0),
                buildSetCookieHeader(EMAIL_COOKIE, '', 0),
            ]);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Session handler error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
