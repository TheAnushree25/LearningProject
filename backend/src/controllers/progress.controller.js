import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { course } from "../models/course.model.js";
import mongoose from "mongoose";

// In-Memory Progress database
global.mockProgressStore = global.mockProgressStore || {};

export const getProgress = asyncHandler(async (req, res) => {
    const { courseId, videoId } = req.params;
    const userId = req.Student?._id || "mock_user_id";

    if (!courseId || !videoId) {
        return res.status(400).json({ success: false, message: "courseId and videoId are required" });
    }

    if (!global.isMongoConnected) {
        const key = `${userId}_${courseId}_${videoId}`;
        const timestamp = global.mockProgressStore[key] || 0;
        return res.status(200).json(
            new ApiResponse(200, { lastWatchedTimestamp: timestamp }, "Progress fetched successfully (Mock Mode)")
        );
    }

    const progress = await CourseProgress.findOne({
        userId,
        courseId: new mongoose.Types.ObjectId(courseId),
        videoId: new mongoose.Types.ObjectId(videoId)
    });

    return res.status(200).json(
        new ApiResponse(200, {
            lastWatchedTimestamp: progress ? progress.lastWatchedTimestamp : 0
        }, "Progress fetched successfully")
    );
});

export const updateProgress = asyncHandler(async (req, res) => {
    const { courseId, videoId, lastWatchedTimestamp } = req.body;
    const userId = req.Student?._id || "mock_user_id";

    if (!courseId || !videoId || lastWatchedTimestamp === undefined) {
        return res.status(400).json({ success: false, message: "courseId, videoId, and lastWatchedTimestamp are required" });
    }

    if (!global.isMongoConnected) {
        const key = `${userId}_${courseId}_${videoId}`;
        global.mockProgressStore[key] = Math.max(0, parseFloat(lastWatchedTimestamp));
        return res.status(200).json(
            new ApiResponse(200, { lastWatchedTimestamp: global.mockProgressStore[key] }, "Progress updated successfully (Mock Mode)")
        );
    }

    const progress = await CourseProgress.findOneAndUpdate(
        {
            userId,
            courseId: new mongoose.Types.ObjectId(courseId),
            videoId: new mongoose.Types.ObjectId(videoId)
        },
        {
            $set: { lastWatchedTimestamp: Math.max(0, parseFloat(lastWatchedTimestamp)) }
        },
        {
            new: true,
            upsert: true
        }
    );

    return res.status(200).json(
        new ApiResponse(200, progress, "Progress updated successfully")
    );
});

export const getProgressStats = asyncHandler(async (req, res) => {
    const { userId, courseId } = req.params;
    const studentId = userId && userId !== "me" ? userId : (req.Student?._id || "mock_user_id");

    if (!courseId) {
        return res.status(400).json({ success: false, message: "courseId is required" });
    }

    if (!global.isMongoConnected) {
        // Return mock statistics (3 total lectures in Physics, count how many have progress > 0)
        const totalLectures = 3;
        
        let watchedCount = 0;
        const mockLecturesIds = ["660c6d2d46e01a4e14f8ab77", "660c6d2d46e01a4e14f8ab88", "660c6d2d46e01a4e14f8ab99"];
        
        mockLecturesIds.forEach(vidId => {
            const key = `${studentId}_${courseId}_${vidId}`;
            if (global.mockProgressStore[key] && global.mockProgressStore[key] > 0) {
                watchedCount++;
            }
        });

        const progressPercentage = Math.round((watchedCount / totalLectures) * 100);

        return res.status(200).json(
            new ApiResponse(200, {
                totalLectures,
                watchedCount,
                progressPercentage
            }, "Progress stats retrieved successfully (Mock Mode)")
        );
    }

    const cId = new mongoose.Types.ObjectId(courseId);

    const courseStats = await course.aggregate([
        { $match: { _id: cId } },
        { $project: { totalLectures: { $size: { $ifNull: ["$lectures", []] } } } }
    ]);

    const totalLectures = courseStats[0]?.totalLectures || 0;

    const watchedStats = await CourseProgress.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(studentId),
                courseId: cId,
                lastWatchedTimestamp: { $gt: 0 }
            }
        },
        { $count: "watchedCount" }
    ]);

    const watchedCount = watchedStats[0]?.watchedCount || 0;
    const progressPercentage = totalLectures > 0 ? Math.round((watchedCount / totalLectures) * 100) : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            totalLectures,
            watchedCount,
            progressPercentage
        }, "Progress stats retrieved successfully")
    );
});
