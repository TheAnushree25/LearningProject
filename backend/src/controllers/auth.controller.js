import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import nodemailer from "nodemailer";

const sendVerificationEmail = async (email, firstName, userId, role) => {
    try {
        const emailSender = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASS,
            }
        });

        // Use legacy verification endpoints depending on role
        const verifyRoute = role === 'instructor' ? 'teacher' : 'student';
        const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:4400'}/api/${verifyRoute}/verify?id=${userId}`;

        const mailOptions = {
            from: "elearningsnu@gmail.com",
            to: email,
            subject: "Verify your E-mail",
            html: `
            <div style="text-align: center; font-family: Arial, sans-serif;">
                <p style="margin: 20px; font-size: 16px;"> Hi ${firstName}, Please click the button below to verify your E-mail. </p>
                <img src="https://img.freepik.com/free-vector/illustration-e-mail-protection-concept-e-mail-envelope-with-file-document-attach-file-system-security-approved_1150-41788.jpg?size=626&ext=jpg" alt="Verification Image" style="max-width: 400px; height: auto;">
                <br><br>
                <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; cursor: pointer; display: inline-block;">Verify Email</a>
            </div>`
        };

        await emailSender.sendMail(mailOptions);
        console.log("Verification email sent successfully to", email);
    } catch (error) {
        console.error("Verification email failed:", error);
    }
};

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.Refreshtoken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
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
    const r = req.body.role || req.body.roleName || (req.originalUrl.includes('teacher') ? 'instructor' : 'student');

    if ([fName, lName, eAddress, pWord].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const normalizedEmail = eAddress.trim().toLowerCase();
    const existedUser = await User.findOne({ email: normalizedEmail });

    if (existedUser) {
        throw new ApiError(400, "User with this email already exists");
    }

    // Map teacher to instructor for DB consistency
    const dbRole = r === 'teacher' || r === 'instructor' ? 'instructor' : (r === 'admin' ? 'admin' : 'student');

    const newUser = await User.create({
        firstName: fName,
        lastName: lName,
        email: normalizedEmail,
        password: pWord,
        role: dbRole,
        Isverified: false,
        Isapproved: dbRole === 'admin' ? 'approved' : 'pending' // Admin auto-approved
    });

    const createdUser = await User.findById(newUser._id).select("-password -Refreshtoken");

    if (!createdUser) {
        throw new ApiError(500, "User registration failed");
    }

    // Send email verification asynchronously
    sendVerificationEmail(normalizedEmail, fName, newUser._id, dbRole);

    return res.status(201).json(
        new ApiResponse(201, createdUser, "Signup successful. Please check your email to verify your account.")
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
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax'
    };

    return res
        .status(200)
        .cookie("Accesstoken", accessToken, cookieOptions)
        .cookie("Refreshtoken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken
                },
                "Logged in successfully"
            )
        );
});

export const logout = asyncHandler(async (req, res) => {
    const userId = req.Student?._id || req.teacher?._id || req.Admin?._id || req.user?._id;

    if (userId) {
        await User.findByIdAndUpdate(
            userId,
            { $set: { Refreshtoken: undefined } },
            { new: true }
        );
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
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
