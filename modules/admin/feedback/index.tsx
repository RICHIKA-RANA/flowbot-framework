import React, { useEffect, useMemo, useState } from 'react';
import FeedbackStats from './FeedbackStats';
import FeedbackFilters from './FeedbackFilters';
import { FeedbackTab, FeedbackFiltersState } from '@/types/feedback';
import FeedbackList from './FeedbackList';
import FeedbackDetails from './FeedbackDetails';
import { IFeedback } from '@/models/feedback';
import Pagination from '@/components/ui/Pagination/Pagination';
import { getAllFeedbacks } from '@/apiRequests';
import { Loader } from '@/components/ui';

const FEEDBACK_PER_PAGE = 10;

const FeedbackPage: React.FC = () => {
    const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [totalNumberOfFeedbacks, setTotalNumberOfFeedbacks] = useState<number>(0);
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
    }, [feedbacks, filters]);

    const handleFilterChange = (key: keyof FeedbackFiltersState, value: string) => {
        setFilters((previous) => ({
            ...previous,
            [key]: value,
        }));

        setCurrentPage(1);
    };

    const handleRefresh = () => {
        setFilters({
            category: 'all',
            rating: 'all',
            sort: 'newest',
        });
        setCurrentPage(1);
        fetchFeedbacks(0, FEEDBACK_PER_PAGE);
    };

    // TODO: 
    const handleResolve = () => { };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        const skip = (page - 1) * FEEDBACK_PER_PAGE
        fetchFeedbacks(skip, FEEDBACK_PER_PAGE)
    };

    const fetchFeedbacks = async (
        skip: number = 0,
        limit: number = FEEDBACK_PER_PAGE
    ) => {
        setLoading(true);
        setError(null);

        try {
            const response = await getAllFeedbacks(skip, limit);
            if (response?.success === false) {
                setError(response.errorMessage || 'Failed to fetch feedbacks.');
                return;
            }

            if (response?.feedbacks) {
                setFeedbacks(response.feedbacks);
                setTotalNumberOfFeedbacks(response.total);
            }
        } catch (error) {
            console.error('Failed to fetch feedbacks:', error);
            setError('Something went wrong while fetching feedbacks.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    return (
        <main className="min-w-0 flex-1 overflow-hidden">
            {
                error ? (
                    <div className="flex min-h-[400px] items-center justify-center px-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-red-600">
                                {error}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto max-w-[1290px] px-6 pb-8 pt-6">
                        <div>
                            <h1 className="text-[21px] font-semibold text-slate-900">
                                Feedback
                            </h1>

                            <p className="mt-1 text-sm text-slate-600">
                                View and manage all feedback submitted by users.
                            </p>
                        </div>
                        {
                            loading ? (
                                <Loader />
                            ) : (
                                <>
                                    <FeedbackStats
                                        total={totalNumberOfFeedbacks}
                                        averageRating={0}
                                        unread={totalNumberOfFeedbacks}
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
                                        totalCount={totalNumberOfFeedbacks}
                                        unreadCount={totalNumberOfFeedbacks}
                                        resolvedCount={0}
                                    />
                                    <div className="mt-4 grid grid-cols-[minmax(0,1.55fr)_minmax(390px,0.85fr)] gap-5">
                                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                            <FeedbackList
                                                feedbacks={filteredFeedback}
                                                selectedFeedbackId={selectedFeedback?._id}
                                                onSelect={setSelectedFeedback}
                                            />
                                            {filteredFeedback.length > 0 && (
                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalItems={totalNumberOfFeedbacks}
                                                    itemsPerPage={FEEDBACK_PER_PAGE}
                                                    onPageChange={handlePageChange}
                                                />
                                            )}
                                        </div>

                                        {selectedFeedback && (
                                            <FeedbackDetails
                                                feedback={selectedFeedback}
                                                onClose={() => setSelectedFeedback(null)}
                                                onResolve={handleResolve}
                                            />
                                        )}
                                    </div>
                                </>
                            )
                        }
                    </div>
                )
            }
        </main>
    );
};

export default FeedbackPage;