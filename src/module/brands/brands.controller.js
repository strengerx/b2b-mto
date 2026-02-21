import { success, created } from "../../shared/responses/apiResponse.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { pickFields } from "../../shared/utils/pickFields.js";
import { brandsService } from "./brands.service.js";
import { AppError } from "../../shared/errors/AppError.js";
import { BRAND_FIELDS } from "./brands.constants.js";

const formatBrand = (brand) => {
    if (!brand) return null;
    return pickFields(brand.toObject(), BRAND_FIELDS.public);
};

/**
 * ============================================================================
 * PUBLIC ENDPOINTS
 * ============================================================================
 */

/**
 * GET /brands - List all active brands
 */
export const index = catchAsync(async (req, res) => {
    const query = req.validated?.query || {};
    const result = await brandsService.getPublished(query, BRAND_FIELDS.public);
    return success(res, result.data, "Brands retrieved", 200, result.meta);
});

/**
 * GET /brands/search - Search brands by text
 */
export const search = catchAsync(async (req, res) => {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
        return success(res, [], "No search query provided");
    }

    const results = await brandsService.search(q, parseInt(limit));
    return success(res, results.map(formatBrand), "Search results");
});

/**
 * GET /brands/featured - Get featured brands
 */
export const getFeatured = catchAsync(async (req, res) => {
    const { limit = 10 } = req.query;
    const brands = await brandsService.getFeatured(parseInt(limit));
    return success(res, brands.map(formatBrand), "Featured brands retrieved");
});

/**
 * GET /brands/verified - Get verified brands only
 */
export const getVerified = catchAsync(async (req, res) => {
    const result = await brandsService.getVerified(req.query);
    return success(res, result.data.map(formatBrand), "Verified brands retrieved", 200, result.meta);
});

/**
 * GET /brands/trending - Get trending brands
 */
export const getTrending = catchAsync(async (req, res) => {
    const { limit = 10, days = 7 } = req.query;
    const brands = await brandsService.getTrending(parseInt(limit), parseInt(days));
    return success(res, brands.map(formatBrand), "Trending brands retrieved");
});

/**
 * GET /brands/country/:country - Get brands by country
 */
export const getByCountry = catchAsync(async (req, res) => {
    const { country } = req.params;
    const { limit = 20 } = req.query;

    const brands = await brandsService.getByCountry(country, { limit: parseInt(limit) });
    return success(res, brands.map(formatBrand), `Brands from ${country}`);
});

/**
 * GET /brands/top - Get top brands by product count
 */
export const getTop = catchAsync(async (req, res) => {
    const { limit = 10 } = req.query;
    const brands = await brandsService.getTopByProductCount(parseInt(limit));
    return success(res, brands.map(formatBrand), "Top brands by product count");
});

/**
 * GET /brands/:id - Get brand details
 */
export const show = catchAsync(async (req, res) => {
    const brand = await brandsService.findById(req.params.id);

    if (!brand) {
        throw new AppError("Brand not found", 404);
    }

    // Increment view count
    await brandsService.incrementViews(req.params.id);

    return success(res, formatBrand(brand), "Brand details retrieved");
});

/**
 * ============================================================================
 * ADMIN ENDPOINTS (Require Authentication)
 * ============================================================================
 */

/**
 * POST /brands - Create new brand
 */
export const store = catchAsync(async (req, res) => {
    const newBrand = await brandsService.create(req.body);
    return created(res, formatBrand(newBrand), "Brand created successfully");
});

/**
 * PATCH /brands/:id - Update brand
 */
export const update = catchAsync(async (req, res) => {
    const brand = await brandsService.findById(req.params.id);

    if (!brand) {
        throw new AppError("Brand not found", 404);
    }

    // Filter allowed updates
    const allowedUpdates = pickFields(req.body, BRAND_FIELDS.update);

    const updated = await brandsService.updateById(req.params.id, allowedUpdates);

    if (!updated) {
        throw new AppError("Brand not found", 404);
    }

    return success(res, formatBrand(updated), "Brand updated successfully");
});

/**
 * DELETE /brands/:id - Soft delete brand
 */
export const destroy = catchAsync(async (req, res) => {
    const brand = await brandsService.findById(req.params.id);

    if (!brand) {
        throw new AppError("Brand not found", 404);
    }

    await brandsService.deleteById(req.params.id);
    return success(res, null, "Brand deleted successfully");
});

/**
 * POST /brands/:id/restore - Restore deleted brand
 */
export const restore = catchAsync(async (req, res) => {
    const restored = await brandsService.restoreById(req.params.id);

    if (!restored) {
        throw new AppError("Brand not found or not deleted", 404);
    }

    return success(res, formatBrand(restored), "Brand restored successfully");
});

/**
 * ============================================================================
 * ADMIN ACTIONS
 * ============================================================================
 */

/**
 * POST /brands/:id/verify - Verify brand (admin)
 */
export const verifyBrand = catchAsync(async (req, res) => {
    const brand = await brandsService.findById(req.params.id);

    if (!brand) {
        throw new AppError("Brand not found", 404);
    }

    const verified = await brandsService.verify(req.params.id);
    return success(res, pickFields(verified.toObject(), ["_id", "name", "status"]), "Brand verified");
});

/**
 * POST /brands/:id/unverify - Unverify brand (admin)
 */
export const unverifyBrand = catchAsync(async (req, res) => {
    const brand = await brandsService.findById(req.params.id);

    if (!brand) {
        throw new AppError("Brand not found", 404);
    }

    const unverified = await brandsService.unverify(req.params.id);
    return success(res, pickFields(unverified.toObject(), ["_id", "name", "status"]), "Brand unverified");
});

/**
 * PATCH /brands/:id/popularity - Update popularity score (admin)
 */
export const updatePopularity = catchAsync(async (req, res) => {
    const { score } = req.body;

    if (typeof score !== "number" || score < 0) {
        throw new AppError("Score must be a non-negative number", 400);
    }

    const brand = await brandsService.updatePopularityScore(req.params.id, score);

    if (!brand) {
        throw new AppError("Brand not found", 404);
    }

    return success(res, pickFields(brand.toObject(), ["_id", "name", "metrics"]), "Popularity score updated");
});