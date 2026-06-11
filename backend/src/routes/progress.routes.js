import { Router } from "express";
import { getProgress, updateProgress, getProgressStats } from "../controllers/progress.controller.js";
import { authSTD } from "../middlewares/stdAuth.middleware.js";

const router = Router();

router.use(authSTD); // Protect progress routes for students

router.get("/:courseId/:videoId", getProgress);
router.post("/update", updateProgress);
router.get("/stats/:userId/:courseId", getProgressStats);

export default router;
