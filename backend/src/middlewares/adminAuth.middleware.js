import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { databases, databaseId, usersColId } from "../database/appwrite.js";

const authAdmin = asyncHandler(async(req,_,next) =>{

    const accToken = req.cookies?.Accesstoken

    if(!accToken) {
        throw new ApiError(401, "unauthorized req")
    }

    const decodedAccToken = jwt.verify(accToken,
        process.env.ACCESS_TOKEN_SECRET || "default_access_token_secret_key_1234")

    let Admin;
    if (global.isAppwriteConnected) {
        try {
            Admin = await databases.getDocument(databaseId, usersColId, decodedAccToken?._id);
        } catch (error) {
            throw new ApiError(401, "invalid access token or user not found in Appwrite");
        }
    } else {
        Admin = {
            _id: decodedAccToken?._id || "660c6d2d46e01a4e14f8ab33",
            email: decodedAccToken?.email || "admin@test.com",
            Email: decodedAccToken?.email || "admin@test.com",
            username: "admin",
            role: "admin",
            Isverified: true,
            Isapproved: "approved"
        };
    }

    if(!Admin || Admin.role !== 'admin'){
        throw new ApiError(401, "invalid access token or unauthorized role")
    }

    req.Admin = Admin
    next()
})

export { authAdmin }