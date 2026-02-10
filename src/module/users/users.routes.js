import { Router } from "express";
import * as usersController from "./users.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { validate } from "../../shared/middlewares/validate.js";
import { userSchema } from "./users.schema.js";

const router = Router();

router
    .get("/", authenticate, usersController.index)
    .post("/", validate(userSchema), usersController.store);

export default { basePath: "/users", routes: router };