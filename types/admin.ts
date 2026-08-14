import { Dispatch, SetStateAction } from 'react';

export interface HeaderProps {
    setSidebarOpen: Dispatch<SetStateAction<boolean>>;
}

export interface SidebarProps {
    openTab: string;
    setOpenTab: Dispatch<SetStateAction<string>>;
    setSidebarOpen: Dispatch<SetStateAction<boolean>>;
}