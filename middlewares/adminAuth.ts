import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/utils/edgeAuth';
import { isAdmin } from '@/utils/adminAuth';
import { EMAIL_COOKIE } from '@/utils/auth';

export async function adminAuth(request: NextRequest) {
    const token = request.cookies.get(EMAIL_COOKIE)?.value;
    const email = await verifyEmailToken(token);

    if (!email || !isAdmin(email)) {
        return NextResponse.redirect(
            new URL('/', request.url)
        );
    }

    return NextResponse.next();
}