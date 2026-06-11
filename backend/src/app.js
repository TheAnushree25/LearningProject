import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import Razorpay from "razorpay"

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true
}));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


export const instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET
})

// auth routes
import authRouter from "./routes/auth.routes.js";
app.use("/api/auth", authRouter);

// contact routes
import contactRouter from "./routes/contact.routes.js";
app.use("/api/contact", contactRouter);

// progress routes
import progressRouter from "./routes/progress.routes.js";
app.use("/api/progress", progressRouter);

// dashboard routes
import dashboardRouter from "./routes/dashboard.routes.js";
app.use("/api/dashboard", dashboardRouter);

//student routes
import studentRouter from "./routes/student.routes.js";
app.use("/api/student", studentRouter)


//teacher routes
import teacherRouter from "./routes/teacher.routes.js"
app.use("/api/teacher", teacherRouter)

//course routes
import courseRouter from "./routes/course.routes.js"
app.use("/api/course", courseRouter)

import adminRouter from "./routes/admin.routes.js"
app.use("/api/admin", adminRouter)

import paymentRouter from "./routes/payment.routes.js"
app.use("/api/payment", paymentRouter)


export {app}