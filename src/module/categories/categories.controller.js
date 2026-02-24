import { success, created } from "../../shared/responses/apiResponse.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { pickFields } from "../../shared/utils/pickFields.js";
import { categoryService } from "./categories.service.js";
import AppError from "../../shared/errors/AppError.js";
import { CATEGORY_FIELDS } from "./categories.constants.js";

/* ============================================================
    FORMATTER
============================================================ */
const formatCategory = (category) => {
    if (!category) return null;
    return pickFields(category.toObject ? category.toObject() : category, CATEGORY_FIELDS.public);
};

/* ============================================================
    BASIC CRUD
============================================================ */

/**
 * GET /categories
 */
export const index = catchAsync(async (req, res) => {
    const result = await categoryService.findAll(req.query, CATEGORY_FIELDS.public);
    return success(res, result.data.map(formatCategory), "All categories", 200, result.meta);
});

/**
 * GET /categories/:id
 */
export const show = catchAsync(async (req, res) => {
    const result = await categoryService.findById(req.params.id);
    if (!result.data) throw new AppError("Category not found", 404);
    return success(res, formatCategory(result.data), "Category details");
});

/**
 * POST /categories
 */
export const store = catchAsync(async (req, res) => {
    const result = await categoryService.create(req.body);
    return created(res, formatCategory(result.data), "Category created successfully");
});

/**
 * PATCH /categories/:id
 */
export const update = catchAsync(async (req, res) => {
    const allowedUpdates = pickFields(req.body, CATEGORY_FIELDS.update);
    const result = await categoryService.updateById(req.params.id, allowedUpdates);
    if (!result.data) throw new AppError("Category not found", 404);
    return success(res, formatCategory(result.data), "Category updated successfully");
});

/**
 * DELETE /categories/:id
 */
export const destroy = catchAsync(async (req, res) => {
    const { cascade = "moveUp" } = req.query;
    if (!["moveUp", "archive"].includes(cascade)) {
        throw new AppError("Invalid cascade strategy", 400);
    }
    const result = await categoryService.deleteWithCascade(req.params.id, cascade);
    if (!result?.data) throw new AppError("Category not found", 404);
    return success(res, null, "Category deleted successfully");
});

/* ============================================================
    TREE ENDPOINTS
============================================================ */

/**
 * GET /categories/tree/full
 */
export const getFullTree = catchAsync(async (req, res) => {
    const result = await categoryService.getFullTree();
    return success(res, result.data, "Category tree retrieved");
});

/**
 * GET /categories/:id/breadcrumb
 */
export const getBreadcrumb = catchAsync(async (req, res) => {
    const result = await categoryService.getBreadcrumb(req.params.id);
    return success(res, result.data, "Breadcrumb retrieved");
});

/**
 * GET /categories/:id/children
 */
export const getChildren = catchAsync(async (req, res) => {
    const result = await categoryService.getChildren(req.params.id);
    if (!result.data.length) {
        return success(res, [], "No subcategories found");
    }
    return success(res, result.data.map(formatCategory), "Subcategories retrieved");
});

/**
 * GET /categories/:id/descendants
 */
export const getDescendants = catchAsync(async (req, res) => {
    const result = await categoryService.getAllDescendants(req.params.id);
    if (!result.data.length) {
        return success(res, [], "No descendants found");
    }
    return success(res, result.data.map(formatCategory), "Descendants retrieved");
});

/**
 * GET /categories/:id/tree
 */
export const getSubtree = catchAsync(async (req, res) => {
    const subtree = await categoryService.buildCategoryTree(req.params.id);
    if (!subtree) throw new AppError("Category not found", 404);
    return success(res, subtree, "Category subtree retrieved");
});

/* ============================================================
    ADMIN HEALTH CHECK
============================================================ */

/**
 * GET /categories/admin/integrity-check
 */
export const checkIntegrity = catchAsync(async (req, res) => {
    const report = await categoryService.checkIntegrity();
    const status = report.issues === 0 ? "success" : "warning";

    return success(res, report,
        `Integrity check complete (${report.issues} issues found)`,
        200,
        { status, timestamp: new Date().toISOString() }
    );
});

/* ============================================================
    SAFE UPDATE HELPER
============================================================ */

export const updateSafe = async (categoryId, data) => {
    try {
        const result = await categoryService.updateById(categoryId, data);
        return { success: true, data: result.data, error: null };
    } catch (err) {
        return { success: false, data: null, error: err.message };
    }
};