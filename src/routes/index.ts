import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import newsRoutes from "./news.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/", newsRoutes);

export default router;
