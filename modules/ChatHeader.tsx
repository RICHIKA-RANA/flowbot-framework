import React, { useState, useContext, useEffect, useRef } from 'react';
import ThemeContext from '@/contexts/ThemeContext';
import PanelIcon from '@/assets/svgs/PanelIcon';
import ChevronDownIcon from '@/assets/svgs/ChevronDownIcon';
import LogoutIcon from '@/assets/svgs/LogoutIcon';
import ShareIcon from '@/assets/svgs/ShareIcon';
import { useChatbot } from '@/hooks/useChatbot';
import { ToastContainer, toast } from 'react-toastify';

interface ChatHeaderProps {
    drawerOpen?: boolean;
    onDrawerToggle?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ drawerOpen = false, onDrawerToggle }) => {
    const { JSModule, styles } = useContext(ThemeContext);
    const headerRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [user, setUser] = useState<{
        name?: string;
        email?: string;
    }>({});
    const { handleLogout } = useChatbot();

    const handleShareChat = async () => {
        // TODO: add api call here to get the public url for the chat;
        toast.success("Public link copied to your clipboard")
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target as Node)
            ) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/auth/session")
            .then((r) => r.json())
            .then((data: { name?: string; email?: string }) => {
                if (cancelled) return;
                setUser(data);
            })
            .catch(() => { });

        return () => {
            cancelled = true;
        };
    }, []);

    // Bot-level override: full custom header HTML
    if (JSModule?.headerPaneHtml) {
        return (
            <div
                ref={headerRef}
                className={styles?.['main-header']}
                dangerouslySetInnerHTML={{ __html: JSModule.headerPaneHtml }}
            />
        );
    }

    return (
        <div className={styles?.['main-header']}>
            <div className={styles?.['header-left']}>
                <button
                    className={styles?.['header-toggle-btn']}
                    //   onClick={}
                    title="Toggle Sidebar"
                >
                    <PanelIcon size={20} stroke={drawerOpen ? '#2563eb' : '#6b7280'} />
                </button>
                <span className={styles?.['header-title']}>AI Document Chat</span>
            </div>

            <div className={styles?.['header-right']}>
                <ToastContainer />
                <div onClick={handleShareChat}>
                    <ShareIcon />
                </div>
                <button
                    className={styles?.['header-toggle-btn']}
                    onClick={onDrawerToggle}
                    title="Toggle Documents"
                >
                    <PanelIcon size={20} stroke={drawerOpen ? '#2563eb' : '#6b7280'} />
                </button>
                <div className={styles["header-user-wrap"]} ref={userMenuRef}>
                    <div
                        className={styles["header-user-pill"]}
                        onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    >
                        <div className={styles?.['header-user-avatar']}>{user.name?.charAt(0).toUpperCase() || "U"}</div>
                        <div className={styles?.['header-user-meta']}>
                            <span className={styles?.['header-user-name']}>{user.name || "User"}</span>
                            <span className={styles?.['header-user-email']}>{user.email || ""}</span>
                        </div>
                        <ChevronDownIcon />
                    </div>

                    {isUserMenuOpen && (
                        <div className={styles["header-dropdown"]}>
                            <button
                                className={`${styles["header-dropdown-item"]} ${styles["danger"]}`}
                                onClick={handleLogout}
                            >
                                <LogoutIcon />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};