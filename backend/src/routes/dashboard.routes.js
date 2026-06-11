import { Router } from "express";
import { getStudentStats, getTeacherStats, getAdminStats } from "../controllers/dashboard.controller.js";
import { authSTD } from "../middlewares/stdAuth.middleware.js";
import { authTeacher } from "../middlewares/teacherAuth.middleware.js";
import { authAdmin } from "../middlewares/adminAuth.middleware.js";

const router = Router();

router.get("/student/:studentId", authSTD, getStudentStats);
router.get("/teacher/:teacherId", authTeacher, getTeacherStats);
router.get("/admin/:adminID", authAdmin, getAdminStats);

export default router;
