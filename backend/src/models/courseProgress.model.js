import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course',
        required: true
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    lastWatchedTimestamp: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure unique compound index to quickly find/upsert user progress on a lecture
courseProgressSchema.index({ userId: 1, courseId: 1, videoId: 1 }, { unique: true });

export const CourseProgress = mongoose.model("CourseProgress", courseProgressSchema);
