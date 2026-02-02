import { Router } from "express";
import * as authController from "./auth.controller.js"
import { validate } from "../../shared/middlewares/validate.js";
import { loginSchema } from "./auth.schema.js";
import { createRateLimiter } from "../../shared/middlewares/rateLimiter.js";
import { RATE_LIMITS } from "../../shared/constants/rateLimits.js";

const router = Router();

router
    .post("/login", createRateLimiter(RATE_LIMITS.LOGIN), validate(loginSchema), authController.login)
    .post("/logout", authController.logout);

export default { basePath: "/auth", routes: router };