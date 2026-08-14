import React, { useState, useContext, useEffect, useRef } from 'react';
import ThemeContext from '@/contexts/ThemeContext';
import PanelIcon from '@/assets/svgs/PanelIcon';
import ChevronDownIcon from '@/assets/svgs/ChevronDownIcon';
import LogoutIcon from '@/assets/svgs/LogoutIcon';
import { useChatbot } from '@/hooks/useChatbot';
import { HeaderProps } from '@/types/admin';


const Header: React.FC <HeaderProps> = ({setSidebarOpen}) => {
    const { JSModule } = useContext(ThemeContext);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [user, setUser] = useState<{
        name?: string;
        email?: string;
    }>({});
    const { handleLogout } = useChatbot();

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
    return (
        <div className="flex justify-between w-full items-center border border-b border-gray-200 bg-white px-4 py-2 gap-1">
            <div className="flex flex-1 min-w-0 items-center gap-4 overflow-hidden">
                <button
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white p-1 transition-all duration-200 hover:border-blue-500 hover:bg-gray-50"
                    title="Toggle Sidebar"
                    onClick={() => {setSidebarOpen((prev) => !prev)}}
                >
                    <PanelIcon size={20} stroke={"#6b7280"} />
                </button>

                <span className="flex-shrink-0 text-base font-semibold text-gray-900">
                    {JSModule?.botName || "AI Document Chat"}
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative" ref={userMenuRef}>
                    <div
                        className="flex cursor-pointer select-none items-center gap-2 rounded-full border border-gray-200 px-2 py-1 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 overflow-visible"
                        onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    >
                        <div className="h-8 w-8 flex justify-center items-center text-center rounded-full text-sm font-semibold text-black border border-black bg-white">
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>

                        <div className="flex flex-col text-left leading-[1.2]">
                            <span className="text-sm font-medium text-gray-700">
                                {user.name || "User"}
                            </span>
                            <span className="text-xs font-normal text-gray-400">
                                {user.email || ""}
                            </span>
                        </div>
                        <ChevronDownIcon />
                    </div>

                    {isUserMenuOpen && (
                        <div className="absolute right-0 top-14 z-[200] min-w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 ">
                            <button
                                className="flex w-full items-center gap-2 bg-transparent px-4 py-2.5 text-left text-sm text-red-500 transition-colors duration-150 hover:bg-gray-50"
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
    )
}

export default Header