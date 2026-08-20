import { IFeedback } from "@/models/feedback";

export interface FeedbackPayload {
    rating: number;
    category: string;
    message: string;
    sessionId: string;
    email?: string;
    createdAt?: Date
};

export interface FeedbackFormProps {
    onSubmit: (
      action?: string,
      feedback?: FeedbackPayload
    ) => void | Promise<void>;
};

export interface FeedbackListProps {
    feedbacks: IFeedback[];
    selectedFeedbackId?: number;
    onSelect: (feedback: IFeedback) => void;
}

export interface FeedbackDetailsProps {
    feedback: IFeedback;
    onClose: () => void;
    onResolve: () => void;
}

export type FeedbackTab = 'All Feedback'| 'Unread'| 'Resolved';

export interface FeedbackFiltersState {
    category: string;
    rating: string;
    sort: string;
}

export interface FeedbackFiltersProps {
    activeTab: FeedbackTab;
    onTabChange: (tab: FeedbackTab) => void;
    filters: FeedbackFiltersState;
    onFilterChange: (
        key: keyof FeedbackFiltersState,
        value: string
    ) => void;
    onRefresh: () => void;
    totalCount: number;
    unreadCount: number;
    resolvedCount: number;
}

export interface FeedbackStatsProps {
    total: number;
    averageRating: number;
    unread: number;
    resolved: number;
}

export const feedbackCategories = [
  { value: 'accuracy', label: 'Answer Accuracy' },
  { value: 'performance', label: 'Performance' },
  { value: 'ui', label: 'User Experience' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'other', label: 'Other' },
] as const;

export const feedbackRatings = [
  { value: 'all', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' },
] as const;

export const feedbackSortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
] as const;

export type SelectFilterConfig = {
  label: string;
  value: string;
  options: readonly {
      value: string;
      label: string;
  }[];
  className: string;
  key: keyof FeedbackFiltersState;
};