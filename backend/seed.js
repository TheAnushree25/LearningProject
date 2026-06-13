import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "./src/models/user.model.js";
import { course } from "./src/models/course.model.js";

dotenv.config({ path: './.env' });

const seed = async () => {
    try {
        const connUrl = process.env.MONGODB_URL || "mongodb+srv://ElearningProject:JGqPVGjdDW6k2VS2@mydatabase.uc73haq.mongodb.net/?appName=MyDatabase";
        console.log("Connecting to MongoDB at:", connUrl);
        
        let fullUrl = connUrl;
        if (!fullUrl.includes("/eLearning")) {
            if (fullUrl.includes("?")) {
                const parts = fullUrl.split("?");
                if (parts[0].endsWith("/")) {
                    fullUrl = `${parts[0]}eLearning?${parts[1]}`;
                } else {
                    fullUrl = `${parts[0]}/eLearning?${parts[1]}`;
                }
            } else {
                if (fullUrl.endsWith("/")) {
                    fullUrl = `${fullUrl}eLearning`;
                } else {
                    fullUrl = `${fullUrl}/eLearning`;
                }
            }
        }
        await mongoose.connect(fullUrl);
        console.log("Connected to MongoDB successfully!");

        // Clean database or insert if missing
        console.log("Checking if users already seeded...");
        let adminUser = await User.findOne({ role: "admin" });
        if (!adminUser) {
            console.log("Seeding Admin...");
            adminUser = await User.create({
                firstName: "System",
                lastName: "Admin",
                email: "admin@test.com",
                password: "AdminPassword123!",
                role: "admin",
                Isverified: true,
                Isapproved: "approved",
                username: "admin"
            });
        }

        let teacherUser = await User.findOne({ email: "teacher@test.com" });
        if (!teacherUser) {
            console.log("Seeding Teacher...");
            teacherUser = await User.create({
                firstName: "Parag",
                lastName: "Kadyan",
                email: "teacher@test.com",
                password: "TeacherPassword123!",
                role: "instructor",
                Isverified: true,
                Isapproved: "approved"
            });
        }

        let studentUser = await User.findOne({ email: "student@test.com" });
        if (!studentUser) {
            console.log("Seeding Student...");
            studentUser = await User.create({
                firstName: "Satyajit",
                lastName: "Roy",
                email: "student@test.com",
                password: "StudentPassword123!",
                role: "student",
                Isverified: true,
                Isapproved: "approved"
            });
        }

        console.log("Checking if course already seeded...");
        let physicsCourse = await course.findOne({ coursename: "physics" });
        if (!physicsCourse) {
            console.log("Seeding Physics Course...");
            physicsCourse = await course.create({
                coursename: "physics",
                description: "Master the fundamental concepts of physics, from Classical Mechanics to electromagnetism.",
                isapproved: true,
                enrolledteacher: teacherUser._id,
                enrolledStudent: [studentUser._id],
                schedule: [
                    { day: 1, starttime: 600, endtime: 720 }, // Monday 10:00 - 12:00
                    { day: 3, starttime: 600, endtime: 720 }  // Wednesday 10:00 - 12:00
                ],
                lectures: [
                    {
                        title: "Lecture 1: Kinematics & One-Dimensional Motion",
                        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                        description: "An introduction to speed, velocity, acceleration, and reference frames in physics."
                    },
                    {
                        title: "Lecture 2: Newton's Laws of Motion",
                        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                        description: "Detailed study of Newton's three laws of motion with real-world applications and vector analysis."
                    },
                    {
                        title: "Lecture 3: Work, Energy & Power",
                        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                        description: "Analyzing kinetic energy, potential energy, work-energy theorem, and conservation of energy."
                    }
                ]
            });
        } else {
            // Update to ensure lectures are present
            physicsCourse.lectures = [
                {
                    title: "Lecture 1: Kinematics & One-Dimensional Motion",
                    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                    description: "An introduction to speed, velocity, acceleration, and reference frames in physics."
                },
                {
                    title: "Lecture 2: Newton's Laws of Motion",
                    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                    description: "Detailed study of Newton's three laws of motion with real-world applications and vector analysis."
                },
                {
                    title: "Lecture 3: Work, Energy & Power",
                    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                    description: "Analyzing kinetic energy, potential energy, work-energy theorem, and conservation of energy."
                }
            ];
            // Ensure student is enrolled
            if (!physicsCourse.enrolledStudent.includes(studentUser._id)) {
                physicsCourse.enrolledStudent.push(studentUser._id);
            }
            await physicsCourse.save();
        }

        console.log("\n=============================================");
        console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
        console.log("=============================================");
        console.log("Logins seeded for testing:");
        console.log("🧑 Student:   student@test.com  / StudentPassword123!");
        console.log("🧑 Teacher:   teacher@test.com  / TeacherPassword123!");
        console.log("🧑 Admin:     admin@test.com    / AdminPassword123!");
        console.log("📚 Course:    physics (with 3 video lectures)");
        console.log("=============================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seed();
