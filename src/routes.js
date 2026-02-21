import { Router } from "express";
import user from "./module/users/users.routes.js";
import auth from "./module/auth/auth.routes.js";
import category from "./module/categories/categories.routes.js";
import products from "./module/products/products.routes.js";
import brands from "./module/brands/brands.routes.js";

const router = Router();

// Public routes (auth + user registration)
router.use(auth.basePath, auth.routes);
router.use(user.basePath, user.routes);
router.use(category.basePath, category.routes);
router.use(products.basePath, products.routes);
router.use(brands.basePath, brands.routes);

export default router;