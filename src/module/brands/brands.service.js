import { BaseService } from "../../shared/services/BaseService.js";
import Brand from "./brands.model.js";
import { AppError } from "../../shared/errors/AppError.js";

export default class BrandsService extends BaseService {
    constructor() {
        super(Brand, {
            searchFields: ["name", "description", "labels"],
            softDelete: true,
            defaultSort: "order",
            defaultFilter: {
                "status.isActive": true
            }
        });
    }

    /**
     * ============================================================================
     * PUBLIC BRAND QUERIES
     * ============================================================================
     */

    async getFeatured(query = {}) {
        query.customFilter = {
            isFeatured: true
        };

        return this.findAll(
            query,
            ["name", "slug", "logo", "description", "metrics", "status"]
        );
    }

    async getVerified(query = {}) {
        query.customFilter = {
            "status.isVerified": true
        };

        return this.findAll(query);
    }

    async getByCountry(country, query = {}) {
        query.customFilter = {
            country
        };

        return this.findAll(query);
    }

    async getTopByProductCount(query = {}) {
        query.sort = "-metrics.productCount";

        return this.findAll(
            query,
            ["name", "slug", "logo", "metrics"]
        );
    }

    async getTrending(query = {}, daysBack = 7) {
        const dateFrom =
            new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

        query.customFilter = {
            updatedAt: { $gte: dateFrom }
        };

        query.sort = "-updatedAt";

        return this.findAll(
            query,
            ["name", "slug", "logo", "description", "updatedAt"]
        );
    }

    /**
     * ============================================================================
     * TEXT SEARCH (Mongo Text Index)
     * ============================================================================
     */

    async search(searchTerm, limit = 20) {
        return this.model
            .find(
                {
                    $text: { $search: searchTerm }
                },
                { score: { $meta: "textScore" } }
            )
            .limit(limit)
            .sort({ score: { $meta: "textScore" } })
            .select("name slug logo description");
    }

    /**
     * ============================================================================
     * PUBLISHED FILTER
     * ============================================================================
     */

    async getPublished(query = {}, fields = null) {

        const filter = {};

        if (query.country)
            filter.country = query.country;

        if (query.isFeatured === "true")
            filter.isFeatured = true;

        if (query.isVerified === "true")
            filter["status.isVerified"] = true;

        if (query.showInHomepage === "true")
            filter.showInHomepage = true;

        // ✅ create NEW object instead of modifying query
        const safeQuery = {
            ...query,
            customFilter: filter
        };

        return this.findAll(safeQuery, fields);
    }

    /**
     * ============================================================================
     * CREATE BRAND
     * ============================================================================
     */

    async create(data) {
        try {
            return await super.create(data);
        } catch (err) {
            if (err.code === 11000) {
                throw new AppError(
                    "Brand with same name or slug already exists",
                    400
                );
            }
            throw err;
        }
    }

    /**
     * ============================================================================
     * ADMIN ACTIONS
     * ============================================================================
     */

    async verify(brandId) {
        return this.updateById(brandId, {
            "status.isVerified": true
        });
    }

    async unverify(brandId) {
        return this.updateById(brandId, {
            "status.isVerified": false
        });
    }

    async incrementProductCount(brandId, value = 1) {
        return this.model.findByIdAndUpdate(
            brandId,
            { $inc: { "metrics.productCount": value } },
            { new: true }
        );
    }

    async decrementProductCount(brandId, value = 1) {
        return this.incrementProductCount(brandId, -value);
    }

    async updatePopularityScore(brandId, score) {
        return this.updateById(brandId, {
            "metrics.popularityScore": score
        });
    }

    async incrementViews(brandId) {
        return this.model.findByIdAndUpdate(
            brandId,
            { $inc: { "metrics.totalViews": 1 } },
            { new: true }
        );
    }
}

export const brandsService = new BrandsService();