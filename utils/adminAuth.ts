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