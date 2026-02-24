import { BaseService } from "../../shared/services/BaseService.js";
import Category from "./categories.model.js";
import { AppError } from "../../shared/errors/AppError.js";
import { MAX_CATEGORY_DEPTH } from "./categories.constants.js";

export default class CategoryService extends BaseService {
    constructor() {
        super(Category, {
            searchFields: ["name", "description"],
            defaultSort: "order",
            softDelete: true
        });
    }

    /* ============================================================
        ANCESTOR BUILDING
    ============================================================ */

    async buildAncestorPath(parentId) {
        if (!parentId) return [];

        const parent = await this.model.findOne({
            _id: parentId,
            deletedAt: null
        }).select("_id slug name ancestors level");

        if (!parent) throw new AppError("Parent category does not exist", 400);

        return [...parent.ancestors,
        {
            _id: parent._id,
            slug: parent.slug,
            name: parent.name
        }];
    }

    async validateNoCircularReference(id, newParentId) {
        if (!newParentId) return;
        if (id.toString() === newParentId.toString())
            throw new AppError("Category cannot be its own parent", 400);

        const descendants = await this.model.find({ "ancestors._id": id, deletedAt: null });

        if (descendants.some(d => d._id.toString() === newParentId.toString())) {
            throw new AppError("Circular reference detected", 400);
        }

        const parent = await this.model.findById(newParentId);

        if (parent && parent.level >= MAX_CATEGORY_DEPTH) {
            throw new AppError(`Max depth ${MAX_CATEGORY_DEPTH} exceeded`, 400);
        }
    }

    async validateParentExists(parentId) {
        if (!parentId) return;
        const exists = await this.model.exists({ _id: parentId, deletedAt: null });
        if (!exists)
            throw new AppError("Parent category not found", 400);
    }

    /* ============================================================
        CREATE ✅
    ============================================================ */

    async create(data) {
        if (data.parentId) await this.validateParentExists(data.parentId);
        const ancestors = await this.buildAncestorPath(data.parentId);
        const level = ancestors.length;
        return super.create({ ...data, ancestors, level });
    }

    /* ============================================================
        UPDATE ✅
    ============================================================ */

    async updateById(id, data) {
        if (data.parentId !== undefined) {
            await this.validateParentExists(data.parentId);
            await this.validateNoCircularReference(id, data.parentId);
            const ancestors = await this.buildAncestorPath(data.parentId);
            data.ancestors = ancestors;
            data.level = ancestors.length;
        }

        return super.updateById(id, data);
    }

    /* ============================================================
        TREE
    ============================================================ */

    async getFullTree() {

        const roots = await this.model.find({
            parentId: null,
            deletedAt: null,
            "status.isActive": true
        }).sort({ order: 1 });

        const tree = await Promise.all(
            roots.map(r => this.buildCategoryTree(r._id))
        );

        return this.success(tree);
    }

    async buildCategoryTree(id) {

        const category = await this.model.findById(id)
            .select("_id name slug icon order");

        if (!category) return null;

        const children = await this.model.find({
            parentId: id,
            deletedAt: null,
            "status.isActive": true
        }).sort({ order: 1 });

        return {
            ...category.toObject(),
            children: await Promise.all(children.map(c => this.buildCategoryTree(c._id)))
        };
    }

    /* ============================================================
        BREADCRUMB
    ============================================================ */

    async getBreadcrumb(id) {
        const category = await this.model.findById(id).select("_id name slug ancestors");
        if (!category) throw new AppError("Category not found", 404);

        const breadcrumb = [
            ...category.ancestors,
            { _id: category._id, name: category.name, slug: category.slug }
        ];

        return this.success(breadcrumb);
    }

    /* ============================================================
        DESCENDANTS
    ============================================================ */

    async getAllDescendants(id) {
        const data = await this.model.find({ "ancestors._id": id, deletedAt: null });
        return this.success(data);
    }

    /* ============================================================
        PRODUCT COUNT
    ============================================================ */

    syncProductCount(id, count) {
        return this.success(this.updateAtomic(id, { "metrics.productCount": count }));
    }

    incrementProductCount(id, amount = 1) {
        return this.success(this.updateAtomic(id, { $inc: { "metrics.productCount": amount } }));
    }

    decrementProductCount(id, amount = 1) {
        return this.incrementProductCount(id, -amount);
    }

    /* ============================================================
        DELETE CASCADE
    ============================================================ */

    async deleteWithCascade(id, strategy = "moveUp") {
        const category = await this.model.findById(id);
        if (!category)
            throw new AppError("Category not found", 404);

        const hasChildren =
            await this.model.exists({ parentId: id, deletedAt: null });

        if (hasChildren) {
            if (strategy === "moveUp") {
                await this.model.updateMany(
                    { parentId: id },
                    {
                        parentId: category.parentId || null,
                        ancestors: category.ancestors
                    }
                );
            }

            if (strategy === "archive") {
                await this.model.updateMany(
                    { parentId: id },
                    { "status.isActive": false }
                );
            }
        }

        return this.deleteById(id);
    }

    /* ============================================================
        ROOT / CHILDREN
    ============================================================ */

    async getRootCategories() {
        const data = await this.model.find({ parentId: null, deletedAt: null })
            .sort({ order: 1 });

        return this.success(data);
    }

    async getChildren(parentId) {
        const data = await this.model.find({ parentId, deletedAt: null })
            .sort({ order: 1 });
        return this.success(data);
    }
}

export const categoryService = new CategoryService();