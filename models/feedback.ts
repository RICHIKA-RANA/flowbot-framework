import { FeedbackPayload } from '@/types/feedback';
import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
    email: string;
    sessionId: string;
    rating: number;
    category: string;
    message: string;
    createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
    {
        email: {
            type: String,
        },
        sessionId: {
            type: String,
        },
        rating: {
            type: Number,
            default: 0,
        },
        category: {
            type: String,
        },
        message: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        versionKey: false,
    },
);

// model
export const FeedbackModel =
    mongoose.models.Feedback ||
    mongoose.model<IFeedback>('Feedback', FeedbackSchema);

// store feedback
export async function createFeedback(feedback: FeedbackPayload): Promise<IFeedback> {
    return await FeedbackModel.create(feedback);
}

// retrieve feedbacks
export async function getFeedbacks(
    skip: number = 0,
    limit: number = 10
): Promise<{
    feedbacks: IFeedback[];
    total: number;
}> {

    const [feedbacks, total] = await Promise.all([
        FeedbackModel.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean<IFeedback[]>(),

        FeedbackModel.countDocuments({}),
    ]);

    return {
        feedbacks,
        total,
    };
}

export default FeedbackModel;