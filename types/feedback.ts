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