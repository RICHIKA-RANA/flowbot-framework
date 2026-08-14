import React from 'react';
import {
    Check,
    // CheckCircle2,
    Clipboard,
    X,
} from 'lucide-react';
import { FeedbackDetailsProps } from '@/types/feedback';


const FeedbackDetails: React.FC<FeedbackDetailsProps> = ({
    feedback,
    onClose,
    onResolve,
}) => {
    return (
        <div className="flex h-full min-h-[630px] flex-col rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">
                    Feedback Details
                </h2>

                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
                <div className="border-b border-slate-200 py-5">
                    <div className="mb-4 grid grid-cols-[108px_1fr] items-center gap-2 last:mb-0">
                        <span className="text-sm text-slate-600">From</span>

                        <div className="text-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">
                                    {feedback.email}
                                </span>

                                <button
                                    type="button"
                                    className="text-slate-500 hover:text-slate-800"
                                    onClick={() =>
                                        navigator.clipboard?.writeText(
                                            feedback.email
                                        )
                                    }
                                >
                                    <Clipboard className="h-3.5 w-3.5" />
                                </button>
                            </div>

                        </div>
                    </div>
                    <div className="mb-4 grid grid-cols-[108px_1fr] items-center gap-2 last:mb-0">
                        <span className="text-sm text-slate-600">Submitted</span>
                        <div className="text-sm">
                            <span className="font-semibold text-slate-900">
                                {String(feedback.createdAt)}
                            </span>
                        </div>
                    </div>
                    {/* TODO: update it with the actual status of feedbacks */}
                    <div className="mb-4 grid grid-cols-[108px_1fr] items-center gap-2 last:mb-0">
                        <span className="text-sm text-slate-600">Status</span>
                        <div className="text-sm">
                            <span className={`rounded-md px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600`}>
                                Unread
                            </span>
                        </div>
                    </div>

                </div>

                {/* Rating */}
                <div className="py-5">
                    <h3 className="text-sm font-semibold text-slate-900">
                        Overall Experience
                    </h3>

                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    className={`text-[22px] leading-none ${star <= feedback.rating
                                        ? 'text-amber-400'
                                        : 'text-slate-300'
                                        }`}
                                >
                                    ★
                                </span>
                            ))}
                        </div>

                        <span className="text-sm font-medium text-slate-700">
                            {feedback.rating}/5
                        </span>
                    </div>

                    <h3 className="pt-5 text-sm font-semibold text-slate-900">
                        Feedback Category
                    </h3>
                    <div className="mt-3 inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                        {feedback.category}
                    </div>

                    <h3 className="pt-5 text-sm font-semibold text-slate-900">
                        Additional Comments
                    </h3>

                    <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
                        <p>
                            {feedback.message}
                        </p>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
                <button
                    type="button"
                    onClick={onResolve}
                    // disabled={feedback.status === 'Resolved'}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Check className="h-4 w-4" />
                    Mark as Resolved
                </button>
            </div>
        </div>
    );
};

export default FeedbackDetails;