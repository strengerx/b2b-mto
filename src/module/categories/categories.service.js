import { BaseService } from "../../shared/services/BaseService.js";
import Category from "./categories.model.js";

export class CategoryService extends BaseService {
    constructor() {
        super(Category, {
            searchFields: ["name", "description"],
            defaultSort: "order",
            softDelete: true
        });
    }

    // 🔥 Custom method
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
