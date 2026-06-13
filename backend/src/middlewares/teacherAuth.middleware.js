import { ApiError } from "../utils/ApiError.js";
import {Teacher} from "../models/teacher.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

const authTeacher = asyncHandler(async(req,_,next)=>{
    const accToken = req.cookies?.Accesstoken

    if(!accToken){
        throw new ApiError(401, "unauthorized req")
    }

    const decodedAccToken = jwt.verify(accToken,
        process.env.ACCESS_TOKEN_SECRET || "default_access_token_secret_key_1234")

    let teacher;
    if (global.isMongoConnected) {
        teacher = await Teacher.findById(decodedAccToken?._id).select("-Password -Refreshtoken")
    } else {
        teacher = {
            _id: decodedAccToken?._id || "660c6d2d46e01a4e14f8ab22",
            email: decodedAccToken?.email || "teacher@test.com",
            Email: decodedAccToken?.email || "teacher@test.com",
            firstName: "Parag",
            Firstname: "Parag",
            lastName: "Kadyan",
            Lastname: "Kadyan",
            role: "instructor",
            Isverified: true,
            Isapproved: "approved"
        };
    }

    if(!teacher || teacher.role !== 'instructor'){
        throw new ApiError(401, "invalid access token or unauthorized role")
    }

    req.teacher = teacher
    next()
})

export {authTeacher}