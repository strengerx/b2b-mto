import { Router } from "express";
import * as brandsController from "./brands.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
    createBrandSchema,
    updateBrandSchema,
    brandFilterSchema,
} from "./brands.schema.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import authorize from "../../shared/middlewares/authorize.js";
import { createRateLimiter } from "../../shared/middlewares/rateLimiter.js";
import { ROLES } from "../users/users.constants.js";

// Rate limiters
const brandCreateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50,
});

const brandUpdateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

const router = Router();

/**
 * ============================================================================
 * PUBLIC ROUTES (No Auth Required)
 * ============================================================================
 */

// List all brands with filtering
router.get("/", validate(brandFilterSchema), brandsController.index);

// Search brands
router.get("/search", brandsController.search);

// Get featured brands
router.get("/featured", brandsController.getFeatured);

// Get verified brands
router.get("/verified", brandsController.getVerified);

// Get trending brands
router.get("/trending", brandsController.getTrending);

// Get top brands by product count
router.get("/top", brandsController.getTop);

// Get brands by country
router.get("/country/:country", brandsController.getByCountry);

/**
 * ============================================================================
 * ID-BASED PUBLIC ROUTE (Must come after specific routes)
 * ============================================================================
 */

// Get brand details
router.get("/:id", brandsController.show);

/**
 * ============================================================================
 * ADMIN WRITE OPERATIONS (Create, Update, Delete)
 * ============================================================================
 */

// Create new brand
router.post(
    "/",
    authenticate,
    authorize([ROLES.ADMIN]),
    brandCreateLimiter,
    validate(createBrandSchema),
    brandsController.store,
);

// Update brand
router.patch(
    "/:id",
    authenticate,
    authorize([ROLES.ADMIN]),
    brandUpdateLimiter,
    validate(updateBrandSchema),
    brandsController.update,
);

// Delete brand
router.delete(
    "/:id",
    authenticate,
    authorize([ROLES.ADMIN]),
    brandUpdateLimiter,
    brandsController.destroy,
);

// Restore deleted brand
router.post(
    "/:id/restore",
    authenticate,
    authorize([ROLES.ADMIN]),
    brandsController.restore,
);

/**
 * ============================================================================
 * ADMIN ACTIONS
 * ============================================================================
 */

// Verify brand
router.post(
    "/:id/verify",
    authenticate,
    authorize([ROLES.ADMIN]),
    brandsController.verifyBrand,
);

// Unverify brand
router.post(
    "/:id/unverify",
    authenticate,
    authorize([ROLES.ADMIN]),
    brandsController.unverifyBrand,
);

// Update popularity score
router.patch(
    "/:id/popularity",
    authenticate,
    authorize([ROLES.ADMIN]),
    brandsController.updatePopularity,
);

export default { basePath: "/brands", routes: router };
