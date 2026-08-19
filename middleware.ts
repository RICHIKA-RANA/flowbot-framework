import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/middlewares/adminAuth';

export async function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/admin')) {
        return adminAuth(request);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
    ],
};