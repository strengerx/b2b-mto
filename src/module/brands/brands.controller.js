import { success, created } from "../../shared/responses/apiResponse.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { pickFields } from "../../shared/utils/pickFields.js";
import { brandsService } from "./brands.service.js";
import { AppError } from "../../shared/errors/AppError.js";
import { BRAND_FIELDS } from "./brands.constants.js";

/* ============================================================
    FORMATTER
============================================================ */

const formatBrand = (brand) => {
    if (!brand) return null;

    return pickFields(
        brand.toObject ? brand.toObject() : brand,
        BRAND_FIELDS.public
    );
};

/* ============================================================
    PUBLIC ENDPOINTS
============================================================ */

/**
 * GET /brands
 */
export const index = catchAsync(async (req, res) => {
    const query = req.validated?.query || {};
    const result = await brandsService.findAll(query, BRAND_FIELDS.public);
    return success(res, result.data.map(formatBrand), "Brands retrieved", 200, result.meta);
});

/**
 * GET /brands/search
 */
export const search = catchAsync(async (req, res) => {

    const { q, limit = 20 } = req.query;

    if (!q?.trim()) {
        return success(res, [], "No search query provided");
    }

    const result =
        await brandsService.search(q, parseInt(limit));

    return success(
        res,
        result.data.map(formatBrand),
        "Search results"
    );
});

/**
 * GET /brands/featured
 */
export const getFeatured = catchAsync(async (req, res) => {

    const result =
        await brandsService.getFeatured(req.query);

    return success(
        res,
        result.data.map(formatBrand),
        "Featured brands retrieved",
        200,
        result.meta
    );
});

/**
 * GET /brands/verified
 */
export const getVerified = catchAsync(async (req, res) => {

    const result =
        await brandsService.getVerified(req.query);

    return success(
        res,
        result.data.map(formatBrand),
        "Verified brands retrieved",
        200,
        result.meta
    );
});

/**
 * GET /brands/trending
 */
export const getTrending = catchAsync(async (req, res) => {

    const result =
        await brandsService.getTrending(req.query);

    return success(
        res,
        result.data.map(formatBrand),
        "Trending brands retrieved",
        200,
        result.meta
    );
});

/**
 * GET /brands/country/:country
 */
export const getByCountry = catchAsync(async (req, res) => {

    const result =
        await brandsService.getByCountry(
            req.params.country,
            req.query
        );

    return success(
        res,
        result.data.map(formatBrand),
        `Brands from ${req.params.country}`,
        200,
        result.meta
    );
});

/**
 * GET /brands/top
 */
export const getTop = catchAsync(async (req, res) => {

    const result =
        await brandsService.getTopByProductCount(req.query);

    return success(
        res,
        result.data.map(formatBrand),
        "Top brands by product count",
        200,
        result.meta
    );
});

/**
 * GET /brands/:id
 */
export const show = catchAsync(async (req, res) => {

    const result =
        await brandsService.findById(req.params.id);

    if (!result.data) {
        throw new AppError("Brand not found", 404);
    }

    await brandsService.incrementViews(req.params.id);

    return success(
        res,
        formatBrand(result.data),
        "Brand details retrieved"
    );
});

/* ============================================================
    ADMIN ENDPOINTS
============================================================ */

/**
 * POST /brands
 */
export const store = catchAsync(async (req, res) => {

    const result =
        await brandsService.create(req.body);

    return created(
        res,
        formatBrand(result.data),
        "Brand created successfully"
    );
});

/**
 * PATCH /brands/:id
 */
export const update = catchAsync(async (req, res) => {

    const allowedUpdates =
        pickFields(req.body, BRAND_FIELDS.update);

    const result =
        await brandsService.updateById(
            req.params.id,
            allowedUpdates
        );

    if (!result.data) {
        throw new AppError("Brand not found", 404);
    }

    return success(
        res,
        formatBrand(result.data),
        "Brand updated successfully"
    );
});

/**
 * DELETE /brands/:id
 */
export const destroy = catchAsync(async (req, res) => {

    const result =
        await brandsService.deleteById(req.params.id);

    if (!result.data) {
        throw new AppError("Brand not found", 404);
    }

    return success(
        res,
        null,
        "Brand deleted successfully"
    );
});

/**
 * POST /brands/:id/restore
 */
export const restore = catchAsync(async (req, res) => {

    const result =
        await brandsService.restoreById(req.params.id);

    if (!result?.data) {
        throw new AppError(
            "Brand not found or not deleted",
            404
        );
    }

    return success(
        res,
        formatBrand(result.data),
        "Brand restored successfully"
    );
});

/* ============================================================
    ADMIN ACTIONS
============================================================ */

/**
 * POST /brands/:id/verify
 */
export const verifyBrand = catchAsync(async (req, res) => {

    const result =
        await brandsService.verify(req.params.id);

    if (!result.data)
        throw new AppError("Brand not found", 404);

    return success(
        res,
        pickFields(
            result.data.toObject(),
            ["_id", "name", "status"]
        ),
        "Brand verified"
    );
});

/**
 * POST /brands/:id/unverify
 */
export const unverifyBrand = catchAsync(async (req, res) => {

    const result =
        await brandsService.unverify(req.params.id);

    if (!result.data)
        throw new AppError("Brand not found", 404);

    return success(
        res,
        pickFields(
            result.data.toObject(),
            ["_id", "name", "status"]
        ),
        "Brand unverified"
    );
});

/**
 * PATCH /brands/:id/popularity
 */
export const updatePopularity = catchAsync(async (req, res) => {

    const { score } = req.body;

    if (typeof score !== "number" || score < 0) {
        throw new AppError(
            "Score must be a non-negative number",
            400
        );
    }

    const result =
        await brandsService.updatePopularityScore(
            req.params.id,
            score
        );

    if (!result.data)
        throw new AppError("Brand not found", 404);

    return success(
        res,
        pickFields(
            result.data.toObject(),
            ["_id", "name", "metrics"]
        ),
        "Popularity score updated"
    );
});