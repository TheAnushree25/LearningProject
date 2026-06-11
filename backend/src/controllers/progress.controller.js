import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { course } from "../models/course.model.js";
import mongoose from "mongoose";

export const getProgress = asyncHandler(async (req, res) => {
    const { courseId, videoId } = req.params;
    const userId = req.Student?._id;

    if (!courseId || !videoId) {
        return res.status(400).json({ success: false, message: "courseId and videoId are required" });
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
    const userId = req.Student?._id;

    if (!courseId || !videoId || lastWatchedTimestamp === undefined) {
        return res.status(400).json({ success: false, message: "courseId, videoId, and lastWatchedTimestamp are required" });
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
    const studentId = userId && userId !== "me" ? new mongoose.Types.ObjectId(userId) : req.Student?._id;

    if (!courseId) {
        return res.status(400).json({ success: false, message: "courseId is required" });
    }

    const cId = new mongoose.Types.ObjectId(courseId);

    // 1. Get total lectures count in course
    const courseStats = await course.aggregate([
        { $match: { _id: cId } },
        { $project: { totalLectures: { $size: { $ifNull: ["$lectures", []] } } } }
    ]);

    const totalLectures = courseStats[0]?.totalLectures || 0;

    // 2. Count watched lectures
    const watchedStats = await CourseProgress.aggregate([
        {
            $match: {
                userId: studentId,
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
