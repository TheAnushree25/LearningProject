import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {student} from "../models/student.model.js";
import jwt from "jsonwebtoken";

const authSTD = asyncHandler(async(req,_,next) =>{

    const accToken = req.cookies?.Accesstoken

    if(!accToken) {
        throw new ApiError(401, "unauthorized req")
    }

    const decodedAccToken = jwt.verify(accToken,
        process.env.ACCESS_TOKEN_SECRET || "default_access_token_secret_key_1234")

    let Student;
    if (global.isMongoConnected) {
        Student = await student.findById(decodedAccToken?._id).select("-Password -Refreshtoken")
    } else {
        Student = {
            _id: decodedAccToken?._id || "660c6d2d46e01a4e14f8ab11",
            email: decodedAccToken?.email || "student@test.com",
            Email: decodedAccToken?.email || "student@test.com",
            firstName: "Satyajit",
            Firstname: "Satyajit",
            lastName: "Roy",
            Lastname: "Roy",
            role: "student",
            Isverified: true,
            Isapproved: "approved"
        };
    }

    if(!Student || Student.role !== 'student'){
        throw new ApiError(401, "invalid access token or unauthorized role")
    }

    req.Student = Student
    next()
})

export { authSTD }