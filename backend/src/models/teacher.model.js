import mongoose from "mongoose";
import { User } from "./user.model.js";

const TeacherDetailsSchema = new mongoose.Schema({
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

    Experience:{
        type:Number,
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

    UGcollege:{
        type:String,
        required:true,
    },

    PGcollege:{
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

    UGmarks:{
        type:Number,
        required:true,
    },

    PGmarks:{
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

    UG:{
        type:String,
        required:true,
    },

    PG:{
        type:String,
        required:true,
    }

}, {
    timestamps:true,
});

const Teacher = User;
const Teacherdocs = mongoose.models.Teacherdocs || mongoose.model("Teacherdocs", TeacherDetailsSchema);

export { Teacher, Teacherdocs };
