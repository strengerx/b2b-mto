import { BaseService } from "../../shared/services/BaseService.js";
import Brand from "./brands.model.js";

export default class BrandsService extends BaseService {

    constructor() {
        super(Brand, {
            searchFields: ["name", "description", "labels"],
            softDelete: true,
            defaultSort: "order",
            defaultFilter: { "status.isActive": true }
        });
    }

    /* =========================
        PUBLIC QUERIES
    ========================= */

    getFeatured(query = {}) {
        const safeQuery = this.mergeQuery(query, { isFeatured: true });
        return this.findAll(safeQuery, ["name", "slug", "logo", "description", "metrics"]);
    }

    getVerified(query = {}) {
        return this.findAll(this.mergeQuery(query, { "status.isVerified": true }));
    }

    getByCountry(country, query = {}) {
        return this.findAll(this.mergeQuery(query, { country }));
    }

    getTopByProductCount(query = {}) {
        return this.findAll(
            { ...query, sort: "-metrics.productCount" },
            ["name", "slug", "logo", "metrics"]
        );
    }

    getTrending(query = {}, daysBack = 7) {
        const dateFrom = new Date(Date.now() - daysBack * 86400000);
        const safeQuery = this.mergeQuery(query, { updatedAt: { $gte: dateFrom } });
        safeQuery.sort = "-updatedAt";

        return this.findAll(
            safeQuery,
            ["name", "slug", "logo", "updatedAt"]
        );
    }

    /* =========================
        TEXT SEARCH
    ========================= */

    async search(term, limit = 20) {

        const filter = {
            $text: { $search: term },
            ...(this.softDelete && { deletedAt: null })
        };

        const data = await this.model
            .find(filter,
                { score: { $meta: "textScore" } }
            )
            .sort({ score: { $meta: "textScore" } })
            .limit(limit)
            .select("name slug logo description");

        return this.success(data);
    }

    /* =========================
        ADMIN ACTIONS
    ========================= */

    verify(id) {
        return this.updateById(id, { "status.isVerified": true });
    }

    unverify(id) {
        return this.updateById(id, { "status.isVerified": false });
    }

    incrementProductCount(id, value = 1) {
        return this.updateAtomic(id, { $inc: { "metrics.productCount": value } });
    }

    incrementViews(id) {
        return this.updateAtomic(id, { $inc: { "metrics.totalViews": 1 } });
    }
}

export const brandsService = new BrandsService();