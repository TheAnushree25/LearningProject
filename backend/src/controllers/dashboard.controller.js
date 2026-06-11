import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { course } from "../models/course.model.js";
import { contact } from "../models/contact.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import mongoose from "mongoose";

export const getStudentStats = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const stdId = new mongoose.Types.ObjectId(studentId);

    // 1. Total Enrolled Courses count via aggregation
    const enrolledCoursesCount = await course.aggregate([
        { $match: { enrolledStudent: stdId } },
        { $count: "count" }
    ]);

    // 2. Upcoming Classes via aggregation
    const upcomingClasses = await course.aggregate([
        { $match: { enrolledStudent: stdId } },
        { $unwind: "$liveClasses" },
        { $match: { "liveClasses.date": { $gte: new Date() } } },
        { $count: "count" }
    ]);

    // 3. Total watched seconds via aggregation
    const totalWatchSeconds = await CourseProgress.aggregate([
        { $match: { userId: stdId } },
        { $group: { _id: null, totalSeconds: { $sum: "$lastWatchedTimestamp" } } }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            enrolledCourses: enrolledCoursesCount[0]?.count || 0,
            upcomingClasses: upcomingClasses[0]?.count || 0,
            totalHoursWatched: Math.round(((totalWatchSeconds[0]?.totalSeconds || 0) / 3600) * 10) / 10
        }, "Student stats generated successfully")
    );
});

export const getTeacherStats = asyncHandler(async (req, res) => {
    const { teacherId } = req.params;
    const tId = new mongoose.Types.ObjectId(teacherId);

    // 1. Course Stats (Total courses, total unique students)
    const stats = await course.aggregate([
        { $match: { enrolledteacher: tId } },
        {
            $group: {
                _id: "$enrolledteacher",
                totalCourses: { $sum: 1 },
                allStudents: { $push: "$enrolledStudent" }
            }
        },
        {
            $project: {
                totalCourses: 1,
                // Flatten array of arrays and get unique student count
                totalStudents: {
                    $size: {
                        $reduce: {
                            input: "$allStudents",
                            initialValue: [],
                            in: { $setUnion: ["$$value", "$$this"] }
                        }
                    }
                }
            }
        }
    ]);

    // 2. Instructor Balance and Withdrawal Summary via user aggregation
    const teacherFinancials = await User.aggregate([
        { $match: { _id: tId, role: "instructor" } },
        {
            $project: {
                balance: { $ifNull: ["$Balance", 0] },
                totalWithdrawals: {
                    $sum: { $ifNull: ["$WithdrawalHistory.amount", 0] }
                }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            totalCourses: stats[0]?.totalCourses || 0,
            totalStudents: stats[0]?.totalStudents || 0,
            balance: teacherFinancials[0]?.balance || 0,
            totalWithdrawals: teacherFinancials[0]?.totalWithdrawals || 0
        }, "Teacher stats generated successfully")
    );
});

export const getAdminStats = asyncHandler(async (req, res) => {
    // 1. Count users by role using aggregation
    const userRoleCounts = await User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    // Format roles counts
    const rolesMap = {};
    userRoleCounts.forEach(item => {
        rolesMap[item._id] = item.count;
    });

    // 2. Course counts by approval status
    const courseStats = await course.aggregate([
        { $group: { _id: "$isapproved", count: { $sum: 1 } } }
    ]);

    const coursesMap = { approved: 0, pending: 0 };
    courseStats.forEach(item => {
        if (item._id === true) coursesMap.approved = item.count;
        if (item._id === false) coursesMap.pending = item.count;
    });

    // 3. Pending Inquiries count
    const pendingInquiries = await contact.aggregate([
        { $match: { status: false } },
        { $count: "count" }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            studentsCount: rolesMap['student'] || 0,
            instructorsCount: rolesMap['instructor'] || 0,
            adminsCount: rolesMap['admin'] || 0,
            approvedCourses: coursesMap.approved,
            pendingCourses: coursesMap.pending,
            pendingInquiries: pendingInquiries[0]?.count || 0
        }, "Admin stats generated successfully")
    );
});
