import { Router } from "express";
import { handleContactSubmit } from "../controllers/contact.controller.js";

const router = Router();

router.post("/", handleContactSubmit);

export default router;
