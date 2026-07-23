import mongoose, { Schema, Document } from 'mongoose';
import { getUserIdByEmail } from './userModel';


export interface IPublicChat extends Document {
    userId: mongoose.Types.ObjectId | null;
    sessionId: string;
    publishedAt: Date;
}

const PublicChatSchema = new Schema<IPublicChat>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        sessionId: {
            type: String,
            required: true,
        },
        publishedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        versionKey: false,
    }
);

// Model
export const PublicChatModel =
    mongoose.models.PublicChat ||
    mongoose.model<IPublicChat>('PublicChat', PublicChatSchema);


// Creates a public chat entry for a particular session for the moment it is being called.
export const createPublicChat = async (
    sessionId: string,
    email: string
): Promise<IPublicChat> => {
    const userId = await getUserIdByEmail(email)
    return (await PublicChatModel.create({
        sessionId,
        userId,
        publishedAt: new Date(),
    })) as IPublicChat;
};

// Fetch a public chat by its id.
export const getPublicChatById = async (
    id: string
): Promise<IPublicChat | null> => {
    return await PublicChatModel.findById(id);
};


export default PublicChatModel;