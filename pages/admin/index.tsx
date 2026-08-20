import React, { useState } from 'react';

import Header from '@/modules/admin/Header';
import FeedbackPage from '@/modules/admin/feedback';
import Layout from '@/components/layout';
import Sidebar from '@/modules/admin/Sidebar';
import SettingsPage from '@/modules/admin/settings';

const AdminPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openTab, setOpenTab] = useState('feedback');

    return (
        <Layout>
            <Header setSidebarOpen={setSidebarOpen} />
            <div className="flex min-h-[calc(100vh-68px)] bg-white">
                {sidebarOpen && (
                    <Sidebar
                        openTab={openTab}
                        setOpenTab={setOpenTab}
                        setSidebarOpen={setSidebarOpen}
                    />
                )}

                {openTab === 'feedback' ? (
                    <FeedbackPage />
                ) : (
                    <SettingsPage />
                )}
            </div>
        </Layout>
    );
};

export default AdminPage;