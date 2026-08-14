import { GetServerSidePropsContext } from 'next';

export const isAdmin = (email?: string): boolean => {
    if (!email) {
        return false;
    }

    const adminEmails =
        process.env.ADMIN_EMAILS
            ?.split(',')
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean) ?? [];

    return adminEmails.includes(email.trim().toLowerCase());
};

export const requireAdmin = async (
    context: GetServerSidePropsContext
) => {
    const { req } = context;

    try {
        const protocol =
            process.env.NODE_ENV === 'development'
                ? 'http'
                : 'https';

        const host = req.headers.host;

        const response = await fetch(
            `${protocol}://${host}/api/auth/session`,
            {
                headers: {
                    cookie: req.headers.cookie ?? '',
                },
            }
        );

        if (!response.ok) {
            return {
                redirect: {
                    destination: '/login',
                    permanent: false,
                },
            };
        }

        const session = await response.json();
        const email = session?.email;

        // User is not logged in
        if (!email) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false,
                },
            };
        }

        // User is logged in but is not an admin
        if (!isAdmin(email)) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false,
                },
            };
        }

        return {
            props: {},
        };
    } catch (error: any) {
        console.error('Failed to verify admin access:', error?.message);

        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        };
    }
};