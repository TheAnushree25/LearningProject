import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./src/models/user.model.js";
import { course } from "./src/models/course.model.js";
import { contact } from "./src/models/contact.model.js";
import { CourseProgress } from "./src/models/courseProgress.model.js";

dotenv.config({ path: './.env' });

const verify = async () => {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(`${process.env.MONGODB_URL}/eLearning`);
        console.log("Database connected successfully!");

        // 1. Verify users
        const usersCount = await User.countDocuments();
        console.log(`- Verified User Model: Found ${usersCount} users.`);

        const student = await User.findOne({ role: "student" });
        const teacher = await User.findOne({ role: "instructor" });
        console.log(`  - Student: ${student ? student.email : 'None found'}`);
        console.log(`  - Teacher: ${teacher ? teacher.email : 'None found'}`);

        // 2. Verify courses
        const coursesCount = await course.countDocuments();
        console.log(`- Verified Course Model: Found ${coursesCount} courses.`);

        // 3. Test Course Catalog Aggregation Pipeline
        console.log("- Testing Course Catalog Aggregation...");
        const catalog = await course.aggregate([
            { $match: { isapproved: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "enrolledteacher",
                    foreignField: "_id",
                    as: "teacherDetails"
                }
            },
            { $unwind: "$teacherDetails" },
            {
                $project: {
                    coursename: 1,
                    description: 1,
                    teacherName: "$teacherDetails.firstName"
                }
            }
        ]);
        console.log("  - Catalog Aggregation Success! Found:", catalog.length, "items.");

        // 4. Test Student Stats Aggregation Pipeline
        if (student) {
            console.log("- Testing Student Stats Aggregation...");
            const enrolledCoursesCount = await course.aggregate([
                { $match: { enrolledStudent: student._id } },
                { $count: "count" }
            ]);
            console.log("  - Student Stats Aggregation Success! Enrolled courses count:", enrolledCoursesCount[0]?.count || 0);
        }

        console.log("\n✅ ALL SYSTEM CHECKS PASSED SUCCESSFULLY!");
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    }
};

verify();
