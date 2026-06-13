import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// In-Memory mock users database
const MOCK_USERS = [
    {
        _id: "660c6d2d46e01a4e14f8ab11", // fixed ObjectId style string
        firstName: "Satyajit",
        lastName: "Roy",
        Firstname: "Satyajit",
        Lastname: "Roy",
        email: "student@test.com",
        Email: "student@test.com",
        role: "student",
        Isverified: true,
        Isapproved: "approved"
    },
    {
        _id: "660c6d2d46e01a4e14f8ab22",
        firstName: "Parag",
        lastName: "Kadyan",
        Firstname: "Parag",
        Lastname: "Kadyan",
        email: "teacher@test.com",
        Email: "teacher@test.com",
        role: "instructor",
        Isverified: true,
        Isapproved: "approved"
    },
    {
        _id: "660c6d2d46e01a4e14f8ab33",
        firstName: "System",
        lastName: "Admin",
        Firstname: "System",
        Lastname: "Admin",
        email: "admin@test.com",
        Email: "admin@test.com",
        role: "admin",
        Isverified: true,
        Isapproved: "approved"
    }
];

const sendVerificationEmail = async (email, firstName, userId, role) => {
    try {
        const emailSender = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_EMAIL || 'test@test.com',
                pass: process.env.SMTP_PASS || 'test',
            }
        });

        const verifyRoute = role === 'instructor' ? 'teacher' : 'student';
        const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:4400'}/api/${verifyRoute}/verify?id=${userId}`;

        const mailOptions = {
            from: "elearningsnu@gmail.com",
            to: email,
            subject: "Verify your E-mail",
            html: `<p>Please click here to verify: <a href="${verificationUrl}">Verify Email</a></p>`
        };

        await emailSender.sendMail(mailOptions);
    } catch (error) {
        console.error("Verification email failed:", error);
    }
};

const generateAccessAndRefreshTokens = async (userId, userObj = null) => {
    try {
        if (global.isMongoConnected) {
            const user = await User.findById(userId);
            const accessToken = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();
            user.Refreshtoken = refreshToken;
            await user.save({ validateBeforeSave: false });
            return { accessToken, refreshToken };
        } else {
            // In-Memory JWT generation
            const target = userObj || MOCK_USERS.find(u => u._id === userId);
            const secret = process.env.ACCESS_TOKEN_SECRET || "default_access_token_secret_key_1234";
            const refreshSecret = process.env.REFRESH_TOKEN_SECRET || "default_refresh_token_secret_key_5678";
            
            const accessToken = jwt.sign({ _id: target._id, email: target.email, role: target.role }, secret, { expiresIn: "1d" });
            const refreshToken = jwt.sign({ _id: target._id, email: target.email, role: target.role }, refreshSecret, { expiresIn: "10d" });
            
            return { accessToken, refreshToken };
        }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
    }
};

export const signup = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role, Firstname, Lastname, Email, Password } = req.body;
    const fName = firstName || Firstname;
    const lName = lastName || Lastname;
    const eAddress = email || Email;
    const pWord = password || Password;
    const r = req.body.role || (req.originalUrl.includes('teacher') ? 'instructor' : 'student');

    if ([fName, lName, eAddress, pWord].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const normalizedEmail = eAddress.trim().toLowerCase();

    if (!global.isMongoConnected) {
        // Mock Successful Signup
        const mockNewUser = {
            _id: "mock_user_" + Math.random().toString(36).substr(2, 9),
            firstName: fName,
            lastName: lName,
            Firstname: fName,
            Lastname: lName,
            email: normalizedEmail,
            Email: normalizedEmail,
            role: r === 'teacher' || r === 'instructor' ? 'instructor' : 'student',
            Isverified: true,
            Isapproved: "approved"
        };
        MOCK_USERS.push(mockNewUser);
        return res.status(201).json(
            new ApiResponse(201, mockNewUser, "Signup successful (Mock Mode).")
        );
    }

    const existedUser = await User.findOne({ email: normalizedEmail });
    if (existedUser) {
        throw new ApiError(400, "User with this email already exists");
    }

    const dbRole = r === 'teacher' || r === 'instructor' ? 'instructor' : (r === 'admin' ? 'admin' : 'student');
    const newUser = await User.create({
        firstName: fName,
        lastName: lName,
        email: normalizedEmail,
        password: pWord,
        role: dbRole,
        Isverified: true,
        Isapproved: dbRole === 'admin' ? 'approved' : 'pending'
    });

    const createdUser = await User.findById(newUser._id).select("-password -Refreshtoken");
    sendVerificationEmail(normalizedEmail, fName, newUser._id, dbRole);

    return res.status(201).json(
        new ApiResponse(201, createdUser, "Signup successful. Please verify email.")
    );
});

export const login = asyncHandler(async (req, res) => {
    const { email, password, Email, Password } = req.body;
    const eAddress = email || Email || req.user?.Email;
    const pWord = password || Password || req.user?.Password;

    if (!eAddress || !pWord) {
        throw new ApiError(400, "Email and password are required");
    }

    const normalizedEmail = eAddress.trim().toLowerCase();

    if (!global.isMongoConnected) {
        // Check Mock Database
        const mockUser = MOCK_USERS.find(u => u.email === normalizedEmail);
        if (!mockUser) {
            throw new ApiError(404, "User does not exist (Mock Mode)");
        }
        
        // Simple mock password check
        const isPassCorrect = pWord.toLowerCase().includes("password") || pWord.length >= 6;
        if (!isPassCorrect) {
            throw new ApiError(401, "Invalid credentials (Mock Mode)");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(mockUser._id, mockUser);
        
        const cookieOptions = {
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        };

        return res
            .status(200)
            .cookie("Accesstoken", accessToken, cookieOptions)
            .cookie("Refreshtoken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { user: mockUser, accessToken },
                    "Logged in successfully (Mock Mode)"
                )
            );
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    if (!user.Isverified) {
        throw new ApiError(401, "Email is not verified. Please verify your email first.");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(pWord);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -Refreshtoken");

    const cookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    };

    return res
        .status(200)
        .cookie("Accesstoken", accessToken, cookieOptions)
        .cookie("Refreshtoken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken },
                "Logged in successfully"
            )
        );
});

export const logout = asyncHandler(async (req, res) => {
    const userId = req.Student?._id || req.teacher?._id || req.Admin?._id || req.user?._id;

    if (global.isMongoConnected && userId) {
        await User.findByIdAndUpdate(
            userId,
            { $set: { Refreshtoken: undefined } },
            { new: true }
        );
    }

    const cookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    };

    return res
        .status(200)
        .clearCookie("Accesstoken", cookieOptions)
        .clearCookie("Refreshtoken", cookieOptions)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.Student || req.teacher || req.Admin || req.user;
    if (!user) {
        throw new ApiError(401, "User session not active");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Session user details retrieved successfully"));
});
