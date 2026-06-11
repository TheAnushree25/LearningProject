import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        alias: 'Firstname'
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        alias: 'Lastname'
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        alias: 'Email'
    },
    password: {
        type: String,
        required: true,
        alias: 'Password'
    },
    role: {
        type: String,
        enum: ['student', 'instructor', 'admin'],
        required: true
    },
    
    // Compatibility fields for student/teacher
    Isverified: {
        type: Boolean,
        default: false
    },
    Isapproved: {
        type: String,
        enum: ['approved', 'rejected', 'pending', 'reupload'],
        default: 'pending'
    },
    Remarks: {
        type: String
    },
    Refreshtoken: {
        type: String
    },
    
    // Student specific references
    Studentdetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "studentdocs"
    },
    
    // Instructor specific references
    Teacherdetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "teacherdocs"
    },
    Balance: {
        type: Number,
        default: 0
    },
    WithdrawalHistory: [{
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    enrolledStudent: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        isNewEnrolled: {
            type: Boolean,
            default: true
        }
    }],

    // Admin compatibility
    username: {
        type: String,
        trim: true,
        lowercase: true
    },

    forgetPasswordToken: String,
    forgetPasswordExpiry: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true, aliases: true },
    toObject: { virtuals: true, aliases: true }
});

// Capitalization middleware for compatibility
userSchema.pre("save", async function(next) {
    if ((this.isModified('firstName') || this.isNew) && this.firstName) {
        this.firstName = this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1).toLowerCase();
    }
    if ((this.isModified('lastName') || this.isNew) && this.lastName) {
        this.lastName = this.lastName.charAt(0).toUpperCase() + this.lastName.slice(1).toLowerCase();
    }
    next();
});

// Hash password before saving
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Helper methods
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            Email: this.email, // compatibility
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d"
        }
    );
};

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            Email: this.email, // compatibility
            role: this.role
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d"
        }
    );
};

userSchema.methods.generateResetToken = async function() {
    const reset = crypto.randomBytes(20).toString('hex');
    this.forgetPasswordToken = crypto.createHash('sha256').update(reset).digest('hex');
    this.forgetPasswordExpiry = Date.now() + 15 * 60 * 1000;
    await this.save({ validateBeforeSave: false });
    return reset;
};

export const User = mongoose.model("User", userSchema);
