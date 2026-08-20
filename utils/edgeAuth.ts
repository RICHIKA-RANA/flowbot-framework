export const verifyEmailToken = async (token: string | undefined): Promise<string | null> => {
    if (!token) return null;

    const AUTH_SECRET = process.env.SESSION_SECRET || '';
    if (!AUTH_SECRET) return null;

    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;

    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(AUTH_SECRET),
            {
                name: 'HMAC',
                hash: 'SHA-256',
            },
            false,
            ['verify']
        );

        // base64url -> Uint8Array
        const signature = Uint8Array.from(
            atob(
                sig.replace(/-/g, '+').replace(/_/g, '/') +
                    '='.repeat((4 - (sig.length % 4)) % 4)
            ),
            (char) => char.charCodeAt(0)
        );

        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            signature,
            encoder.encode(payload)
        );
        if (!isValid) return null;

        const decodedPayload = JSON.parse(
            new TextDecoder().decode(
                Uint8Array.from(
                    atob(
                        payload.replace(/-/g, '+').replace(/_/g, '/') +
                            '='.repeat(
                                (4 - (payload.length % 4)) % 4
                            )
                    ),
                    (char) => char.charCodeAt(0)
                )
            )
        );
        const { email, exp } = decodedPayload;

        if ( !email || typeof exp !== 'number' || exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return email;
    } catch {
        return null;
    }
};