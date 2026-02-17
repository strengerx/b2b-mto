import { BaseService } from "../../shared/services/BaseService.js";
import Category from "./categories.model.js";
import AppError from "../../shared/errors/AppError.js";
import { MAX_CATEGORY_DEPTH } from "./categories.constants.js";

export default class CategoryService extends BaseService {
    constructor() {
        super(Category, {
            searchFields: ["name", "description"],
            defaultSort: "order",
            softDelete: true
        });
    }

    /**
     * ============================================================================
     * PHASE 1: CRITICAL FIXES
     * ============================================================================
     */

    /**
     * Build complete ancestor path for a category
     * @param {string|ObjectId} parentId - Parent category ID
     * @returns {Promise<Array>} Array of ancestors from root to parent
     */
    async buildAncestorPath(parentId) {
        if (!parentId) return [];

        const parent = await this.model.findOne({
            _id: parentId,
            deletedAt: null
        }).select("_id slug name ancestors");

        if (!parent) {
            throw new AppError("Parent category does not exist", 400);
        }

        // Combine parent's ancestors with the parent itself
        const ancestorPath = [
            ...parent.ancestors,
            {
                _id: parent._id,
                slug: parent.slug,
                name: parent.name
            }
        ];

        return ancestorPath;
    }

    /**
     * Validate circular reference prevention
     * @param {string|ObjectId} categoryId - Category being updated
     * @param {string|ObjectId} newParentId - New parent ID
     * @throws {AppError} If circular reference detected
     */
    async validateNoCircularReference(categoryId, newParentId) {
        if (!newParentId) return; // No parent = root level, always valid

        // Check if trying to set self as parent
        if (categoryId.toString() === newParentId.toString()) {
            throw new AppError("Category cannot be its own parent", 400);
        }

        // Check if newParentId is a descendant of categoryId
        const descendants = await this.model.find({
            "ancestors._id": categoryId,
            deletedAt: null
        });

        const isDescendant = descendants.some(d =>
            d._id.toString() === newParentId.toString()
        );

        if (isDescendant) {
            throw new AppError(
                "Cannot set a descendant as parent (would create circular reference)",
                400
            );
        }

        // Check depth limit
        const newParent = await this.model.findById(newParentId);
        if (newParent && newParent.level >= MAX_CATEGORY_DEPTH) {
            throw new AppError(
                `Cannot nest deeper than level ${MAX_CATEGORY_DEPTH}. Parent is at level ${newParent.level}`,
                400
            );
        }
    }

    /**
     * Validate parent category exists
     * @param {string|ObjectId} parentId - Parent category ID
     * @throws {AppError} If parent doesn't exist
     */
    async validateParentExists(parentId) {
        if (!parentId) return; // null is valid (root level)

        const parent = await this.model.findOne({
            _id: parentId,
            deletedAt: null
        });

        if (!parent) {
            throw new AppError("Parent category does not exist or has been deleted", 400);
        }
    }

    /**
     * Create category with validation
     * @param {Object} data - Category data
     * @returns {Promise<Object>}
     */
    async create(data) {
        // Validate parent if provided
        if (data.parentId) {
            await this.validateParentExists(data.parentId);
        }

        // Build ancestor path
        const ancestorPath = await this.buildAncestorPath(data.parentId);
        const level = ancestorPath.length;

        const category = await this.model.create({
            ...data,
            ancestors: ancestorPath,
            level
        });

        return category;
    }

    /**
     * Update category with validation and ancestor rebuild
     * @param {string|ObjectId} id - Category ID
     * @param {Object} data - Update data
     * @throws {AppError} If validation fails
     * @returns {Promise<Object|null>}
     */
    async updateById(id, data) {
        // Validate parent if being changed
        if (data.parentId !== undefined) {
            await this.validateParentExists(data.parentId);
            await this.validateNoCircularReference(id, data.parentId);

            // Rebuild ancestors if parent changed
            const ancestorPath = await this.buildAncestorPath(data.parentId);
            data.ancestors = ancestorPath;
            data.level = ancestorPath.length;
        }

        const category = await this.model.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        );

