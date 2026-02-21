import { success, created } from "../../shared/responses/apiResponse.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { pickFields } from "../../shared/utils/pickFields.js";
import { categoryService } from "./categories.service.js";
import AppError from "../../shared/errors/AppError.js";
import { CATEGORY_FIELDS } from "./categories.constants.js";

const formatCategory = (category) => {
    if (!category) return null;
    return pickFields(category.toObject(), CATEGORY_FIELDS.public);
};

/**
 * ============================================================================
 * EXISTING ENDPOINTS
 * ============================================================================
 */

/**
 * GET /categories - List all active categories
 */
export const index = catchAsync(async (req, res) => {
    // const result = await categoryService.findAll(req.query, CATEGORY_FIELDS.public);
    return success(res, null, "All categories", 200, null);
});

/**
 * GET /categories/:id - Get category details
 */
export const show = catchAsync(async (req, res) => {
    const category = await categoryService.findById(req.params.id);

    if (!category) {
        throw new AppError("Category not found", 404);
    }

    return success(res, formatCategory(category), "Category details");
});

/**
 * POST /categories - Create new category (admin)
 */
export const store = catchAsync(async (req, res) => {
    const newCategory = await categoryService.create(req.body);
    return created(res, formatCategory(newCategory), "Category created successfully");
});

/**
 * PATCH /categories/:id - Update category (admin)
 */
export const update = catchAsync(async (req, res) => {
    const allowedUpdates = pickFields(req.body, CATEGORY_FIELDS.update);
    const updated = await categoryService.updateById(req.params.id, allowedUpdates);

    if (!updated) {
        throw new AppError("Category not found", 404);
    }

    return success(res, formatCategory(updated), "Category updated successfully");
});

/**
 * DELETE /categories/:id - Soft delete category (admin)
 */
export const destroy = catchAsync(async (req, res) => {
    const { cascade = "moveUp" } = req.query;

    if (!["moveUp", "archive"].includes(cascade)) {
        throw new AppError("Invalid cascade strategy. Use 'moveUp' or 'archive'", 400);
    }

    await categoryService.deleteWithCascade(req.params.id, cascade);
    return success(res, null, "Category deleted successfully");
});

/**
 * ============================================================================
 * PHASE 2: NEW ENDPOINTS
 * ============================================================================
 */

/**
 * GET /categories/tree/full - Get complete category tree (hierarchical)
 * Public endpoint for navigation/frontend use
 */
export const getFullTree = catchAsync(async (req, res) => {
    const tree = await categoryService.getFullTree();
    return success(res, tree, "Category tree retrieved");
});

/**
 * GET /categories/:id/breadcrumb - Get breadcrumb path for category
 * Useful for: "Home > Electronics > Computers > Laptops"
 */
export const getBreadcrumb = catchAsync(async (req, res) => {
    const breadcrumb = await categoryService.getBreadcrumb(req.params.id);
    return success(res, breadcrumb, "Breadcrumb retrieved");
});

/**
 * GET /categories/:id/children - Get direct children of a category
 */
export const getChildren = catchAsync(async (req, res) => {
    const children = await categoryService.getChildren(req.params.id);

    if (children.length === 0) {
        return success(res, [], "No subcategories found");
    }

    return success(res, children.map(formatCategory), "Subcategories retrieved");
});

/**
 * GET /categories/:id/descendants - Get all descendants (recursive)
 */
export const getDescendants = catchAsync(async (req, res) => {
    const descendants = await categoryService.getAllDescendants(req.params.id);

    if (descendants.length === 0) {
        return success(res, [], "No descendants found");
    }
    console.log(descendants);
    return success(res, descendants.map(formatCategory), "Descendants retrieved", 200);
});

/**
 * GET /categories/:id/tree - Get subtree starting from this category
 * Returns this category and all its children hierarchically
 */
export const getSubtree = catchAsync(async (req, res) => {
    const subtree = await categoryService.buildCategoryTree(req.params.id);

    if (!subtree) {
        throw new AppError("Category not found", 404);
    }

    return success(res, subtree, "Category subtree retrieved");
});

/**
 * ============================================================================
 * ADMIN ONLY: HEALTH & INTEGRITY
 * ============================================================================
 */

/**
 * GET /categories/admin/integrity-check - Check category tree integrity
 * Admin only - validates no circular refs, valid ancestors, proper depth, etc.
 */
export const checkIntegrity = catchAsync(async (req, res) => {
    const report = await categoryService.checkIntegrity();

    const status = report.issues === 0 ? "success" : "warning";

    return success(res, report, `Category integrity check complete (${report.issues} issues found)`, 200, {
        status,
        timestamp: new Date().toISOString()
    });
});

/**
 * ============================================================================
 * HELPER FUNCTION: Update category with better error handling
 * ============================================================================
 */

/**
 * Safely update category with validation
 * Handles circular references, parent validation, ancestor rebuild
 */
export const updateSafe = async (categoryId, data) => {
    try {
        const updated = await categoryService.updateById(categoryId, data);
        return {
            success: true,
            data: updated,
            error: null
        };
    } catch (err) {
        return {
            success: false,
            data: null,
            error: err.message
        };
    }
};
