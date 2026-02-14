import { Router } from "express";
import * as productsController from "./products.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import authorize from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
    createProductSchema,
    updateProductSchema,
    productFilterSchema
} from "./products.schema.js";
import { ROLES } from "../users/users.constants.js";

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// List all published products with filters
router.get("/", validate(productFilterSchema, "query"), productsController.index);

// Search products
router.get("/search", productsController.search);

// Get products by category
router.get("/category/:categoryId", productsController.getByCategory);

// Get product details
router.get("/:id", productsController.show);

// Get price for specific quantity
router.get("/:id/pricing/:quantity", productsController.getPriceForQuantity);

// ============================================================================
// ADMIN PROTECTED ROUTES (Create, Update, Delete)
// ============================================================================

// Create new product
router.post(
    "/",
    authenticate,
    authorize([ROLES.ADMIN]),
    validate(createProductSchema),
    productsController.store
);

// Update product
router.patch(
    "/:id",
    authenticate,
    authorize([ROLES.ADMIN]),
    validate(updateProductSchema),
    productsController.update
);

// Delete product
router.delete(
    "/:id",
    authenticate,
    authorize([ROLES.ADMIN]),
    productsController.destroy
);

// Restore deleted product
router.post(
    "/:id/restore",
    authenticate,
    authorize([ROLES.ADMIN]),
    productsController.restore
);

// ============================================================================
// PUBLISH/UNPUBLISH ROUTES (Admin only)
// ============================================================================

// Publish product
router.post(
    "/:id/publish",
    authenticate,
    authorize([ROLES.ADMIN]),
    productsController.publish
);

// Unpublish product
router.post(
    "/:id/unpublish",
    authenticate,
    authorize([ROLES.ADMIN]),
    productsController.unpublish
);

// ============================================================================
// MEDIA MANAGEMENT ROUTES (Admin only)
// ============================================================================

// Add image to product
router.post(
    "/:id/media",
    authenticate,
    authorize([ROLES.ADMIN]),
    validate(
        {
            url: true,
            altText: false,
            isMain: false
        },
        "body",
        true
    ),
    productsController.addMedia
);

// Remove image from product
router.delete(
    "/:id/media/:imageIndex",
    authenticate,
    authorize([ROLES.ADMIN]),
    productsController.removeMedia
);

// ============================================================================
// ADMIN ANALYTICS ROUTES
// ============================================================================

// Get low stock products
router.get(
    "/admin/alerts/low-stock",
    authenticate,
    authorize([ROLES.ADMIN]),
    productsController.getLowStockAlerts
);

export default { basePath: "/products", routes: router };
