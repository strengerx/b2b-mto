import { Router } from "express";
import user from "./module/users/users.routes.js"
import auth from "./module/auth/auth.routes.js"

const modules = [user, auth];

const router = Router();

modules.forEach((m) => router.use(m.basePath, m.routes));

export default router;