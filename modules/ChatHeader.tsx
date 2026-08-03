import React, { useState, useContext, useEffect, useRef } from 'react';
import ThemeContext from '@/contexts/ThemeContext';
import PanelIcon from '@/assets/svgs/PanelIcon';
import ChevronDownIcon from '@/assets/svgs/ChevronDownIcon';
import LogoutIcon from '@/assets/svgs/LogoutIcon';
import ShareIcon from '@/assets/svgs/ShareIcon';
import { useChatbot } from '@/hooks/useChatbot';
import { toast } from 'react-toastify';
import { getPublicChatLink, submitFeedback } from '@/apiRequests';
import { getCurrentSessionId } from '@/utils/sessionJobs';
import config from '@/config/constants';
import { ChatHeaderProps } from '@/types/chat';
import { Menu } from 'lucide-react';
import CustomModal from '@/components/ui/customModal';
import FeedbackForm from '@/components/FeedbackForm';
import { FeedbackPayload } from '@/types/feedback';

export const ChatHeader: React.FC<ChatHeaderProps> = ({ drawerOpen = false, onDrawerToggle, messages }) => {
    const { JSModule, styles } = useContext(ThemeContext);
    const headerRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [canShareChat, setCanShareChat] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [user, setUser] = useState<{
        name?: string;
        email?: string;
    }>({});
    const { handleLogout } = useChatbot();

    // if messages contain at-least one message from user and bot;
    useEffect(() => {
        const hasUserMessage = messages?.some((msg) => msg.type === "userMessage") || false;
        const hasBotMessage = messages?.some((msg) => msg.type === "apiMessage") || false;

        setCanShareChat(hasUserMessage && hasBotMessage);
    }, [messages, messages?.length]);

    const copyToClipboard = async (text: string) => {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return;
        }

        // to support older browsers, where the clipboard api might not be available;
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        return;
    };

    const handleShareChat = async () => {
        const sessionId = getCurrentSessionId()
        const response = await getPublicChatLink(sessionId)
        if (response?.status == 200) {
            const publicChatId = response.data._id;
            const publiclyShareableURL = `${config.HOST}/share/${publicChatId}`
            await copyToClipboard(publiclyShareableURL)
            toast.success("Public link copied to your clipboard")
        } else {
            toast.error("Unable to share chat. Please try again in a moment.")
        }
    }

    const handleFeedback = async (action?: string, feedback?: FeedbackPayload) => {
        if (action === "close modal" || !feedback) {
            setFeedbackModalOpen(false);
            return;
        }

        const response = await submitFeedback(feedback);
        if (response?.status === 201) {
            // closing the modal only if the feedback is successfully submitted
            // if  anything goes wrong, modal would stay as opened - user can chose to close or retry
            setFeedbackModalOpen(false);
            toast.success("Thanks for your feedback")
        } else {
            toast.error("Sorry, something went wrong in submitting feedback")
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(target)
            ) {
                setIsUserMenuOpen(false);
            }
            if (
                menuRef.current &&
                !menuRef.current.contains(target)
            ) {
                setShowMenu(false);
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
            {
                feedbackModalOpen && (
                    <CustomModal
                        id={"feedback"}
                        title={"Feedback"}
                        onClose={handleFeedback}
                        status={feedbackModalOpen}
                        showOptionsButton={false}
                    >
                        <FeedbackForm
                            onSubmit={handleFeedback}
                        />
                    </CustomModal>
                )
            }
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
                {canShareChat && (
                    <div onClick={handleShareChat}>
                        <ShareIcon />
                    </div>
                )}
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
                <div
                    ref={menuRef}
                    className={styles["header-menu-wrapper"]}
                >
                    <button
                        className={styles["header-menu-btn"]}
                        onClick={() => setShowMenu((prev) => !prev)}
                        title="Header Menu"
                    >
                        <Menu size={24} stroke={showMenu ? '#2563eb' : '#6b7280'} />
                    </button>

                    {showMenu && (
                        <div className={styles["header-menu-dropdown"]}>
                            <button
                                className={styles["header-menu-dropdown-item"]}
                                onClick={() => {
                                    setFeedbackModalOpen(true);
                                    setShowMenu(false);
                                }}
                            >
                                Share Feedback
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};