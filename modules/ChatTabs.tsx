import React, { useEffect } from 'react'
import { X } from 'lucide-react';
import { updateSessionStatus } from '@/apiRequests';
import { ChatTabsProps } from '@/types/chat';

const ChatTabs: React.FC<ChatTabsProps> = ({ messages, sessions, setSessions, activeSessionId, onSelectSession, onNewChat }) => {

    const handleCloseTab = async (sessionId: string) => {
        await updateSessionStatus(sessionId, 'INACTIVE')
        setSessions((prevTabs) => {
            const updatedTabs = prevTabs.filter(
                (tab) => tab.sessionId !== sessionId
            );
            if (activeSessionId === sessionId) {
                const activeTabs = updatedTabs.filter(
                    (tab) => tab.sessionStatus === 'ACTIVE'
                );

                onSelectSession(
                    activeTabs[0]?.sessionId ?? null
                );
            }

            return updatedTabs;
        });
    };

    useEffect(() => {
        if (!messages || !messages.length) return;
        const firstUserMessage = messages.find(m => m.type === "userMessage");
        if (!firstUserMessage) return;

        setSessions(prev =>
            prev.map(session =>
                session.sessionId === activeSessionId &&
                    !session.firstQuestion
                    ? {
                        ...session,
                        firstQuestion: firstUserMessage.message,
                    }
                    : session
            )
        );
    }, [messages, activeSessionId]);

    const activeSessions = sessions
        .toReversed()
        .filter(tab => tab.sessionStatus === 'ACTIVE');

    return (
        <div className="flex flex-1 min-w-0 items-center overflow-hidden">
            <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar ">
                <div className="flex w-max items-center gap-1">
                    {activeSessions.map((tab) => {
                        const isLastActiveSession = activeSessions.length === 1;
                        return (
                            <div
                                key={tab.sessionId}
                                onClick={() => onSelectSession(tab.sessionId)}
                                className={`group relative flex h-10 shrink-0 items-center gap-2 p-2 text-sm transition-colors border
                                    ${activeSessionId === tab.sessionId
                                        ? "bg-white font-medium border border-gray-300 border-b-0 rounded-t-md rounded-b-none hover:bg-zinc-100"
                                        : "bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-400"
                                    }
                                  `}
                            >
                                <span className="flex-1 truncate text-left">{!tab.firstQuestion ? "New Chat" : tab.firstQuestion}</span>
                                <button
                                    disabled={!tab.firstQuestion || isLastActiveSession}
                                    className={`flex h-4 w-4 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCloseTab(tab.sessionId);
                                    }}
                                >
                                    <X size={16} stroke='black' />
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 2. FIXED "+" BUTTON (Outside the scroll div so it stays visible) */}
            <button
                className="ml-1 flex h-9 w-9 p-1 shrink-0 text-center justify-center items-center bg-gray-300 "
                title="New Tab"
                onClick={() => onNewChat()}
            >
                +
            </button>
        </div>
    )
}

export default ChatTabs