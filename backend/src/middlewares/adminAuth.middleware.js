import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { admin } from "../models/admin.model.js";
import jwt from "jsonwebtoken";

const authAdmin = asyncHandler(async(req,_,next) =>{

    const accToken = req.cookies?.Accesstoken

    if(!accToken) {
        throw new ApiError(401, "unauthorized req")
    }


    const decodedAccToken = jwt.verify(accToken,
        process.env.ACCESS_TOKEN_SECRET || "default_access_token_secret_key_1234")

    const Admin = await admin.findById(decodedAccToken?._id).select("-password -Refreshtoken")

    if(!Admin || Admin.role !== 'admin'){
        throw new ApiError(401, "invalid access token or unauthorized role")
    }

    req.Admin = Admin
    next()

    
})

export { authAdmin }