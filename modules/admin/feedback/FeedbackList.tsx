import React from 'react';
import { ChevronRight, MessageSquare } from 'lucide-react';
import { FeedbackListProps } from '@/types/feedback';

const FeedbackList: React.FC<FeedbackListProps> = ({
    feedbacks,
    selectedFeedbackId,
    onSelect,
}) => {
    return (
        <>
            <div className="flex h-9 items-center border-b border-slate-200 px-4 text-xs font-medium text-slate-600">
                {feedbacks.length} feedback items
            </div>
            <div>
                {feedbacks.map((feedback) => (
                    <button
                        type="button"
                        onClick={() => onSelect(feedback)}
                        className={`flex w-full items-center gap-4 border-b border-slate-200 px-4 py-3 text-left transition-colors ${selectedFeedbackId === feedback.id
                            ? 'bg-blue-50/50'
                            : 'bg-white hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <MessageSquare className="h-[17px] w-[17px] text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[14px] font-semibold text-slate-900">
                                {feedback.message}
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                <span>{feedback.email}</span>

                                <span>•</span>

                                <span>
                                    {String(feedback.createdAt)}
                                </span>
                            </div>
                        </div>
                        {/* Unread indicator */}
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />

                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-800" />
                    </button>
                ))}
                {feedbacks.length === 0 && (
                    <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                        No feedback found.
                    </div>
                )}
            </div>
        </>
    );
};

export default FeedbackList;