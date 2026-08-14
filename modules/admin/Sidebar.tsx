import React from 'react';
import { ChevronsLeft, MessageSquare, Settings } from 'lucide-react';
import { SidebarProps } from '@/types/admin';

const Sidebar: React.FC<SidebarProps> = ({
    setSidebarOpen,
    setOpenTab,
    openTab,
}) => {
    return (
        <aside className="relative w-60 shrink-0 border-r border-slate-200 bg-white">
            <div className="px-4 pt-9">
                <div className="mb-3 px-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Admin
                </div>

                <button
                    type="button"
                    onClick={() => setOpenTab('feedback')}
                    className={`flex h-10 w-full items-center gap-4 rounded-lg px-4 text-sm font-medium ${
                        openTab === 'feedback'
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <MessageSquare className="h-[17px] w-[17px]" />
                    Feedback
                </button>

                <button
                    type="button"
                    onClick={() => setOpenTab('settings')}
                    className={`mt-2 flex h-10 w-full items-center gap-4 rounded-lg px-4 text-sm font-medium ${
                        openTab === 'settings'
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <Settings className="h-[18px] w-[18px]" />
                    Settings
                </button>
            </div>

            <button
                type="button"
                className="absolute bottom-8 left-8 flex items-center gap-3 text-sm text-slate-700"
                onClick={() => setSidebarOpen((prev) => !prev)}
            >
                <ChevronsLeft className="h-4 w-4" />
                Collapse
            </button>
        </aside>
    );
};

export default Sidebar;