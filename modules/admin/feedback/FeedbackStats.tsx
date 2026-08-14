import React from 'react';
import {
    CheckCircle2,
    Mail,
    MessageSquare,
    Star,
} from 'lucide-react';
import { FeedbackStatsProps } from '@/types/feedback';

const FeedbackStats: React.FC<FeedbackStatsProps> = ({
    total,
    averageRating,
    unread,
    resolved,
}) => {
    const stats = [
        {
            title: 'Total Feedback',
            value: total,
            subtitle: '100% of all time',
            icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
            iconClassName: 'bg-blue-50',
        },
        {
            title: 'Average Rating',
            value: averageRating,
            subtitle: `Based on ${total} feedback`,
            icon: <Star className="h-5 w-5 fill-none text-green-600" />,
            iconClassName: 'bg-green-50',
        },
        {
            title: 'Unread',
            value: unread,
            subtitle: `${((unread / total) * 100).toFixed(1)}% of total`,
            showDot: true,
            icon: <Mail className="h-5 w-5 text-red-500" />,
            iconClassName: 'bg-red-50',
        },
        {
            title: 'Resolved',
            value: resolved,
            subtitle: `${((resolved / total) * 100).toFixed(1)}% of total`,
            icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
            iconClassName: 'bg-green-50',
        },
    ];

    return (
        <div className="mt-5 grid grid-cols-4 gap-5">
            {stats.map((stat) => (
                <div
                    key={stat.title}
                    className="flex h-[103px] items-center justify-between rounded-lg border border-slate-200 bg-white px-4"
                >
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            {stat.title}
                            {stat.showDot && (
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                            )}
                        </div>
                        <div className="mt-2 text-[22px] font-semibold leading-none text-slate-900">
                            {stat.value}
                        </div>
                        <div className="mt-3 text-xs text-slate-500">
                            {stat.subtitle}
                        </div>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.iconClassName}`}>
                        {stat.icon}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FeedbackStats;