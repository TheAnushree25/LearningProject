import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.Accesstoken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request: token missing");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "default_access_token_secret_key_1234");

        let user;
        if (global.isMongoConnected) {
            user = await User.findById(decodedToken?._id).select("-password -Refreshtoken");
        } else {
            // Statelessly recreate mock user object from JWT payload
            user = {
                _id: decodedToken?._id || "mock_user_id",
                email: decodedToken?.email || "student@test.com",
                Email: decodedToken?.email || "student@test.com",
                firstName: (decodedToken?.email || "Student").split('@')[0],
                Firstname: (decodedToken?.email || "Student").split('@')[0],
                lastName: "User",
                Lastname: "User",
                role: decodedToken?.role || "student",
                Isverified: true,
                Isapproved: "approved"
            };
        }

        if (!user) {
            throw new ApiError(401, "Invalid Access Token: user not found");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});

// Role-based helper middlewares
export const authorizeRoles = (...roles) => {
    return (req, _, next) => {
        const currentUser = req.user || req.Student || req.teacher || req.Admin;
        if (!currentUser) {
            throw new ApiError(401, "User session not authenticated");
        }
        if (!roles.includes(currentUser.role)) {
            throw new ApiError(403, `Role '${currentUser.role}' is not authorized to access this resource`);
        }
        next();
    };
};
