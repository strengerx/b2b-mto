import { Router } from "express";
import * as productsController from "./products.controller.js"

const router = Router();

router
    .get("/", productsController.index)
    .post("/", productsController.store)
    .get("/:id", productsController.show)
    .patch("/:id", productsController.update)
    .delete("/:id", productsController.destroy);

export default { basePath: "/products", routes: router }