import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";

const router = Router();

router.post("/signup", AuthController.register);

router.post("/login", AuthController.login);

router.get("/me", AuthController.me);

export default router;
