import { Router } from "express";
import * as usersController from "./users.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import authorize from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import { userSchema } from "./users.schema.js";

const router = Router();

router
    .get("/", authenticate, usersController.index)
    .post("/", validate(userSchema), usersController.store)

    // profile endpoints
    .get("/me", authenticate, usersController.me)
    .patch("/me", authenticate, usersController.updateMe)

    // admin / admin-protected operations
    .get("/:id", authenticate, authorize(["ADMIN"]), usersController.show)
    .patch("/:id", authenticate, authorize(["ADMIN"]), usersController.update)
    .delete("/:id", authenticate, authorize(["ADMIN"]), usersController.destroy)
    .post("/:id/restore", authenticate, authorize(["ADMIN"]), usersController.restore);

export default { basePath: "/users", routes: router };