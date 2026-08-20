import React from 'react';
import { CalendarDays, ChevronDown, RefreshCw } from 'lucide-react';
import { FeedbackFiltersProps, FeedbackTab, SelectFilterConfig, feedbackCategories, feedbackRatings, feedbackSortOptions } from '@/types/feedback';

const FeedbackFilters: React.FC<FeedbackFiltersProps> = ({
    activeTab,
    onTabChange,
    filters,
    onFilterChange,
    onRefresh,
    totalCount,
    unreadCount,
    resolvedCount,
}) => {
    const tabs: {
        label: FeedbackTab;
        count: number;
        showDot?: boolean;
    }[] = [
            {
                label: 'All Feedback',
                count: totalCount,
            },
            {
                label: 'Unread',
                count: unreadCount,
                showDot: true,
            },
            {
                label: 'Resolved',
                count: resolvedCount,
            },
        ];

    const selectFilters: SelectFilterConfig[] = [
        {
            label: 'Category',
            value: filters.category,
            options: [{label: "All Categories", value: "all"}, ...feedbackCategories],
            className: 'w-[150px]',
            key: 'category',
        },
        {
            label: 'Rating',
            value: filters.rating,
            options: feedbackRatings,
            className: 'w-[150px]',
            key: 'rating',
        },
        {
            label: 'Sort by',
            value: filters.sort,
            options: feedbackSortOptions,
            className: 'w-[165px]',
            key: 'sort',
        },
    ];

    return (
        <div className="mt-5 flex items-center gap-4">
            <div className="flex h-10 shrink-0 items-center rounded-lg border border-slate-200 bg-white p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        type="button"
                        onClick={() => onTabChange(tab.label)}
                        className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition ${activeTab === tab.label
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-800 hover:bg-slate-50'
                            }`}
                    >
                        {tab.label}
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {tab.count}
                        </span>
                        {tab.showDot && (
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        )}
                    </button>
                ))}
            </div>

            <div className="ml-auto flex items-center gap-3">
                <button
                    type="button"
                    className="flex h-12 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left hover:bg-slate-50"
                >
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-slate-600" />
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-700" />
                </button>

                {selectFilters.map((filter) => (
                    <div
                        key={filter.key}
                        className={`relative flex h-12 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 ${filter.className}`}
                    >
                        <div className="min-w-0">
                            <div className="text-[11px] text-slate-500">
                                {filter.label}
                            </div>
                            <select
                                value={filter.value}
                                onChange={(event) =>
                                    onFilterChange(
                                        filter.key,
                                        event.target.value,
                                    )
                                }
                                className="w-full appearance-none bg-transparent pr-5 text-xs font-medium text-slate-900 outline-none"
                            >
                                {filter.options.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-700" />
                    </div>
                ))}

                <button
                    type="button"
                    onClick={onRefresh}
                    className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCw className="h-[18px] w-[18px]" />
                </button>
            </div>
        </div>
    );
};

export default FeedbackFilters;