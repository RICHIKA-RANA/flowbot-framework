import React, { useEffect, useMemo, useState } from 'react';
import FeedbackStats from './FeedbackStats';
import FeedbackFilters from './FeedbackFilters';
import { FeedbackTab, FeedbackFiltersState } from '@/types/feedback';
import FeedbackList from './FeedbackList';
import FeedbackDetails from './FeedbackDetails';
import { IFeedback } from '@/models/feedback';
import Pagination from '@/components/ui/Pagination/Pagination';
import { getAllFeedbacks } from '@/apiRequests';

const FeedbackPage: React.FC = () => {
    const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
    const [activeTab, setActiveTab] = useState<FeedbackTab>('All Feedback');
    const [selectedFeedback, setSelectedFeedback] = useState<IFeedback | null>();
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<FeedbackFiltersState>({
        category: 'all',
        rating: 'all',
        sort: 'newest',
    });

    const filteredFeedback = useMemo(() => {
        let result = [...feedbacks];
        if (filters.category !== 'all') {
            result = result.filter(
                (feedback) => feedback.category === filters.category
            );
        }
        if (filters.rating !== 'all') {
            const selectedRating = Number(filters.rating.charAt(0));
            result = result.filter(
                (feedback) => feedback.rating === selectedRating
            );
        }
        if (filters.sort === 'oldest') {
            result.reverse();
        }

        return result;
    }, [feedbacks, activeTab, filters]);

    const handleFilterChange = ( key: keyof FeedbackFiltersState, value: string ) => {
        setFilters((previous) => ({
            ...previous,
            [key]: value,
        }));

        setCurrentPage(1);
    };

    const handleRefresh = () => { };
    const handleResolve = () => { };
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const fetchFeedbacks = async () => {
        try {
            const response = await getAllFeedbacks();
            if (response) setFeedbacks(response);
        } catch (error) {
            console.error('Failed to fetch feedbacks:', error);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);
    return (
        <main className="min-w-0 flex-1 overflow-hidden">
            <div className="mx-auto max-w-[1290px] px-6 pb-8 pt-6">
                <div>
                    <h1 className="text-[21px] font-semibold text-slate-900">
                        Feedback
                    </h1>

                    <p className="mt-1 text-sm text-slate-600">
                        View and manage all feedback submitted by users.
                    </p>
                </div>
                <FeedbackStats
                    total={feedbacks.length}
                    averageRating={0}
                    unread={feedbacks.length}
                    resolved={0}
                />
                <FeedbackFilters
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                        setActiveTab(tab);
                        setCurrentPage(1);
                    }}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onRefresh={handleRefresh}
                    totalCount={feedbacks.length}
                    unreadCount={feedbacks.length}
                    resolvedCount={0}
                />
                <div className="mt-4 grid grid-cols-[minmax(0,1.55fr)_minmax(390px,0.85fr)] gap-5">
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <FeedbackList
                            feedbacks={filteredFeedback}
                            selectedFeedbackId={selectedFeedback?.id}
                            onSelect={setSelectedFeedback}
                        />
                        {
                            filteredFeedback.length > 0 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={filteredFeedback.length}
                                    itemsPerPage={10}
                                    onPageChange={handlePageChange}
                                />
                            )
                        }
                    </div>

                    {selectedFeedback && (
                        <FeedbackDetails
                            feedback={selectedFeedback}
                            onClose={() => setSelectedFeedback(null)}
                            onResolve={handleResolve}
                        />
                    )}
                </div>
            </div>
        </main>
    );
};

export default FeedbackPage;