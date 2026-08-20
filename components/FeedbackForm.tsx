import React, { useState } from 'react'
import { feedbackCategories, FeedbackFormProps } from '@/types/feedback';
import { getCurrentSessionId } from '@/utils/sessionJobs';

const FeedbackForm = ({ onSubmit }: FeedbackFormProps) => {
    const [rating, setRating] = useState(0);
    const [category, setCategory] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = () => {
        const sessionId = getCurrentSessionId()
        onSubmit("submit", {
            rating,
            category,
            message,
            sessionId
        });
    };

    return (
        <div className="w-[500px] flex flex-col gap-4">
            <p className="text-gray-600">
                We would love to hear your feedback to improve the chatbot experience.
            </p>

            {/* Rating */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Overall Experience
                </label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value)}
                            className={`w-10 h-10 rounded-full border transition ${rating >= value
                                ? "bg-yellow-400 border-yellow-400"
                                : "border-gray-300 hover:border-gray-500"
                                }`}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>

            {/* Category */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Feedback Category
                </label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                >
                    <option value="">Select a category</option>
                    {feedbackCategories.map((category) => (
                        <option key={category.value} value={category.value}>
                            {category.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Feedback Text */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Additional Comments
                </label>
                <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what went well or what can be improved..."
                    className="w-full border rounded-md px-3 py-2 resize-none"
                />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={!message.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                    Submit Feedback
                </button>
            </div>
        </div>
    );
}

export default FeedbackForm