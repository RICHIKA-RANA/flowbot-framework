import type { NextApiRequest } from 'next';
import crypto from 'crypto';

export const EMAIL_COOKIE = 'chatbot_email';
const AUTH_SECRET = process.env.SESSION_SECRET || '';
const EMAIL_TOKEN_TTL_SEC = 60 * 60 * 8; // 8h, matches the cookie Max-Age

const hmac = (data: string): string =>
    crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');

// Signs the email into `base64url({email,exp}).hmac` for the chatbot_email cookie.
export const signEmailToken = (email: string): string => {
    const payload = Buffer.from(
        JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + EMAIL_TOKEN_TTL_SEC })
    ).toString('base64url');
    return `${payload}.${hmac(payload)}`;
};

// Returns the email if the signature and expiry are valid, else null.
export const verifyEmailToken = (token: string | undefined): string | null => {
    if (!token || !AUTH_SECRET) return null;
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;

    const expectedSig = hmac(payload);
    const sigBytes = new Uint8Array(Buffer.from(sig));
    const expectedSigBytes = new Uint8Array(Buffer.from(expectedSig));
    if (sigBytes.length !== expectedSigBytes.length || !crypto.timingSafeEqual(sigBytes, expectedSigBytes)) return null;

    try {
        const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!email || typeof exp !== 'number' || exp < Math.floor(Date.now() / 1000)) return null;
        return email as string;
    } catch {
        return null;
    }
};

export const getVerifiedEmail = (req: NextApiRequest): string => {
    const email = verifyEmailToken(req.cookies[EMAIL_COOKIE]);
    if (!email) throw { status: 401, message: 'Session expired, please log in again' };
    return email;
};