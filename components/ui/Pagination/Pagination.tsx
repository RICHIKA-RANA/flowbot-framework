import React from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
} from 'lucide-react';
import { PaginationProps } from '@/types/pagination';


const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [10, 20, 50, 100],
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const startItem =
        totalItems === 0
            ? 0
            : (currentPage - 1) * itemsPerPage + 1;

    const endItem = Math.min(
        currentPage * itemsPerPage,
        totalItems
    );

    const handlePrevious = () => {
        onPageChange(Math.max(1, currentPage - 1));
    };

    const handleNext = () => {
        onPageChange(Math.min(totalPages, currentPage + 1));
    };

    const getVisiblePages = () => {
        if (totalPages <= 5) {
            return Array.from(
                { length: totalPages },
                (_, index) => index + 1
            );
        }
        const pages = new Set<number>();
        pages.add(1);
        pages.add(totalPages);

        for (
            let page = Math.max(2, currentPage - 1);
            page <= Math.min(totalPages - 1, currentPage + 1);
            page++
        ) {
            pages.add(page);
        }

        return Array.from(pages).sort((a, b) => a - b);
    };

    const visiblePages = getVisiblePages();
    return (
        <div className="flex h-[74px] items-center justify-between px-5">
            <span className="text-xs text-slate-700">
                Showing {startItem} to {endItem} of {totalItems} items
            </span>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    disabled={currentPage === 1 || totalPages === 0}
                    onClick={handlePrevious}
                    className="rounded-md p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                {visiblePages.map((page, index) => {
                    const previousPage = visiblePages[index - 1];
                    return (
                        <React.Fragment key={page}>
                            {previousPage && page - previousPage > 1 && (
                                <span className="px-1 text-slate-500">
                                    ...
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={() => onPageChange(page)}
                                className={`h-8 w-8 rounded-md text-xs font-medium ${currentPage === page
                                        ? 'border border-blue-500 text-blue-600'
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {page}
                            </button>
                        </React.Fragment>
                    );
                })}

                <button
                    type="button"
                    disabled={
                        currentPage === totalPages ||
                        totalPages === 0
                    }
                    onClick={handleNext}
                    className="rounded-md p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <div className="relative">
                <select
                    value={itemsPerPage}
                    onChange={(event) =>
                        onItemsPerPageChange?.(
                            Number(event.target.value)
                        )
                    }
                    disabled={!onItemsPerPageChange}
                    className="h-9 appearance-none rounded-md border border-slate-200 bg-white py-0 pl-3 pr-8 text-xs font-medium text-slate-800 outline-none hover:bg-slate-50 disabled:cursor-default"
                >
                    {itemsPerPageOptions.map((option) => (
                        <option key={option} value={option}>
                            {option} / page
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
            </div>
        </div>
    );
};

export default Pagination;