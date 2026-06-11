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

        const user = await User.findById(decodedToken?._id).select("-password -Refreshtoken");

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
        if (!req.user) {
            throw new ApiError(401, "User session not authenticated");
        }
        if (!roles.includes(req.user.role)) {
            throw new ApiError(403, `Role '${req.user.role}' is not authorized to access this resource`);
        }
        next();
    };
};