        return category;
    }

    /**
     * ============================================================================
     * PHASE 2: NEW FEATURES
     * ============================================================================
     */

    /**
     * Get full category tree (hierarchical structure)
     * @returns {Promise<Array>} Tree of root categories with children
     */
    async getFullTree() {
        const rootCategories = await this.model
            .find({
                parentId: null,
                deletedAt: null,
                "status.isActive": true
            })
            .sort({ order: 1 })
            .select("_id name slug icon order");

        // Build tree with children recursively
        const tree = await Promise.all(
            rootCategories.map(root => this.buildCategoryTree(root._id))
        );

        return tree;
    }

    /**
     * Build tree for a single category including all descendants
     * @param {string|ObjectId} categoryId - Root category ID
     * @returns {Promise<Object>}
     */
    async buildCategoryTree(categoryId) {
        const category = await this.model
            .findById(categoryId)
            .select("_id name slug icon order");

        if (!category) return null;

        const children = await this.model
            .find({
                parentId: categoryId,
                deletedAt: null,
                "status.isActive": true
            })
            .sort({ order: 1 })
            .select("_id name slug icon order");

        const tree = {
            _id: category._id,
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            order: category.order,
            children: []
        };

        if (children.length > 0) {
            tree.children = await Promise.all(
                children.map(child => this.buildCategoryTree(child._id))
            );
        }

        return tree;
    }

    /**
     * Get breadcrumb path for a category
     * @param {string|ObjectId} categoryId - Category ID
     * @returns {Promise<Array>} Breadcrumb path from root to category
     */
    async getBreadcrumb(categoryId) {
        const category = await this.model.findById(categoryId).select("_id name slug ancestors");

        if (!category) {
            throw new AppError("Category not found", 404);
        }

        // Build breadcrumb: ancestors + current category
        const breadcrumb = [
            ...category.ancestors.map(a => ({
                _id: a._id,
                name: a.name,
                slug: a.slug
            })),
            {
                _id: category._id,
                name: category.name,
                slug: category.slug
            }
        ];

        return breadcrumb;
    }

    /**
     * Get all descendants of a category
     * @param {string|ObjectId} categoryId - Parent category ID
     * @returns {Promise<Array>}
     */
    async getAllDescendants(categoryId) {
        const descendants = await this.model.find({
            "ancestors._id": categoryId,
            deletedAt: null
        });

        return descendants;
    }

    /**
     * Sync product count for a category
     * @param {string|ObjectId} categoryId - Category ID
     * @param {number} count - New count
     * @returns {Promise<Object>} Updated category
     */
    async syncProductCount(categoryId, count) {
        const category = await this.model.findByIdAndUpdate(
            categoryId,
            { "metrics.productCount": count },
            { new: true }
        );

        return category;
    }

    /**
     * Increment product count (called when product added to category)
     * @param {string|ObjectId} categoryId - Category ID
     * @param {number} amount - Amount to increment (default 1)
     * @returns {Promise<Object>}
     */
    async incrementProductCount(categoryId, amount = 1) {
        const category = await this.model.findByIdAndUpdate(
            categoryId,
            { $inc: { "metrics.productCount": amount } },
            { new: true }
        );

        return category;
    }

    /**
     * Decrement product count (called when product removed from category)
     * @param {string|ObjectId} categoryId - Category ID
     * @param {number} amount - Amount to decrement (default 1)
     * @returns {Promise<Object>}
     */
    async decrementProductCount(categoryId, amount = 1) {
        const category = await this.model.findByIdAndUpdate(
            categoryId,
            { $inc: { "metrics.productCount": -amount } },
            { new: true }
        );

        return category;
    }

    /**
     * Soft delete with cascade logic
     * Moves all children to parent's level or archives them
     * @param {string|ObjectId} categoryId - Category to delete
     * @param {string} cascadeStrategy - 'moveUp' or 'archive'
     * @returns {Promise<Object>}
     */
    async deleteWithCascade(categoryId, cascadeStrategy = "moveUp") {
        const category = await this.model.findById(categoryId);

        if (!category) {
            throw new AppError("Category not found", 404);
        }

        const hasChildren = await this.model.exists({
            parentId: categoryId,
            deletedAt: null
        });

        if (hasChildren) {
            if (cascadeStrategy === "moveUp") {
                // Move children to parent's level
                await this.model.updateMany(
                    { parentId: categoryId, deletedAt: null },
                    {
                        parentId: category.parentId || null,
                        ancestors: category.ancestors
                    }
                );
            } else if (cascadeStrategy === "archive") {
                // Archive all children
                await this.model.updateMany(
                    { parentId: categoryId, deletedAt: null },
                    { "status.isActive": false }
                );
            }
        }

        // Soft delete the category itself
        const deleted = await this.deleteById(categoryId);

        return deleted;
    }

    /**
     * Check category integrity (admin utility)
     * Validates no circular references, ancestors valid, etc.
     * @returns {Promise<Object>} Report of issues found
     */
    async checkIntegrity() {
        const report = {
            totalCategories: 0,
            circularRefs: [],
            invalidAncestors: [],
            orphanedCategories: [],
            depthViolations: [],
            issues: 0
        };

        const categories = await this.model.find({ deletedAt: null });
        report.totalCategories = categories.length;

        for (const cat of categories) {
            // Check circular reference
            if (cat.parentId) {
                const descendants = await this.model.find({
                    "ancestors._id": cat._id
                });
                if (descendants.some(d => d._id.equals(cat.parentId))) {
                    report.circularRefs.push({
                        categoryId: cat._id,
                        name: cat.name,
                        issue: "Circular reference detected"
                    });
                    report.issues++;
                }
            }

            // Check parent exists
            if (cat.parentId) {
                const parent = await this.model.findOne({ _id: cat.parentId });
                if (!parent) {
                    report.orphanedCategories.push({
                        categoryId: cat._id,
                        name: cat.name,
                        parentId: cat.parentId
                    });
                    report.issues++;
                }
            }

            // Check depth limit
            if (cat.level > MAX_CATEGORY_DEPTH) {
                report.depthViolations.push({
                    categoryId: cat._id,
                    name: cat.name,
                    level: cat.level,
                    maxLevel: MAX_CATEGORY_DEPTH
                });
                report.issues++;
            }

            // Validate ancestors path
            for (const ancestor of cat.ancestors) {
                const ancestorCat = await this.model.findById(ancestor._id);
                if (!ancestorCat) {
                    report.invalidAncestors.push({
                        categoryId: cat._id,
                        name: cat.name,
                        invalidAncestorId: ancestor._id
                    });
                    report.issues++;
                    break;
                }
            }
        }

        return report;
    }

    /**
     * ============================================================================
     * EXISTING METHODS (Already implemented)
     * ============================================================================
     */

    async getRootCategories() {
        return this.model.find({
            parentId: null,
            deletedAt: null
        }).sort({ order: 1 });
    }

    async getChildren(parentId) {
        return this.model.find({
            parentId,
            deletedAt: null
        }).sort({ order: 1 });
    }
}

export const categoryService = new CategoryService();