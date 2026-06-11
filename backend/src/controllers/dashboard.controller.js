import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Query } from "node-appwrite";
import { databases, databaseId, usersColId, coursesColId, progressColId, contactsColId } from "../database/appwrite.js";

export const getStudentStats = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    if (!global.isAppwriteConnected) {
        // Return mock student statistics
        return res.status(200).json(
            new ApiResponse(200, {
                enrolledCourses: 1,
                upcomingClasses: 1,
                totalHoursWatched: 0.8
            }, "Student stats generated successfully (Mock Mode)")
        );
    }

    // Enrolled courses list
    const enrolledCoursesList = await databases.listDocuments(databaseId, coursesColId, [
        Query.contains('enrolledStudent', studentId)
    ]);

    const enrolledCourses = enrolledCoursesList.total;

    // Upcoming classes
    let upcomingClasses = 0;
    const now = new Date();
    for (const doc of enrolledCoursesList.documents) {
        let liveClasses = [];
        try {
            liveClasses = doc.liveClasses ? (typeof doc.liveClasses === 'string' ? JSON.parse(doc.liveClasses) : doc.liveClasses) : [];
        } catch (e) { console.error(e); }

        for (const lc of liveClasses) {
            if (new Date(lc.date) >= now) {
                upcomingClasses++;
            }
        }
    }

    // Total Watch Duration
    const progressList = await databases.listDocuments(databaseId, progressColId, [
        Query.equal('userId', studentId)
    ]);

    let totalSeconds = 0;
    for (const doc of progressList.documents) {
        totalSeconds += doc.lastWatchedTimestamp || 0;
    }

    const totalHoursWatched = Math.round((totalSeconds / 3600) * 10) / 10;

    return res.status(200).json(
        new ApiResponse(200, {
            enrolledCourses,
            upcomingClasses,
            totalHoursWatched
        }, "Student stats generated successfully")
    );
});

export const getTeacherStats = asyncHandler(async (req, res) => {
    const { teacherId } = req.params;

    if (!global.isAppwriteConnected) {
        // Return mock instructor statistics
        return res.status(200).json(
            new ApiResponse(200, {
                totalCourses: 2,
                totalStudents: 1,
                balance: 1400,
                totalWithdrawals: 600
            }, "Teacher stats generated successfully (Mock Mode)")
        );
    }

    // Teacher's courses
    const teacherCourses = await databases.listDocuments(databaseId, coursesColId, [
        Query.equal('enrolledteacher', teacherId)
    ]);

    const totalCourses = teacherCourses.total;

    // Unique enrolled students count
    const studentSet = new Set();
    for (const doc of teacherCourses.documents) {
        const students = doc.enrolledStudent || [];
        students.forEach(id => studentSet.add(id));
    }
    const totalStudents = studentSet.size;

    // Teacher financials
    const teacherDoc = await databases.getDocument(databaseId, usersColId, teacherId);
    const balance = teacherDoc.Balance || teacherDoc.balance || 0;

    let totalWithdrawals = 0;
    let withdrawalHistory = [];
    try {
        withdrawalHistory = teacherDoc.WithdrawalHistory ? (typeof teacherDoc.WithdrawalHistory === 'string' ? JSON.parse(teacherDoc.WithdrawalHistory) : teacherDoc.WithdrawalHistory) : [];
    } catch (e) { console.error(e); }

    for (const w of withdrawalHistory) {
        totalWithdrawals += w.amount || 0;
    }

    return res.status(200).json(
        new ApiResponse(200, {
            totalCourses,
            totalStudents,
            balance,
            totalWithdrawals
        }, "Teacher stats generated successfully")
    );
});

export const getAdminStats = asyncHandler(async (req, res) => {
    if (!global.isAppwriteConnected) {
        // Return mock admin statistics
        return res.status(200).json(
            new ApiResponse(200, {
                studentsCount: 1,
                instructorsCount: 1,
                adminsCount: 1,
                approvedCourses: 2,
                pendingCourses: 0,
                pendingInquiries: 0
            }, "Admin stats generated successfully (Mock Mode)")
        );
    }

    // User counts
    const usersList = await databases.listDocuments(databaseId, usersColId, [
        Query.limit(100)
    ]);

    let studentsCount = 0;
    let instructorsCount = 0;
    let adminsCount = 0;

    for (const user of usersList.documents) {
        if (user.role === 'student') studentsCount++;
        else if (user.role === 'instructor') instructorsCount++;
        else if (user.role === 'admin') adminsCount++;
    }

    // Courses counts
    const coursesList = await databases.listDocuments(databaseId, coursesColId, [
        Query.limit(100)
    ]);

    let approvedCourses = 0;
    let pendingCourses = 0;

    for (const course of coursesList.documents) {
        if (course.isapproved === true) approvedCourses++;
        else if (course.isapproved === false) pendingCourses++;
    }

    // Contacts counts
    const contactList = await databases.listDocuments(databaseId, contactsColId, [
        Query.equal('status', false),
        Query.limit(100)
    ]);

    const pendingInquiries = contactList.total;

    return res.status(200).json(
        new ApiResponse(200, {
            studentsCount,
            instructorsCount,
            adminsCount,
            approvedCourses,
            pendingCourses,
            pendingInquiries
        }, "Admin stats generated successfully")
    );
});
