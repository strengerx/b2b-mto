import { Router } from "express";
import * as categoryController from "./categories.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { categorySchema, updateCategorySchema } from "./categories.schema.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import authorize from "../../shared/middlewares/authorize.js";
import { createRateLimiter } from "../../shared/middlewares/rateLimiter.js";
import { ROLES } from "../users/users.constants.js";

// Rate limiters
const categoryCreateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50 // 50 requests per window
});

const categoryUpdateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
});

const router = Router();

/**
 * ============================================================================
 * PUBLIC ROUTES (No Auth Required)
 * ============================================================================
 */

// Get complete hierarchical tree
router.get("/tree/full", categoryController.getFullTree);

// List all categories with pagination
router.get("/", categoryController.index);

/**
 * ============================================================================
 * CATEGORY-SPECIFIC ROUTES (Must come before /:id routes)
 * ============================================================================
 */

// Admin: Integrity check
router.get(
    "/admin/integrity-check",
    authenticate,
    authorize([ROLES.ADMIN]),
    categoryController.checkIntegrity
);

/**
 * ============================================================================
 * ID-BASED ROUTES (Come after specific routes to avoid conflicts)
 * ============================================================================
 */

// Get category details
router.get("/:id", categoryController.show);

// Get breadcrumb for category
router.get("/:id/breadcrumb", categoryController.getBreadcrumb);

// Get direct children
router.get("/:id/children", categoryController.getChildren);

// Get all descendants
router.get("/:id/descendants", categoryController.getDescendants);

// Get subtree (this category + all children hierarchically)
router.get("/:id/tree", categoryController.getSubtree);

/**
 * ============================================================================
 * ADMIN WRITE OPERATIONS (Create, Update, Delete)
 * ============================================================================
 */

// Create new category
router.post(
    "/",
    authenticate,
    authorize([ROLES.ADMIN]),
    categoryCreateLimiter,
    validate(categorySchema),
    categoryController.store
);

// Update category
router.patch(
    "/:id",
    authenticate,
    authorize([ROLES.ADMIN]),
    categoryUpdateLimiter,
    validate(updateCategorySchema),
    categoryController.update
);

// Delete category (with cascade strategy)
router.delete(
    "/:id",
    authenticate,
    authorize([ROLES.ADMIN]),
    categoryUpdateLimiter,
    categoryController.destroy
);

export default { basePath: "/categories", routes: router };