import mongoose from "mongoose";
import { User } from "./user.model.js";

const studentDetailsSchema = new mongoose.Schema({
    Phone:{
        type:Number,
        required: true,
        trim:true,
        unique:true,
    },

    Address:{
        type:String,
        required:true,
    },

    Highesteducation:{
        type:String,
        required:true,
    },

    SecondarySchool:{
        type:String,
        required:true,
    },

    HigherSchool:{
        type:String,
        required:true,
    },

    SecondaryMarks:{
        type:Number,
        required:true,
    },

    HigherMarks:{
        type:Number,
        required:true,
    },

    Aadhaar:{
        type:String,
        required:true,
    },

    Secondary:{
        type:String,
        required:true,
    },

    Higher:{
        type:String,
        required:true,
    },

}, {
    timestamps:true,
});

const student = User;
const studentdocs = mongoose.models.studentdocs || mongoose.model("studentdocs", studentDetailsSchema);

export { student, studentdocs };