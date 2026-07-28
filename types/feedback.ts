export interface FeedbackPayload {
    rating: number;
    category: string;
    message: string;
};

export interface FeedbackFormProps {
    onSubmit: (
      action?: string,
      feedback?: FeedbackPayload
    ) => void | Promise<void>;
};