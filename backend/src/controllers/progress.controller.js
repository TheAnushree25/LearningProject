import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Query, ID } from "node-appwrite";
import { databases, databaseId, progressColId, coursesColId } from "../database/appwrite.js";

// In-Memory Progress database
global.mockProgressStore = global.mockProgressStore || {};

export const getProgress = asyncHandler(async (req, res) => {
    const { courseId, videoId } = req.params;
    const userId = req.Student?._id || "mock_user_id";

    if (!courseId || !videoId) {
        return res.status(400).json({ success: false, message: "courseId and videoId are required" });
    }

    if (!global.isAppwriteConnected) {
        const key = `${userId}_${courseId}_${videoId}`;
        const timestamp = global.mockProgressStore[key] || 0;
        return res.status(200).json(
            new ApiResponse(200, { lastWatchedTimestamp: timestamp }, "Progress fetched successfully (Mock Mode)")
        );
    }

    const list = await databases.listDocuments(databaseId, progressColId, [
        Query.equal('userId', userId),
        Query.equal('courseId', courseId),
        Query.equal('videoId', videoId)
    ]);

    const timestamp = list.total > 0 ? list.documents[0].lastWatchedTimestamp : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            lastWatchedTimestamp: timestamp
        }, "Progress fetched successfully")
    );
});

export const updateProgress = asyncHandler(async (req, res) => {
    const { courseId, videoId, lastWatchedTimestamp } = req.body;
    const userId = req.Student?._id || "mock_user_id";

    if (!courseId || !videoId || lastWatchedTimestamp === undefined) {
        return res.status(400).json({ success: false, message: "courseId, videoId, and lastWatchedTimestamp are required" });
    }

    const parsedTimestamp = Math.max(0, parseFloat(lastWatchedTimestamp));

    if (!global.isAppwriteConnected) {
        const key = `${userId}_${courseId}_${videoId}`;
        global.mockProgressStore[key] = parsedTimestamp;
        return res.status(200).json(
            new ApiResponse(200, { lastWatchedTimestamp: global.mockProgressStore[key] }, "Progress updated successfully (Mock Mode)")
        );
    }

    const list = await databases.listDocuments(databaseId, progressColId, [
        Query.equal('userId', userId),
        Query.equal('courseId', courseId),
        Query.equal('videoId', videoId)
    ]);

    let progress;
    if (list.total > 0) {
        progress = await databases.updateDocument(databaseId, progressColId, list.documents[0].$id, {
            lastWatchedTimestamp: parsedTimestamp
        });
    } else {
        progress = await databases.createDocument(databaseId, progressColId, ID.unique(), {
            userId,
            courseId,
            videoId,
            lastWatchedTimestamp: parsedTimestamp
        });
    }

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

    if (!global.isAppwriteConnected) {
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

    // Fetch Course
    const courseDoc = await databases.getDocument(databaseId, coursesColId, courseId);
    let lectures = [];
    try {
        lectures = courseDoc.lectures ? (typeof courseDoc.lectures === 'string' ? JSON.parse(courseDoc.lectures) : courseDoc.lectures) : [];
    } catch (e) { console.error(e); }

    const totalLectures = lectures.length;

    // Fetch progress stats
    const progressList = await databases.listDocuments(databaseId, progressColId, [
        Query.equal('userId', studentId),
        Query.equal('courseId', courseId),
        Query.greaterThan('lastWatchedTimestamp', 0)
    ]);

    const watchedCount = progressList.total;
    const progressPercentage = totalLectures > 0 ? Math.round((watchedCount / totalLectures) * 100) : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            totalLectures,
            watchedCount,
            progressPercentage
        }, "Progress stats retrieved successfully")
    );
});
