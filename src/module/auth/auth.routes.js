import { Router } from "express";
import * as authController from "./auth.controller.js"
import { validate } from "../../shared/middlewares/validate.js";
import { loginSchema } from "./auth.schema.js";

const router = Router();

router
    .post("/login", validate(loginSchema), authController.login)
    .post("/logout", authController.logout);

export default { basePath: "/auth", routes: router };